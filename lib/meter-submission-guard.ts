import { createHash } from 'crypto';
import { mkdir, open } from 'fs/promises';
import path from 'path';
export class MeterSubmissionError extends Error {
  constructor(message:string,public code:string,public status=409){super(message);}
}
export function meterPeriod(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=(type:string)=>parts.find(p=>p.type===type)!.value;
  return {key:`${get('year')}-${get('month')}`,year:Number(get('year')),month:Number(get('month')),day:Number(get('day'))};
}
export function historyDate(value:unknown):Date {
  const text=String(value??'').trim();let date:Date;
  const ru=text.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if(ru)date=new Date(`${ru[3]}-${ru[2]}-${ru[1]}T${ru[4]||'12'}:${ru[5]||'00'}:${ru[6]||'00'}+03:00`);
  else if(/^\d{10}$/.test(text))date=new Date(Number(text)*1000);
  else if(/^\d{13}$/.test(text))date=new Date(Number(text));
  else if(/^\d{4}-\d{2}-\d{2}/.test(text))date=new Date(text.length===10?`${text}T12:00:00+03:00`:text);
  else throw new Error('Unknown history date');
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid history date');return date;
}
export function hasMonthlyReading(payload:unknown,device:string,period:string):boolean {
  if(!payload||typeof payload!=='object')throw new Error('Invalid history');
  const body=payload as Record<string,unknown>;
  if(body.Error||body.error)throw new Error('History error');
  const history=Array.isArray(payload)?payload:body.History??body.history;
  if(!history||typeof history!=='object')throw new Error('Missing history');
  const entries:{item:Record<string,unknown>;date?:string}[]=[];
  if(Array.isArray(history))for(const item of history)entries.push({item});
  else for(const [date,items] of Object.entries(history)){
    if(!Array.isArray(items))throw new Error('Invalid history group');
    for(const item of items)entries.push({item,date});
  }
  let found=false;
  for(const {item,date} of entries){
    if(!item||typeof item!=='object')throw new Error('Invalid history row');
    const number=item.NumberOfDevice??item.DeviceNumber??item.Number??item.DeviceId??item.Id;
    if(number===undefined||!String(number).trim())throw new Error('Missing meter number');
    if(String(number).trim()!==device.trim())continue;
    if(meterPeriod(historyDate(item.ReadingDate??item.Date??item.readingDate??item.DateOfHistory??date)).key===period)found=true;
  }return found;
}
/** Persistent exclusive reservation before the external write. Shared by all
 * processes on this VPS. Never auto-delete pending/unknown results. */
export async function reserveMeterSubmission(region:string,account:string,device:string,reading:number,period:string){
  if (process.env.NODE_ENV === 'production' && (!process.env.METER_SUBMISSION_DIR || !path.isAbsolute(process.env.METER_SUBMISSION_DIR))) {
    throw new MeterSubmissionError('Передача показаний временно недоступна: не настроено постоянное хранилище защиты от повторов.', 'METER_STORAGE_UNCONFIGURED', 503);
  }
  const dir=process.env.METER_SUBMISSION_DIR||path.join(process.cwd(),'.meter-submissions');
  const key=createHash('sha256').update(JSON.stringify([region.trim(),account.trim(),device.trim(),period])).digest('hex');
  await mkdir(dir,{recursive:true,mode:0o700});let handle;
  try{handle=await open(path.join(dir,`${key}.json`),'wx',0o600);}catch(error){
    if((error as NodeJS.ErrnoException).code==='EEXIST')throw new MeterSubmissionError('Показания этого счётчика уже отправлены или ожидают проверки. Повторная отправка заблокирована; при ошибке обратитесь к оператору.','METER_ALREADY_RESERVED');
    throw error;
  }
  const record={region,account,device,reading,period,createdAt:new Date().toISOString()};
  try{await handle.writeFile(JSON.stringify({...record,state:'pending'}));await handle.sync();}finally{await handle.close();}
  const directory=await open(dir,'r');try{await directory.sync();}finally{await directory.close();}
  return async(state:'accepted'|'unknown')=>{
    const file=await open(path.join(dir,`${key}.json`),'r+');
    try{await file.truncate(0);await file.writeFile(JSON.stringify({...record,state,updatedAt:new Date().toISOString()}));await file.sync();}finally{await file.close();}
  };
}
