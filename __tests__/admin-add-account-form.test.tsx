import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminAddAccountForm } from '@/components/admin/AdminAddAccountForm';
const user = { id: 'client', name: 'Анна', email: 'anna@example.test' };
const added = jest.fn(), busy = jest.fn();
const account = { id: 'account', accountNumber: '123', meters: [] };
beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ account, emailSyncPending: false }) }); });
function form() {
  render(<AdminAddAccountForm user={user} onAdded={added} onBusyChange={busy} />);
  fireEvent.click(screen.getByRole('button', { name: 'Добавить лицевой счёт' }));
}
function fill() {
  fireEvent.change(screen.getByLabelText('Район'), { target: { value: 'saki' } });
  fireEvent.change(screen.getByLabelText('Номер лицевого счёта'), { target: { value: '123' } });
  fireEvent.change(screen.getByLabelText('Пароль лицевого счёта 1С'), { target: { value: 'Legacy123' } });
}
it('clearly identifies the recipient and posts to their account endpoint, not the operator’s', async () => {
  form(); expect(screen.getByText(/Получатель: Анна · anna@example.test/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Добавить пользователю' })).toBeDisabled(); fill();
  fireEvent.click(screen.getByRole('button', { name: 'Добавить пользователю' }));
  await waitFor(() => expect(added).toHaveBeenCalledWith(account));
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/client/accounts', expect.objectContaining({ method: 'POST', body: JSON.stringify({ accountNumber: '123', password1c: 'Legacy123', region: 'saki' }) }));
  expect(screen.getByRole('status')).toHaveTextContent('Счёт № 123 добавлен пользователю');
  expect(busy).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole('button', { name: 'Добавить лицевой счёт' }));
  expect(screen.getByLabelText('Пароль лицевого счёта 1С')).toHaveValue('');
});
it('keeps failed requests visible without a false success or changing the target profile', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Счёт другого пользователя' }) });
  form(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Добавить пользователю' }));
  await screen.findByRole('alert'); expect(added).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toHaveTextContent('Счёт другого пользователя');
});
it('allows cancelling without contacting the server and clears the password', () => {
  form(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Отмена' })); expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Добавить лицевой счёт' })); expect(screen.getByLabelText('Пароль лицевого счёта 1С')).toHaveValue('');
});
it('distinguishes a successful link from a pending email synchronization', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ account, emailSyncPending: true }) });
  form(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Добавить пользователю' }));
  expect(await screen.findByRole('status')).toHaveTextContent('почта профиля пока не передана в 1С'); expect(added).toHaveBeenCalled();
});
it('blocks repeated submissions and cancellation until validation finishes', async () => {
  let resolve!: (value: unknown) => void;
  (global.fetch as jest.Mock).mockReturnValue(new Promise(done => { resolve = done; }));
  form(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Добавить пользователю' }));
  expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled(); expect(screen.getByLabelText('Район')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Проверяем и добавляем…' })); expect(global.fetch).toHaveBeenCalledTimes(1);
  resolve({ ok: true, json: async () => ({ account }) }); await screen.findByRole('status');
});
