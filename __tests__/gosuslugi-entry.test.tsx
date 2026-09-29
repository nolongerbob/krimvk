import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getProviders } from 'next-auth/react';
import { GosuslugiEntry } from '@/components/auth/GosuslugiEntry';
const originalFetch = global.fetch;
beforeEach(() => { (getProviders as jest.Mock).mockResolvedValue(null); });
afterEach(() => { global.fetch = originalFetch; });
it('keeps unconnected ESIA disabled without inventing an existing-account conflict', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ preview: true }) });
  render(<GosuslugiEntry />);
  const button = await screen.findByRole('button', { name: 'Войти через Госуслуги' });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(screen.queryByText('Такой пользователь уже существует')).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
it('offers explicit linking only in the settings variant and never claims success', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ preview: true }) });
  render(<GosuslugiEntry settings />);
  fireEvent.click(await screen.findByRole('button', { name: 'Привязать Госуслуги' }));
  expect(screen.getByText(/Сейчас привязка не выполняется/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
it('is hidden when the preview is disabled', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ preview: false }) });
  const { container } = render(<GosuslugiEntry />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  expect(container).toBeEmptyDOMElement();
});
it('keeps five square entry points and sends VK variants only to the HTTPS dev preview', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ preview: true }) });
  render(<GosuslugiEntry />);
  for (const name of ['Госуслуги', 'Яндекс']) {
    const button = await screen.findByRole('button', { name: `Войти через ${name}` });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('h-10', 'w-10', 'rounded-none');
    const sizes: Record<string, number> = { 'Госуслуги': 28, 'Яндекс': 26, VK: 26, MAX: 26 };
    expect(button.querySelector('img')).toHaveAttribute('width', String(sizes[name]));
    expect(screen.queryByText(name, { exact: true })).not.toBeInTheDocument();
    expect(button).toHaveClass('bg-slate-50', 'border', 'border-slate-200');
    expect(button.style.background).toBe('');
    expect(button.querySelector('img')).toHaveAttribute('src', expect.stringContaining('/images/auth-providers/'));
  }
  for (const [name, service] of [['VK', 'vkid'], ['Одноклассники', 'ok_ru'], ['Mail.ru', 'mail_ru']]) {
    const link = screen.getByRole('link', { name: `Войти через ${name} — в новой вкладке` });
    expect(link).toHaveClass('h-10', 'w-10', 'rounded-none');
    expect(link).toHaveAttribute('href', `https://dev.krimvk.ru/login/vk?service=${service}`);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  }
  expect(screen.queryByRole('button', { name: /MAX/ })).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it('offers Yandex login only when the server advertises the provider', async () => {
  (getProviders as jest.Mock).mockResolvedValue({ yandex: { id: 'yandex' } });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ preview: true }) });
  render(<GosuslugiEntry />);
  expect(await screen.findByRole('link', { name: 'Войти через Яндекс — в новой вкладке' })).toHaveAttribute('href', '/login/yandex');
});
