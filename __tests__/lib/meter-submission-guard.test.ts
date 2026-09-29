/** @jest-environment node */
import {mkdtemp,readdir,readFile,rm} from 'fs/promises';
import {tmpdir} from 'os';
import path from 'path';
import {hasMonthlyReading,historyDate,meterPeriod,reserveMeterSubmission} from '@/lib/meter-submission-guard';
import {submitMeterReading} from '@/lib/1c-api';
let dir:string;
const original={...process.env};
beforeEach(async()=>{
  dir=await mkdtemp(path.join(tmpdir(),'krimvk-meter-test-'));
  process.env.METER_SUBMISSION_DIR=dir;process.env.ONE_C_API_BASE_URL='https://one-c.test';
  jest.useFakeTimers({doNotFake:['nextTick','setImmediate']});jest.setSystemTime(new Date('2026-09-21T09:00:00Z'));
});
afterEach(async()=>{jest.useRealTimers();jest.restoreAllMocks();process.env={...original};await rm(dir,{recursive:true,force:true});});
const row={NumberOfDevice:'5181279',Reading:'1 248,000'};
it('recognizes the exact timestamp-grouped production format',()=>{
  expect(hasMonthlyReading({History:{'1789948800':[row]}},'5181279','2026-09')).toBe(true);
  expect(hasMonthlyReading({History:{'1789948800':[row]}},'other','2026-09')).toBe(false);
});
it.each(['21.09.2026','21.09.2026 00:00:00','2026-09-21T00:00:00','2026-09-21','1789948800'])('parses %s',date=>{
  expect(meterPeriod(historyDate(date)).key).toBe('2026-09');
  expect(hasMonthlyReading({History:[{...row,DateOfHistory:date}]},'5181279','2026-09')).toBe(true);
});
it.each([{},{Error:'failed'},{History:null},{History:'wrong'},{History:[row]}])('fails closed for malformed history %j',payload=>{
  expect(()=>hasMonthlyReading(payload,'5181279','2026-09')).toThrow();
});
it('accepts an explicitly empty history',()=>expect(hasMonthlyReading({History:{}},'5181279','2026-09')).toBe(false));
it('requires an explicit persistent absolute reservation directory in production', async () => {
  Object.assign(process.env, { NODE_ENV: 'production' });
  delete process.env.METER_SUBMISSION_DIR;
  await expect(reserveMeterSubmission('saki','a','m',100,'2026-09')).rejects.toMatchObject({ code: 'METER_STORAGE_UNCONFIGURED' });
  process.env.METER_SUBMISSION_DIR = '.meter-submissions';
  await expect(reserveMeterSubmission('saki','a','m',100,'2026-09')).rejects.toMatchObject({ code: 'METER_STORAGE_UNCONFIGURED' });
});
it('allows only one concurrent reservation and blocks changed values',async()=>{
  const results=await Promise.allSettled(Array.from({length:12},(_,i)=>reserveMeterSubmission('saki','a','m',100+i,'2026-09')));
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  expect(await readdir(dir)).toHaveLength(1);
});
it('retains accepted and unknown reservations, independent of upstream deletion',async()=>{
  const finish=await reserveMeterSubmission('saki','a','m',100,'2026-09');await finish('unknown');
  await expect(reserveMeterSubmission('saki','a','m',110,'2026-09')).rejects.toMatchObject({code:'METER_ALREADY_RESERVED'});
  const record=JSON.parse(await readFile(path.join(dir,(await readdir(dir))[0]),'utf8'));
  expect(record.state).toBe('unknown');
  await expect(reserveMeterSubmission('saki','a','m',110,'2026-10')).resolves.toBeInstanceOf(Function);
});
it('blocks read-only dev submissions before any network request or reservation',async()=>{
  process.env.ONE_C_READ_ONLY='true';
  const fetchMock=jest.spyOn(global,'fetch');
  await expect(submitMeterReading('a','secret','m',100,'saki')).rejects.toMatchObject({code:'ONE_C_READ_ONLY',status:403});
  expect(fetchMock).not.toHaveBeenCalled();
  expect(await readdir(dir)).toHaveLength(0);
});
it('does not write to 1C when history already contains this month',async()=>{
  const fetchMock=jest.spyOn(global,'fetch').mockResolvedValue(new Response(JSON.stringify({History:{'1789948800':[row]}})));
  await expect(submitMeterReading('a','secret','5181279',1273,'saki')).rejects.toMatchObject({code:'METER_ALREADY_SENT'});
  expect(fetchMock).toHaveBeenCalledTimes(1);expect(await readdir(dir)).toHaveLength(0);
});
it('does not write to 1C when history is unavailable',async()=>{
  const fetchMock=jest.spyOn(global,'fetch').mockRejectedValue(new Error('timeout'));
  await expect(submitMeterReading('a','secret','m',100,'saki')).rejects.toMatchObject({code:'METER_HISTORY_UNAVAILABLE'});
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('serializes simultaneous external sends even if history stays empty',async()=>{
  let writes=0;
  jest.spyOn(global,'fetch').mockImplementation(async input=>{
    if(String(input).includes('/set_metering')){writes++;return new Response(JSON.stringify({success:true}));}
    return new Response(JSON.stringify({History:{}}));
  });
  const results=await Promise.allSettled([submitMeterReading('a','secret','m',100,'saki'),submitMeterReading('a','secret','m',100,'saki')]);
  expect(writes).toBe(1);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  await expect(submitMeterReading('a','secret','m',101,'saki')).rejects.toMatchObject({code:'METER_ALREADY_RESERVED'});
  expect(writes).toBe(1);
});
it('never retries an ambiguous external write and persists its state',async()=>{
  let writes=0;
  jest.spyOn(global,'fetch').mockImplementation(async input=>{
    if(String(input).includes('/set_metering')){writes++;throw new Error('timeout after 1C accepted');}
    return new Response(JSON.stringify({History:[]}));
  });
  await expect(submitMeterReading('a','secret','m',100,'saki')).rejects.toMatchObject({code:'METER_RESULT_UNKNOWN'});
  await expect(submitMeterReading('a','secret','m',100,'saki')).rejects.toMatchObject({code:'METER_ALREADY_RESERVED'});
  expect(writes).toBe(1);
  expect(await readFile(path.join(dir,(await readdir(dir))[0]),'utf8')).not.toContain('secret');
});
