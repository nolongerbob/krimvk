/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/admin/news/notices/route';
import { GET as publicGET } from '@/app/api/news/notices/route';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/require-admin',()=>({requireAdmin:jest.fn()}));
jest.mock('@/lib/prisma',()=>({prisma:{siteNotice:{findFirst:jest.fn(),findMany:jest.fn(),findUnique:jest.fn(),create:jest.fn(),update:jest.fn()},news:{findMany:jest.fn(),findUnique:jest.fn()}}}));
const db=prisma as any, auth=requireAdmin as jest.Mock;
const original=process.env;
const body={text:'Тарифы',buttonLabel:'Что изменится',newsId:'article',startsAt:'2026-09-21T12:00',endsAt:'2026-10-01T00:00',enabled:true};
const request=(data:any)=>new NextRequest('http://localhost/api/admin/news/notices',{method:'POST',body:JSON.stringify(data)});
beforeEach(()=>{jest.resetAllMocks();process.env={...original,NODE_ENV:'development'};auth.mockResolvedValue({ok:true,admin:{userId:'admin'}});db.news.findUnique.mockResolvedValue({published:true});db.siteNotice.create.mockResolvedValue({id:'n'});});
afterEach(()=>{process.env=original;});
it.each([401,403])('denies unauthorized access %s before reading or writing DB',async status=>{
  auth.mockResolvedValue({ok:false,response:NextResponse.json({}, {status})});
  expect((await GET()).status).toBe(status);expect((await POST(request(body))).status).toBe(status);
  expect(db.news.findUnique).not.toHaveBeenCalled();expect(db.siteNotice.findMany).not.toHaveBeenCalled();
});
it('blocks all notice endpoints in production',async()=>{
  process.env={...original,NODE_ENV:'production'};
  expect((await GET()).status).toBe(404);expect((await POST(request(body))).status).toBe(404);expect((await publicGET()).status).toBe(404);expect(auth).not.toHaveBeenCalled();
});
it('saves a valid published link with UTC dates',async()=>{
  expect((await POST(request(body))).status).toBe(200);
  expect(db.siteNotice.create).toHaveBeenCalledWith({data:{...body,startsAt:new Date('2026-09-21T09:00Z'),endsAt:new Date('2026-09-30T21:00Z')}});
});
it.each([null,{published:false}])('rejects missing or unpublished target %j',async value=>{
  db.news.findUnique.mockResolvedValue(value);expect((await POST(request(body))).status).toBe(400);expect(db.siteNotice.create).not.toHaveBeenCalled();
});
it('rejects invalid periods without DB writes',async()=>{expect((await POST(request({...body,endsAt:body.startsAt}))).status).toBe(400);expect(db.siteNotice.create).not.toHaveBeenCalled();});
it('edits an existing notice and allows disabling it',async()=>{
  db.siteNotice.findUnique.mockResolvedValue({id:'n'});db.siteNotice.update.mockResolvedValue({id:'n'});
  expect((await POST(request({...body,id:'n',enabled:false}))).status).toBe(200);expect(db.siteNotice.update).toHaveBeenCalled();
});
it('public endpoint filters schedule and publication and disables caching',async()=>{
  db.siteNotice.findFirst.mockResolvedValue(null);const response=await publicGET();expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(db.siteNotice.findFirst.mock.calls[0][0].where).toMatchObject({enabled:true,news:{published:true},startsAt:{lte:expect.any(Date)},endsAt:{gt:expect.any(Date)}});
});
