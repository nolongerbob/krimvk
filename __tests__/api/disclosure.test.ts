/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET, dynamic } from '@/app/api/disclosure/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({ prisma: { disclosureDocument: { findMany: jest.fn() } } }));
const findMany = prisma.disclosureDocument.findMany as jest.Mock;
beforeEach(() => jest.clearAllMocks());

it('serves only active public documents and is request-time, not prerendered', async () => {
  expect(dynamic).toBe('force-dynamic');
  findMany.mockResolvedValue([{ id: 'public-document' }]);
  const response = await GET(new NextRequest('http://localhost/api/disclosure'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([{ id: 'public-document' }]);
  expect(findMany).toHaveBeenCalledWith({
    where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
});

it('applies search and category independently on each request', async () => {
  findMany.mockResolvedValue([]);
  await GET(new NextRequest('http://localhost/api/disclosure?category=reports&search=water'));
  expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: {
    isActive: true, category: 'reports', OR: [
      { title: { contains: 'water', mode: 'insensitive' } },
      { fileName: { contains: 'water', mode: 'insensitive' } },
    ],
  } }));
  await GET(new NextRequest('http://localhost/api/disclosure?category=licenses'));
  expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { isActive: true, category: 'licenses' } }));
});

it('returns a generic error if document storage is unavailable', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    findMany.mockRejectedValue(new Error('database unavailable'));
    const response = await GET(new NextRequest('http://localhost/api/disclosure'));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Ошибка при загрузке данных' });
  } finally { log.mockRestore(); }
});
