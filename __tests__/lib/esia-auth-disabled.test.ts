/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ getUserByEmail: jest.fn(), verifyPassword: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { user: { create: jest.fn() }, account: { create: jest.fn() } } }));
jest.mock('@/lib/site-url', () => ({ applyCanonicalSiteUrl: jest.fn() }));

it('legacy credentials cannot activate ESIA or auto-link accounts', async () => {
  const oldId = process.env.GOSUSLUGI_CLIENT_ID;
  const oldSecret = process.env.GOSUSLUGI_CLIENT_SECRET;
  process.env.GOSUSLUGI_CLIENT_ID = 'test'; process.env.GOSUSLUGI_CLIENT_SECRET = 'test';
  try {
    const { authOptions } = await import('@/lib/auth-config');
    expect(authOptions.providers.map(p => p.id)).toEqual(['credentials']);
    const signIn = authOptions.callbacks!.signIn!;
    expect(await signIn({ account: { provider: 'gosuslugi' }, user: { email: 'existing@example.invalid' } } as any)).toBe(false);
    expect(await signIn({ account: { provider: 'credentials' }, user: { id: 'local' } } as any)).toBe(true);
    const { prisma } = await import('@/lib/prisma');
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.account.create).not.toHaveBeenCalled();
  } finally {
    if (oldId === undefined) delete process.env.GOSUSLUGI_CLIENT_ID; else process.env.GOSUSLUGI_CLIENT_ID = oldId;
    if (oldSecret === undefined) delete process.env.GOSUSLUGI_CLIENT_SECRET; else process.env.GOSUSLUGI_CLIENT_SECRET = oldSecret;
  }
});
