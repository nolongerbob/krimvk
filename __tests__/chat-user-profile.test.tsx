import { render, screen, act, fireEvent } from '@testing-library/react';
import { ChatUserProfile } from '@/components/admin/ChatUserProfile';
jest.mock('@/components/admin/UserDetailsDialog', () => ({
  UserDetailsDialog: ({ user, currentUserId, onOpenChange }: any) => <div>
    <span>{user.name}</span><span>{currentUserId}</span>
    <span>{user.balanceError ? 'unavailable' : user.balanceLoading ? 'loading' : user.totalDebt}</span>
    <button onClick={() => onOpenChange(false)}>close profile</button>
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
