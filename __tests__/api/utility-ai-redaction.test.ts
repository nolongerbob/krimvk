/** @jest-environment node */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/require-admin', () => ({ requireAdmin: async () => ({ ok: true, admin: { userId: 'admin' } }) }));
jest.mock('@/lib/get-session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { answerTemplate: { findMany: jest.fn() }, knowledgeBaseArticle: { findMany: jest.fn() }, question: { findUnique: jest.fn() }, service: { findMany: jest.fn() }, message: { findMany: jest.fn() } } }));
const db = prisma as any;
const secret = 'GeneratedPasswordShouldNotLeaveTheSite';
beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = 'fake-test-key';
  db.answerTemplate.findMany.mockResolvedValue([]); db.knowledgeBaseArticle.findMany.mockResolvedValue([]); db.service.findMany.mockResolvedValue([]);
  db.question.findUnique.mockImplementation(async (query: any) => ({ messages: query.include.messages.where?.isSensitive === false ? [{ text: 'Safe question', isFromAdmin: false }] : [{ text: secret, isFromAdmin: true }] }));
  db.message.findMany.mockImplementation(async (query: any) => query.where?.isSensitive === false ? [{ text: 'Safe response', isFromAdmin: true }] : [{ text: secret, isFromAdmin: true }]);
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{"article":null,"template":null,"reason":"No reusable content"}' } }] }) })) as jest.Mock;
});
afterAll(() => { delete process.env.DEEPSEEK_API_KEY; });
it('excludes sensitive stored chat messages and recent answer examples from AI generation', async () => {
  const { POST } = await import('@/app/api/admin/ai/generate-response/route');
  await POST(new NextRequest('http://localhost/api/admin/ai/generate-response', { method: 'POST', body: JSON.stringify({ questionId: 'chat', userMessage: 'Safe question' }) }));
  expect(global.fetch).toHaveBeenCalled();
  expect((global.fetch as jest.Mock).mock.calls[0][1].body).not.toContain(secret);
});
it('ignores client-submitted transcripts and loads only non-sensitive messages for knowledge generation', async () => {
  const { POST } = await import('@/app/api/admin/ai/add-to-knowledge/route');
  await POST(new NextRequest('http://localhost/api/admin/ai/add-to-knowledge', { method: 'POST', body: JSON.stringify({ questionId: 'chat', messages: [{ text: secret, isFromAdmin: true }] }) }));
  expect(db.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { questionId: 'chat', isSensitive: false } }));
  expect(global.fetch).toHaveBeenCalled(); expect((global.fetch as jest.Mock).mock.calls[0][1].body).not.toContain(secret);
});
