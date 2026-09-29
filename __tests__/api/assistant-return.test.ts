/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/assistant/return-to-ai/route';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/get-app-session',()=>({getAppSession:jest.fn()}));
jest.mock('@/lib/assistant-test-support',()=>({isAssistantTestSupportEnabled:()=>true}));
jest.mock('@/lib/prisma',()=>({prisma:{$transaction:jest.fn()}}));
const tx={ $queryRaw:jest.fn(),question:{findFirst:jest.fn(),updateMany:jest.fn()},message:{create:jest.fn()} };
const original=process.env.NODE_ENV;
beforeEach(()=>{
  jest.resetAllMocks();Object.defineProperty(process.env,'NODE_ENV',{value:'development',configurable:true});
  (getAppSession as jest.Mock).mockResolvedValue({user:{id:'owner'}});
  (prisma.$transaction as jest.Mock).mockImplementation(fn=>fn(tx));
  tx.question.findFirst.mockResolvedValue({id:'q',status:'COMPLETED',messages:[]});
  tx.question.updateMany.mockResolvedValue({count:1});
});
afterEach(()=>Object.defineProperty(process.env,'NODE_ENV',{value:original,configurable:true}));
const request=(origin='http://localhost:3005')=>new NextRequest('http://localhost:3005/api/assistant/return-to-ai',{method:'POST',headers:{origin},body:JSON.stringify({questionId:'q',userId:'someone-else'})});
it('closes only the session owner’s conversation and preserves its messages',async()=>{
  expect((await POST(request())).status).toBe(200);
  expect(tx.question.findFirst).toHaveBeenCalledWith({where:{id:'q',userId:'owner'}});
  expect(tx.question.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({id:'q',userId:'owner'}),data:{status:'COMPLETED'}}));
  expect(tx.message.create).toHaveBeenCalledTimes(1);
});
it('does not close someone else’s dialogue',async()=>{
  tx.question.findFirst.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(404);expect(tx.question.updateMany).not.toHaveBeenCalled();
});
it('does not duplicate completion messages on repeated requests',async()=>{
  tx.question.updateMany.mockResolvedValue({count:0});
  expect((await POST(request())).status).toBe(200);expect(tx.message.create).not.toHaveBeenCalled();
});
it('denies guests and cross-origin requests',async()=>{
  expect((await POST(request('https://other.example'))).status).toBe(403);
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401);expect(prisma.$transaction).not.toHaveBeenCalled();
});
