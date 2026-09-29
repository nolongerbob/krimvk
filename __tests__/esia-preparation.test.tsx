import { render, screen, fireEvent } from '@testing-library/react';
import { EsiaPreview } from '@/components/auth/EsiaPreview';
import { isEsiaPreviewEnabled, nextEsiaPreviewStep } from '@/lib/esia-preparation';

it('requires explicit dev opt-in; never enabled in production', () => {
  expect(isEsiaPreviewEnabled({})).toBe(false);
  expect(isEsiaPreviewEnabled({ NODE_ENV: 'development' })).toBe(false);
  expect(isEsiaPreviewEnabled({ NODE_ENV: 'production', ESIA_DEV_PREVIEW: 'true' })).toBe(false);
  expect(isEsiaPreviewEnabled({ NODE_ENV: 'development', ESIA_DEV_PREVIEW: 'true' })).toBe(true);
});
it('supports cancellation and restart without an authentication result', () => {
  expect(nextEsiaPreviewStep('consent', 'cancel')).toBe('cancelled');
  expect(nextEsiaPreviewStep('cancelled', 'restart')).toBe('start');
  expect(nextEsiaPreviewStep('done', 'continue')).toBe('done');
});
it('walks through a clearly labelled non-authenticating mock', () => {
  render(<EsiaPreview />);
  expect(screen.getByText(/Только dev-макет/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Посмотреть сценарий входа' }));
  fireEvent.click(screen.getByRole('button', { name: 'Далее в макете' }));
  expect(screen.getByText(/Автоматического объединения аккаунтов нет/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Такой пользователь уже существует' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Посмотреть результат привязки' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Обычный вход' })).toHaveAttribute('href', '/login');
});
