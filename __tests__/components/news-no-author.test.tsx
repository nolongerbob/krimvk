import { render, screen } from '@testing-library/react';
import { NewsCard } from '@/components/NewsCard';
it('shows the publication date but not the author', () => {
  render(<NewsCard item={{ id: 'news', title: 'Новость компании', content: 'Текст', imageUrl: null, publishedAt: new Date('2026-09-23'), author: { name: 'Private Author', email: 'private@example.test' } }} />);
  expect(screen.queryByText('Private Author')).not.toBeInTheDocument();
  expect(screen.queryByText('private@example.test')).not.toBeInTheDocument();
  expect(screen.getByText(/2026/)).toBeInTheDocument();
});

it('keeps the whole news illustration visible in a responsive frame', () => {
  render(<NewsCard item={{ id: 'poster', title: 'Афиша', content: 'Текст', imageUrl: '/images/banner-bg.webp', publishedAt: null, author: { name: null, email: '' } }} />);
  const image = screen.getByRole('img', { name: 'Афиша' });
  expect(image).toHaveClass('object-contain');
  expect(image).not.toHaveClass('object-cover');
  expect(image.parentElement).toHaveClass('aspect-[2/1]', 'shrink-0');
});
