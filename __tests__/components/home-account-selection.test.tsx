import { act, fireEvent, render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { HomeAccountProvider } from '@/components/HomeAccountProvider';
import { HomeAccountMap } from '@/components/HomeAccountMap';
import { HomeExpandableMap } from '@/components/HomeExpandableMap';
import { HomeMobileAccountSelect } from '@/components/HomeMobileAccountSelect';
import { HomeQuickActions } from '@/components/HomeQuickActions';
import type { DashboardOverview } from '@/hooks/use-dashboard-overview';

// Avoid jsdom's :has() selector parser failing on React's colon-delimited IDs.
jest.mock('react', () => ({ ...jest.requireActual('react'), useId: () => 'home-map-disclosure-test' }));
jest.mock('@/components/GoogleAccountMap', () => ({ GoogleAccountMap: ({ address }: { address: string | null }) => <div data-testid="map-address">{address}</div> }));
jest.mock('@/components/QuickActionCard', () => ({ QuickActionCard: ({ title, href }: { title: string; href: string }) => <a href={href}>{title}</a> }));
jest.mock('@/components/dashboard/QuickActionMetrics', () => ({
  PaymentMetric: ({ data, loading }: any) => <p>{loading ? 'Loading balance' : data ? `Balance ${data.balance}` : 'No balance'}</p>,
  ReadingMetric: ({ data, loading }: any) => <p>{loading ? 'Loading reading' : data ? `Reading ${data.meters[0].value}` : 'No reading'}</p>,
}));
const accounts = [
  { id: 'a', accountNumber: '1001', address: 'Адрес первого счёта', name: null, region: null },
  { id: 'b', accountNumber: '1002', address: 'Адрес второго счёта', name: null, region: null },
];
function overview(id = 'a'): DashboardOverview {
  const account = accounts.find(item => item.id === id)!;
  return {
    profile: { email: '', emailVerified: true, name: null },
    stats: { activeApplications: 3, metersCount: 1, totalAmount: 100, unpaidBills: 1 },
    accounts, selectedAccountId: id,
    accountData: { ...account, balance: 100, paid: 0, charged: 100,
      quickMetrics: { balance: id === 'a' ? 100 : 200, openingBalance: 0, meters: [{ number: '123', value: id === 'a' ? 10 : 20, date: null }] } },
  };
}
const response = (data = overview()) => ({ ok: true, json: async () => data });
const originalFetch = global.fetch;
const originalMatchMedia = window.matchMedia;
function View() { return <HomeAccountProvider><HomeAccountMap /><HomeQuickActions /></HomeAccountProvider>; }
beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation(query => ({ matches: query === '(min-width: 640px)', addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  (useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { id: 'user1' } } });
  global.fetch = jest.fn().mockResolvedValue(response());
});
afterEach(() => { global.fetch = originalFetch; window.matchMedia = originalMatchMedia; });

it('one request supplies both the map and quick actions; switching clears old metrics and passes the account into action links', async () => {
  let finish!: (value: unknown) => void;
  (global.fetch as jest.Mock).mockResolvedValueOnce(response()).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<View />);
  await screen.findByText('Balance 100');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '№ 1002' }));
  expect(screen.getByTestId('map-address')).toHaveTextContent('Адрес второго счёта');
  expect(screen.queryByText('Balance 100')).not.toBeInTheDocument();
  expect(screen.getByText('Loading balance')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '№ 1002' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '№ 1002' })).toHaveTextContent('Адрес второго счёта');
  expect(screen.queryByText('Ваш адрес')).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenLastCalledWith('/api/dashboard/overview?accountId=b', expect.anything());
  await act(async () => finish(response(overview('b'))));
  expect(screen.getByText('Balance 200')).toBeInTheDocument();
  expect(screen.getByText('Reading 20')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Передать показания' })).toHaveAttribute('href', '/dashboard/meters?accountId=b');
  expect(screen.getByRole('link', { name: 'Оплатить счет' })).toHaveAttribute('href', '/dashboard/bills?accountId=b');
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.queryByText('Карта отключений')).not.toBeInTheDocument();
});

it('ignores an older response after rapidly switching back to another account', async () => {
  let finishOld!: (value: unknown) => void;
  (global.fetch as jest.Mock).mockResolvedValueOnce(response()).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; })).mockResolvedValueOnce(response());
  render(<View />);
  await screen.findByText('Balance 100');
  fireEvent.click(screen.getByRole('button', { name: '№ 1002' }));
  const previousSignal = (global.fetch as jest.Mock).mock.calls[1][1].signal;
  fireEvent.click(screen.getByRole('button', { name: '№ 1001' }));
  await screen.findByText('Balance 100');
  expect(previousSignal.aborted).toBe(true);
  await act(async () => finishOld(response(overview('b'))));
  expect(screen.getByTestId('map-address')).toHaveTextContent('Адрес первого счёта');
  expect(screen.queryByText('Balance 200')).not.toBeInTheDocument();
});

it('keeps account selection and offers retry on a failed lookup without old balances', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce(response()).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce(response(overview('b')));
  render(<View />);
  await screen.findByText('Balance 100');
  fireEvent.click(screen.getByRole('button', { name: '№ 1002' }));
  await screen.findByRole('alert');
  expect(screen.getByText('No balance')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '№ 1002' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  await screen.findByText('Balance 200');
});

it('clears private addresses and metrics on sign-out and does not request guest data', async () => {
  const view = render(<View />);
  await screen.findByText('Balance 100');
  (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null });
  view.rerender(<View />);
  expect(screen.getByTestId('map-address')).toBeEmptyDOMElement();
  expect(screen.queryByText('Balance 100')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Войти в личный кабинет/ })).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it('handles an account without 1C data or an address without making up a location', async () => {
  (global.fetch as jest.Mock).mockResolvedValue(response({ ...overview(), accounts: [{ ...accounts[0], address: '' }], accountData: null }));
  render(<View />);
  await screen.findByText('Адрес не указан');
  expect(screen.getByText('No balance')).toBeInTheDocument();
  expect(screen.getByTestId('map-address')).toBeEmptyDOMElement();
});

it('offers adding an account for an authenticated user without accounts', async () => {
  (global.fetch as jest.Mock).mockResolvedValue(response({ ...overview(), accounts: [], selectedAccountId: null, accountData: null }));
  render(<View />);
  expect(await screen.findByRole('link', { name: /Добавить лицевой счёт/ })).toHaveAttribute('href', '/dashboard/meters');
  expect(screen.queryByRole('group', { name: 'Выбор лицевого счёта' })).not.toBeInTheDocument();
});

it('shows the selected account and address in the mobile disclosure and keeps them in sync', async () => {
  (window.matchMedia as jest.Mock).mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  (global.fetch as jest.Mock).mockResolvedValueOnce(response()).mockResolvedValueOnce(response(overview('b')));
  render(<HomeAccountProvider><HomeExpandableMap /><HomeQuickActions /></HomeAccountProvider>);
  await screen.findByText('Лицевой счёт № 1001');
  expect(screen.queryByTestId('map-address')).not.toBeInTheDocument();
  const toggle = screen.getByRole('button', { name: /Мои лицевые счета/ });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveTextContent('Адрес первого счёта');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(toggle).toHaveTextContent('Свернуть список счетов');
  fireEvent.click(screen.getByRole('button', { name: '№ 1002' }));
  await screen.findByText('Balance 200');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveTextContent('Лицевой счёт № 1002');
  expect(toggle).toHaveTextContent('Адрес второго счёта');
  expect(screen.getByRole('link', { name: 'Передать показания' })).toHaveAttribute('href', '/dashboard/meters?accountId=b');
});

it('switches mobile quick actions through the compact account selector without rendering a map', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce(response()).mockResolvedValueOnce(response(overview('b')));
  render(<HomeAccountProvider><HomeMobileAccountSelect /><HomeQuickActions /></HomeAccountProvider>);
  await screen.findByText('Balance 100');
  // JSDOM does not evaluate the media query that reveals this phone-only control.
  const select = screen.getByLabelText('Лицевой счёт для быстрых действий');
  expect(select).toHaveValue('a');
  expect(screen.getByText('Адрес первого счёта')).toBeInTheDocument();
  expect(screen.queryByTestId('map-address')).not.toBeInTheDocument();
  fireEvent.change(select, { target: { value: 'b' } });
  await screen.findByText('Balance 200');
  expect(select).toHaveValue('b');
  expect(screen.getByText('Адрес второго счёта')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Передать показания' })).toHaveAttribute('href', '/dashboard/meters?accountId=b');
  expect(screen.getByRole('link', { name: 'Оплатить счет' })).toHaveAttribute('href', '/dashboard/bills?accountId=b');
  expect(screen.getByRole('option', { name: 'Добавить лицевой счёт…', hidden: true })).toBeInTheDocument();
});
