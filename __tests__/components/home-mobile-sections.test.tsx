import { render, screen, within } from '@testing-library/react';
import { NewsSection } from '@/components/NewsSection';
import { Footer } from '@/components/layout/Footer';

const news = Array.from({ length: 7 }, (_, index) => ({
  id: `news-${index}`, title: `Новость ${index + 1}`, content: 'Содержание новости',
  imageUrl: null, publishedAt: null, author: { name: null, email: '' },
}));

it('keeps up to six news cards in order and an accessible link to all news', () => {
  const { container } = render(<NewsSection news={news} fullScreen />);
  expect(screen.getByRole('link', { name: 'Все новости' })).toHaveAttribute('href', '/news');
  expect(Array.from(container.querySelectorAll('.news-card-link')).map(link => link.getAttribute('href')))
    .toEqual(news.slice(0, 6).map(item => `/news/${item.id}`));
  expect(screen.queryByText('Новость 7')).not.toBeInTheDocument();
  expect(container.querySelector('.home-news-heading')).toContainElement(screen.getByRole('heading', { name: 'Новости' }));
});

it('does not leave a blank section when there are no news items', () => {
  const { container } = render(<NewsSection news={[]} fullScreen />);
  expect(container).toBeEmptyDOMElement();
});

it('retains all footer destinations and contacts in the compact layout', () => {
  const { container } = render(<Footer />);
  const footer = screen.getByRole('contentinfo');
  expect(within(footer).getByRole('link', { name: 'Личный кабинет' })).toHaveAttribute('href', '/dashboard');
  expect(within(footer).getByRole('link', { name: '+7 (978) 080-03-66' })).toHaveAttribute('href', 'tel:+79780800366');
  expect(within(footer).getByRole('link', { name: 'sakwcompany@mail.ru' })).toHaveAttribute('href', 'mailto:sakwcompany@mail.ru');
  expect(container.querySelector('.footer-legal')?.querySelectorAll('a')).toHaveLength(4);
  expect(container.querySelector('.footer-brand')).toHaveTextContent('КрымВК');
});
