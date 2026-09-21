import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { submitMeterReading } from '@/lib/1c-api';
import { decryptPassword1c } from '@/lib/password1c-crypto';
import { parseMeterNumber } from '@/lib/parse-meter-number';
import { MeterSubmissionError } from '@/lib/meter-submission-guard';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
  try{
    const session=await getAppSession(request);
    if(!session?.user?.id)return NextResponse.json({error:'Не авторизован'},{status:401});
    const {accountId,deviceNumber,reading}=await request.json();
    if(typeof accountId!=='string'||typeof deviceNumber!=='string'||!deviceNumber.trim()||reading===undefined)return NextResponse.json({error:'Не указаны обязательные параметры'},{status:400});
    const value=parseMeterNumber(reading);
    if(!Number.isFinite(value)||value<0)return NextResponse.json({error:'Неверное значение показаний'},{status:400});
    const account=await prisma.userAccount.findFirst({where:{id:accountId,userId:session.user.id,isActive:true}});
    if(!account)return NextResponse.json({error:'Лицевой счёт не найден'},{status:404});
    const password=decryptPassword1c(account.password1c);
    if(!password||!account.region)return NextResponse.json({error:'Не настроены данные лицевого счёта. Обратитесь к оператору.'},{status:400});
    const result=await submitMeterReading(account.accountNumber,password,deviceNumber.trim(),value,account.region);
    return NextResponse.json({success:true,result});
  }catch(error){
    if(error instanceof MeterSubmissionError)return NextResponse.json({error:error.message,code:error.code},{status:error.status});
    console.error('Meter submission failed',error instanceof Error?error.name:'unknown');
    return NextResponse.json({error:'Передача показаний не подтверждена. Не повторяйте отправку, обратитесь к оператору.'},{status:503});
  }
}
