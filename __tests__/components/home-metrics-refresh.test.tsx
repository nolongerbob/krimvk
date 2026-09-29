import { act, render } from '@testing-library/react';
import { HomeQuickActions } from '@/components/HomeQuickActions';
import { HomeAccountProvider } from '@/components/HomeAccountProvider';
jest.mock('next-auth/react', () => ({ useSession: () => ({ status: 'authenticated', data: { user: { id: 'test-user' } } }) }));
jest.mock('@/components/dashboard/QuickActionMetrics', () => ({ PaymentMetric: () => null, ReadingMetric: () => null }));

it('does not reload metrics on focus, visibility changes or a timer', async () => {
  jest.useFakeTimers();
  const original = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ stats: { activeApplications: 0 }, selectedAccountId: null, accountData: null }) });
  global.fetch = fetchMock;
  try {
    await act(async () => { render(<HomeAccountProvider><HomeQuickActions /></HomeAccountProvider>); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
      jest.advanceTimersByTime(180000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally { global.fetch = original; jest.useRealTimers(); }
});
