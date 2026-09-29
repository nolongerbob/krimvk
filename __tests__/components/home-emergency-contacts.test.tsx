import { render, screen } from '@testing-library/react';
import { HomeEmergencyContacts } from '@/components/HomeEmergencyContacts';

it('places the public emergency action alongside the dispatch phone numbers', () => {
  render(<HomeEmergencyContacts />);
  const link = screen.getByRole('link', { name: 'Сообщить об аварии' });
  expect(link).toHaveAttribute('href', '/emergency');
  expect(link.parentElement).toHaveTextContent('Аварийно-диспетчерская служба');
  expect(link.parentElement).toHaveTextContent('+7 (978) 701-30-50');
});
