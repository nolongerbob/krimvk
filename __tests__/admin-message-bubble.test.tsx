import { render, screen } from '@testing-library/react';
import { AdminMessageBubble } from '@/components/admin/AdminQuestionsChat';
jest.mock('@/components/admin/ChatUserProfile', () => ({ ChatUserProfile: () => null }));

it.each([
  [true, 'justify-end', 'bg-blue-600', 'text-blue-100'],
  [false, 'justify-start', 'bg-white', 'text-slate-400'],
])('renders messages from the operator perspective (admin=%s)', (isFromAdmin, alignment, background, timestampColor) => {
  const { container } = render(<AdminMessageBubble message={{ id: 'message', text: 'Сообщение', imageUrl: null, isFromAdmin, createdAt: new Date('2026-09-10T10:00:00Z') }} />);
  expect(container.firstChild).toHaveClass(alignment);
  const bubble = screen.getByText('Сообщение').parentElement!;
  expect(bubble).toHaveClass(background);
  expect(bubble.lastElementChild).toHaveClass(timestampColor);
});
