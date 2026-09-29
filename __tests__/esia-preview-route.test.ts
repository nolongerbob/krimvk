jest.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
jest.mock('@/lib/require-admin', () => ({ requireAdminPage: jest.fn().mockResolvedValue({ userId: 'admin' }) }));
import EsiaPreviewPage from '@/app/dev/esia/page';
import { requireAdminPage } from '@/lib/require-admin';

const original = process.env;
afterEach(() => { process.env = original; });
it.each(['production', 'test', 'development'])('returns not found without opt-in in %s', async environment => {
  process.env = { ...original, NODE_ENV: environment as typeof process.env.NODE_ENV, ESIA_DEV_PREVIEW: 'false' };
  await expect(EsiaPreviewPage()).rejects.toThrow('NOT_FOUND');
});
it('ignores opt-in in production', async () => {
  process.env = { ...original, NODE_ENV: 'production', ESIA_DEV_PREVIEW: 'true' };
  await expect(EsiaPreviewPage()).rejects.toThrow('NOT_FOUND');
});
it('renders only with dev opt-in and administrator authorization', async () => {
  process.env = { ...original, NODE_ENV: 'development', ESIA_DEV_PREVIEW: 'true' };
  expect(await EsiaPreviewPage()).toBeTruthy();
  expect(requireAdminPage).toHaveBeenCalledWith('/dev/esia');
});

it('does not render configuration when administrator authorization fails', async () => {
  process.env = { ...original, NODE_ENV: 'development', ESIA_DEV_PREVIEW: 'true' };
  (requireAdminPage as jest.Mock).mockRejectedValueOnce(new Error('UNAUTHORIZED'));
  await expect(EsiaPreviewPage()).rejects.toThrow('UNAUTHORIZED');
});
