import { render, screen, act, fireEvent } from '@testing-library/react';
import { UserSettingsPanel } from '@/components/admin/UserSettingsPanel';
import type { UserDetails } from '@/components/admin/UserDetailsDialog';
const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
const user: UserDetails = { id: 'client', email: 'client@example.test', name: 'Старое имя', phone: null, address: null, role: 'USER', createdAt: '2026-09-01', userAccounts: [{ id: 'utility', accountNumber: '1001', address: 'Адрес счёта', name: null, phone: null, region: null, isActive: true, createdAt: '2026-09-01', meters: [] }], applications: [], bills: [], totalDebt: 0, unpaidBillsCount: 0 };
const settings = { linkedServices: [{ id: 'yandex-link', provider: 'yandex' }], canUnlinkService: true, deletionBlockReason: null, deletionSummary: { accounts: 1, applications: 3, questions: 2, meters: 1, bills: 5 } };
const saved = jest.fn(), deleted = jest.fn(), unlinked = jest.fn(), busy = jest.fn();
const renderPanel = (profile = user) => render(<UserSettingsPanel user={profile} currentUserId="admin" onSaved={saved} onDeleted={deleted} onAccountUnlinked={unlinked} onBusyChange={busy} />);
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockImplementation(async (_url, init) => ({ ok: true, json: async () => init?.method === 'PATCH' ? { user: { ...user, name: 'Новое имя' } } : init?.method === 'DELETE' ? { success: true } : { settings } }));
});
it('edits name/phone/address without exposing a way to silently replace login email', async () => {
  renderPanel(); await act(async () => {});
  expect(screen.getByLabelText('Почта для входа')).toHaveAttribute('readonly');
  expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Имя и фамилия'), { target: { value: 'Новое имя' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' })); await act(async () => {});
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/client/profile', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ name: 'Новое имя', phone: null, address: null }) }));
  expect(saved).toHaveBeenCalledWith(expect.objectContaining({ name: 'Новое имя' }));
  expect(screen.getByRole('status')).toHaveTextContent('Данные профиля сохранены');
});
it('requires a separate explicit confirmation bound to the target email before deleting', async () => {
  renderPanel(); await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Удалить аккаунт пользователя' }));
  expect(screen.getByText(/Удаление необратимо/)).toBeInTheDocument();
  const button = screen.getByRole('button', { name: 'Удалить безвозвратно' });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/Для подтверждения введите/), { target: { value: user.email } });
  fireEvent.click(button); await act(async () => {});
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/client/profile', expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ confirmation: user.email }) }));
  expect(deleted).toHaveBeenCalledWith('client');
});
it('cancels deletion without a mutation and blocks self/staff deletion', async () => {
  const view = renderPanel(); await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Удалить аккаунт пользователя' }));
  fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
  expect(deleted).not.toHaveBeenCalled(); expect(global.fetch).toHaveBeenCalledTimes(1);
  view.unmount(); renderPanel({ ...user, id: 'admin', role: 'ADMIN' }); await act(async () => {});
  expect(screen.queryByRole('button', { name: 'Удалить аккаунт пользователя' })).not.toBeInTheDocument();
  expect(screen.getByText(/Нельзя удалить свой аккаунт/)).toBeInTheDocument();
});
it('unlinks a provider only after confirmation and does not delete the profile', async () => {
  renderPanel(); await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Отвязать Яндекс' }));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Подтвердить отвязку' })); await act(async () => {});
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/client/services/yandex-link', expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ confirmation: 'yandex' }) }));
  expect(deleted).not.toHaveBeenCalled();
});
it('disables unlink for the last login method', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ settings: { ...settings, canUnlinkService: false } }) });
  renderPanel(); await act(async () => {});
  expect(screen.getByRole('button', { name: 'Отвязать Яндекс' })).toBeDisabled();
  expect(screen.getByText(/Последний способ входа нельзя отвязать/)).toBeInTheDocument();
});
it('keeps utility unlink separate and propagates its removal', async () => {
  renderPanel(); await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Отвязать счёт' }));
  fireEvent.click(screen.getByRole('button', { name: 'Да, отвязать' })); await act(async () => {});
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/client/accounts/utility', { method: 'DELETE' });
  expect(unlinked).toHaveBeenCalledWith('utility'); expect(deleted).not.toHaveBeenCalled();
});
it('shows server errors and does not close a profile when deletion fails', async () => {
  renderPanel(); await act(async () => {});
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'У пользователя есть материалы сайта' }) });
  fireEvent.click(screen.getByRole('button', { name: 'Удалить аккаунт пользователя' }));
  fireEvent.change(screen.getByLabelText(/Для подтверждения введите/), { target: { value: user.email } });
  fireEvent.click(screen.getByRole('button', { name: 'Удалить безвозвратно' })); await act(async () => {});
  expect(screen.getByRole('alert')).toHaveTextContent('У пользователя есть материалы сайта');
  expect(deleted).not.toHaveBeenCalled(); expect(busy).toHaveBeenLastCalledWith(false);
});
