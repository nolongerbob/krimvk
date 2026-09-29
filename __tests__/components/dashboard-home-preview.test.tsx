import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHomePreview } from '@/components/dashboard/DashboardHomePreview';
jest.mock('@/components/dashboard/QuickActionMetrics', () => ({ ReadingMetric: () => <div>Показания</div> }));
const props = {
  name: 'Абонент', accounts: [{ id: 'one', accountNumber: '001', address: 'Первый адрес', name: null }, { id: 'two', accountNumber: '002', address: 'Второй адрес', name: null }],
  selectedAccountId: 'one', onSelectAccount: jest.fn(), loadingData: false, error: null, activeApplications: 2,
  accountData: { accountNumber: '001', address: 'Первый адрес', name: null, balance: 480.95, charged: 100, paid: 50 },
};
it('keeps the existing payment and meter routes', () => {
  render(<DashboardHomePreview {...props} />);
  expect(screen.getByRole('link', { name: 'Перейти к оплате' })).toHaveAttribute('href', '/dashboard/receipts/view?accountId=one');
  expect(screen.getByRole('link', { name: 'Передать показания' })).toHaveAttribute('href', '/dashboard/meters');
  fireEvent.change(screen.getByLabelText('Лицевой счёт'), { target: { value: 'two' } });
  expect(props.onSelectAccount).toHaveBeenCalledWith('two');
});
it('does not label a prepayment as a debt or demand payment', () => {
  render(<DashboardHomePreview {...props} accountData={{ ...props.accountData, balance: -100 }} />);
  expect(screen.getByText('На счёте переплата')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Перейти к оплате' })).not.toBeInTheDocument();
});
it('hides stale amounts during account switching', () => {
  render(<DashboardHomePreview {...props} loadingData />);
  expect(screen.queryByRole('link', { name: 'Перейти к оплате' })).not.toBeInTheDocument();
  expect(screen.queryByText(/480,95/)).not.toBeInTheDocument();
});
it('offers account connection without inventing a zero balance', () => {
  render(<DashboardHomePreview {...props} accounts={[]} accountData={null} selectedAccountId={null} />);
  expect(screen.getByRole('link', { name: 'Подключить лицевой счёт' })).toHaveAttribute('href', '/dashboard/meters');
  expect(screen.queryByText('Задолженности нет')).not.toBeInTheDocument();
});
