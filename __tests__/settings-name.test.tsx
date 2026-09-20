import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '@/app/dashboard/settings/page';
const mockUpdate = jest.fn();
const mockRouter = { push: jest.fn(), refresh: jest.fn() };
const mockSession = { user: { id: 'self', name: 'Старое имя' } };
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: mockSession, status: 'authenticated', update: mockUpdate }) }));
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
it('saves the name, refreshes the session and never sends email for editing', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ user: { name: 'Старое имя', email: 'self@example.test', phone: '' } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { name: 'Новое имя', phone: '' } }) });
  global.fetch = fetchMock;
  try {
    const { unmount } = render(<SettingsPage />);
    const input = await screen.findByLabelText('ФИО');
    await waitFor(() => expect(input).toHaveValue('Старое имя'));
    fireEvent.change(input, { target: { value: 'Новое имя' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    await screen.findByText('Профиль успешно обновлён');
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ name: 'Новое имя', phone: '' }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockRouter.refresh).toHaveBeenCalled();
    expect(input).toHaveValue('Новое имя');
    unmount();
  } finally { global.fetch = originalFetch; }
});
