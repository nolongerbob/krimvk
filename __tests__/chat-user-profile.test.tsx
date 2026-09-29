import { render, screen, act, fireEvent } from '@testing-library/react';
import { ChatUserProfile } from '@/components/admin/ChatUserProfile';
jest.mock('@/components/admin/UserDetailsDialog', () => ({
  UserDetailsDialog: ({ user, currentUserId, onOpenChange, onUserUpdated, onUserDeleted, onAccountUnlinked, onAccountAdded }: any) => <div>
    <span>{user.name}</span><span>{currentUserId}</span>
    <span>{user.balanceError ? 'unavailable' : user.balanceLoading ? 'loading' : user.totalDebt}</span>
    <button onClick={() => onOpenChange(false)}>close profile</button>
    <button onClick={() => onUserUpdated({ id: user.id, name: 'Новое имя' })}>rename profile</button>
    <button onClick={() => onUserDeleted(user.id)}>delete profile</button>
    <button onClick={() => onAccountUnlinked('utility')}>unlink utility</button>
    <span>{user.userAccounts?.map((account: any) => account.accountNumber).join(',')}</span>
    <button onClick={() => onAccountAdded({ id: 'new-account', accountNumber: '123', meters: [] })}>add utility</button>
  </div>,
}));
beforeEach(() => { jest.clearAllMocks(); });
it('opens the existing profile and loads its balance separately', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'client', name: 'Client', balanceLoading: true } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ totalDebt: 42, unpaidBillsCount: 1 }) });
  const close = jest.fn();
  render(<ChatUserProfile userId="client" currentUserId="admin" onClose={close} />);
  await act(async () => {});
  expect(screen.getByText('Client')).toBeInTheDocument();
  expect(screen.getByText('42')).toBeInTheDocument();
  expect(screen.getByText('admin')).toBeInTheDocument();
  fireEvent.click(screen.getByText('close profile'));
  expect(close).toHaveBeenCalledTimes(1);
});
it('updates the selected profile accounts and refreshes its balance after adding an account', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'client', name: 'Client', userAccounts: [] } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ totalDebt: 0, unpaidBillsCount: 0 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'client', name: 'Client', userAccounts: [{ id: 'new-account', accountNumber: '123' }] } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ totalDebt: 100, unpaidBillsCount: 1 }) });
  render(<ChatUserProfile userId="client" currentUserId="admin" onClose={() => {}} />);
  await act(async () => {});
  fireEvent.click(screen.getByText('add utility'));
  expect(screen.getByText('123')).toBeInTheDocument();
  await act(async () => {});
  expect(screen.getByText('100')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(4);
});
it('keeps the profile usable when 1C is unavailable', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'client', name: 'Client' } }) }).mockResolvedValueOnce({ ok: false });
  render(<ChatUserProfile userId="client" currentUserId="admin" onClose={() => {}} />);
  await act(async () => {});
  expect(screen.getByText('Client')).toBeInTheDocument();
  expect(screen.getByText('unavailable')).toBeInTheDocument();
});
it('shows an error with retry instead of silently closing on failure', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  render(<ChatUserProfile userId="client" currentUserId="admin" onClose={() => {}} />);
  await act(async () => {});
  expect(screen.getByRole('alert')).toHaveTextContent('Пользователь не найден');
  expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
});

it('updates its own title and tells the chat about profile edits and deletion', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'client', name: 'Client', userAccounts: [] } }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ totalDebt: 0, unpaidBillsCount: 0 }) });
  const updated = jest.fn(), deleted = jest.fn();
  render(<ChatUserProfile userId="client" currentUserId="admin" onClose={() => {}} onUserUpdated={updated} onUserDeleted={deleted} />);
  await act(async () => {});
  fireEvent.click(screen.getByText('rename profile'));
  expect(screen.getByText('Новое имя')).toBeInTheDocument();
  expect(updated).toHaveBeenCalledWith({ id: 'client', name: 'Новое имя' });
  fireEvent.click(screen.getByText('delete profile'));
  expect(deleted).toHaveBeenCalledWith('client');
});
