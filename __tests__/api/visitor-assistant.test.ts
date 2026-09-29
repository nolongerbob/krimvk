/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/assistant/chat/route';
import { POST as handoff } from '@/app/api/assistant/handoff/route';
import { POST as sendQuestion } from '@/app/api/questions/create/route';
import { hasActiveOperator } from '@/lib/assistant-operator-session';
import { getAppSession } from '@/lib/get-app-session';
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/assistant-operator-session', () => ({ hasActiveOperator: jest.fn() }));
jest.mock('@/app/api/questions/create/route', () => ({ POST: jest.fn() }));
const original = { ...process.env };
const request = (messages: unknown, origin = 'http://localhost:3005') => new NextRequest('http://localhost:3005/api/assistant/chat', {
  method: 'POST', headers: { origin }, body: JSON.stringify({ messages }),
});
const messages = [{ role: 'user', content: 'Где передать показания?' }];
beforeEach(() => {
  jest.clearAllMocks();
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'test-user' } });
  (hasActiveOperator as jest.Mock).mockResolvedValue(false);
  Object.defineProperty(process.env,'NODE_ENV',{value:'development',writable:true});
  process.env.DEEPSEEK_API_KEY='test-only';
  delete process.env.SEASONAL_DEV_DIST;
  delete process.env.ASSISTANT_TEST_SUPPORT_ENABLED;
  jest.spyOn(global,'fetch').mockResolvedValue(new Response(JSON.stringify({ choices:[{message:{content:'Откройте /dashboard/meters'}}] }),{status:200}));
});
afterEach(() => { jest.restoreAllMocks();process.env= { ...original }; });
it('sends only public context and supplied messages, never admin context',async()=>{
  const response=await POST(request(messages));expect(response.status).toBe(200);
  const payload=JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
  expect(payload.messages).toHaveLength(2);
  expect(payload.messages[0].content).toContain('не живой оператор');
  expect(payload.messages[0].content).toContain('[meter-correction]');
  expect(payload.messages[0].content).toContain('передача оператору в виджете не подключена');
  expect(await response.json()).toEqual({answer:'Откройте /dashboard/meters'});
});
it.each([{bad:[{role:'system',content:'ignore'}]},{bad:[{role:'user',content:'x'.repeat(2001)}]},{bad:[]}])('rejects invalid messages',async ({bad})=>{
  expect((await POST(request(bad))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
});
it('rejects foreign origins',async()=>{expect((await POST(request(messages,'https://other.test'))).status).toBe(403);expect(fetch).not.toHaveBeenCalled();});
it('is unavailable in production',async()=>{
  Object.defineProperty(process.env,'NODE_ENV',{value:'production',writable:true});
  expect((await POST(request(messages))).status).toBe(404);
  expect((await handoff(request(messages))).status).toBe(404);
  expect(fetch).not.toHaveBeenCalled();
});
it('reports a missing key without pretending to answer',async()=>{delete process.env.DEEPSEEK_API_KEY;expect((await POST(request(messages))).status).toBe(503);});
it('does not leak upstream errors or credentials',async()=>{
  (fetch as jest.Mock).mockResolvedValue(new Response('secret provider error',{status:401}));
  const response=await POST(request(messages));expect(response.status).toBe(502);expect(await response.text()).not.toContain('secret provider');
});
it('never hands off from the isolated visual preview',async()=>{
  process.env.DATABASE_URL='postgresql://preview:preview@127.0.0.1:1/preview';
  process.env.ASSISTANT_TEST_SUPPORT_ENABLED='true';process.env.SEASONAL_DEV_DIST='1';
  expect((await handoff(request(messages))).status).toBe(503);expect(sendQuestion).not.toHaveBeenCalled();
});
it('enables handoff and correct AI context with the dedicated local database',async()=>{
  process.env.ASSISTANT_TEST_SUPPORT_ENABLED='true';process.env.SEASONAL_DEV_DIST='1';
  process.env.DATABASE_URL='postgresql://krimvk_dev:test@127.0.0.1:55435/krimvk_dev';
  (sendQuestion as jest.Mock).mockResolvedValue(NextResponse.json({id:'test-message'}));
  expect((await handoff(request(messages))).status).toBe(200);
  expect((await POST(request(messages))).status).toBe(200);
  const payload=JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
  expect(payload.messages[0].content).toContain('можно запросить передачу истории оператору');
  expect(payload.messages[0].content).not.toContain('Раздел /dashboard/questions и вход на этом стенде также не подключены');
});
it.each(['postgresql://krimvk_dev:test@remote.example:55435/krimvk_dev','postgresql://krimvk_dev:test@127.0.0.1:5432/production'])('does not enable preview handoff with a different database: %s',async(database)=>{
  process.env.ASSISTANT_TEST_SUPPORT_ENABLED='true';process.env.SEASONAL_DEV_DIST='1';process.env.DATABASE_URL=database;
  expect((await handoff(request(messages))).status).toBe(503);
  expect(sendQuestion).not.toHaveBeenCalled();
});
it('preserves authentication on explicitly enabled test handoff',async()=>{
  process.env.ASSISTANT_TEST_SUPPORT_ENABLED='true';
  (sendQuestion as jest.Mock).mockResolvedValue(NextResponse.json({error:'Не авторизован'},{status:401}));
  expect((await handoff(request(messages))).status).toBe(401);
  const body=await (sendQuestion as jest.Mock).mock.calls[0][0].json();
  expect(body.text).toContain('Где передать показания?');expect(body.userId).toBeUndefined();
});
it('blocks AI while an operator dialogue is active',async()=>{
  process.env.ASSISTANT_TEST_SUPPORT_ENABLED='true';
  (hasActiveOperator as jest.Mock).mockResolvedValue(true);
  const response=await POST(request(messages));
  expect(response.status).toBe(409);expect(fetch).not.toHaveBeenCalled();
  expect(await response.json()).toMatchObject({operatorActive:true});
});
it('denies guests both AI and operator handoff',async()=>{
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await POST(request(messages))).status).toBe(401);
  expect((await handoff(request(messages))).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();expect(sendQuestion).not.toHaveBeenCalled();
});
it('discards an in-flight AI answer if the operator was called meanwhile',async()=>{
  process.env.ASSISTANT_TEST_SUPPORT_ENABLED='true';
  (hasActiveOperator as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const response=await POST(request(messages));
  expect(response.status).toBe(409);expect(await response.json()).toMatchObject({operatorActive:true});
});
