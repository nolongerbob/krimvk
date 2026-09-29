import { fireEvent, render, screen } from '@testing-library/react';
import { HomeOutagePreview } from '@/components/HomeOutagePreview';

jest.mock('maplibre-gl', () => ({ Map: function () { throw new Error('Offline map'); } }));

it('labels demo data and keeps the list available when the map cannot load', async () => {
  render(<HomeOutagePreview />);
  expect(screen.queryByText('Тестовые данные')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Карта отключений' })).toHaveAttribute('title', expect.stringContaining('Демонстрационная карта'));
  expect(await screen.findByText('Карта недоступна. Сообщения доступны в списке ниже.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /г. Саки Плановые/ }));
  expect(screen.getByRole('button', { name: /г. Саки Плановые/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText('Пример срока: до 17:00')).not.toBeInTheDocument();
  expect(screen.queryByText(/Демо · MAX/)).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Сообщить об аварии/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /с. Лесновка/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Все$/ })).not.toBeInTheDocument();
});

it('keeps the compact preview free of search and address details', async () => {
  render(<HomeOutagePreview />);
  await screen.findByText('Карта недоступна. Сообщения доступны в списке ниже.');
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByText(/ул\. Механизаторов/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /с. Орехово Снижение/ }));
  expect(screen.getByRole('button', { name: /с. Орехово Снижение/ })).toHaveAttribute('aria-pressed', 'true');
});
