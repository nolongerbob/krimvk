import { activeNoticeWhere, dateToMoscowInput, moscowInputToDate, parseNotice } from '@/lib/site-notices';
const valid={text:' Тарифы ',buttonLabel:'Подробнее',newsId:'news',startsAt:'2026-09-21T12:00',endsAt:'2026-10-01T00:00',enabled:true};
it('converts explicitly from Moscow time to UTC and back',()=>{
  expect(moscowInputToDate(valid.startsAt).toISOString()).toBe('2026-09-21T09:00:00.000Z');
  expect(dateToMoscowInput('2026-09-21T09:00:00Z')).toBe(valid.startsAt);
  expect(parseNotice(valid).text).toBe('Тарифы');
});
it.each(['2026-02-30T12:00','2026-13-01T12:00','bad','2026-01-01T25:00'])('rejects invalid date %s',value=>expect(()=>moscowInputToDate(value)).toThrow());
it.each([{endsAt:valid.startsAt},{endsAt:'2026-09-01T12:00'},{text:''},{text:'a'.repeat(201)},{newsId:''},{enabled:'true'}])('rejects malformed input %j',change=>expect(()=>parseNotice({...valid,...change})).toThrow());
it('requires start <= now < end and a published article',()=>{
  const now=new Date(); expect(activeNoticeWhere(now)).toEqual({enabled:true,startsAt:{lte:now},endsAt:{gt:now},news:{published:true}});
});
