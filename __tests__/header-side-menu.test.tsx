import { act, fireEvent, render, screen } from '@testing-library/react';
import { HeaderSideMenu } from '@/components/layout/HeaderSideMenu';

jest.mock('@/components/Search', () => ({ Search: () => null }));
jest.mock('@/components/BVIButton', () => ({ BVIButton: () => null }));

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn(() => ({ matches: false })) });
});
afterEach(() => jest.useRealTimers());
const props = { onClose: jest.fn(), pathname: '/', session: null, navLinks: [] };

it('offers settings to signed-in users and closes the menu on selection', () => {
  const onClose = jest.fn();
  render(<HeaderSideMenu {...props} isOpen onClose={onClose} pathname="/dashboard/settings"
    session={{ user: { id: 'user-1', name: 'Test', email: 'test@example.com', role: 'USER' }, expires: '2099-01-01' }} />);
  const link = screen.getByRole('link', { name: 'Настройки' });
  expect(link).toHaveAttribute('href', '/dashboard/settings');
  expect(link).toHaveAttribute('aria-current', 'page');
  fireEvent.click(link);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('does not show account settings to visitors', () => {
  render(<HeaderSideMenu {...props} isOpen />);
  expect(screen.queryByRole('link', { name: 'Настройки' })).not.toBeInTheDocument();
});

it('animates accordion height without unmounting its links and disables closed links', () => {
  render(<HeaderSideMenu {...props} isOpen />);
  const toggle = screen.getByRole('button', { name: 'Абонентам' });
  // Chevron is decorative; the animated grid is the direct sibling of the toggle.
  const grid = toggle.nextElementSibling!;
  expect(grid).toHaveAttribute('inert');
  const link = grid.querySelector('a');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(grid).toHaveClass('grid-rows-[1fr]');
  expect(grid).not.toHaveAttribute('inert');
  fireEvent.click(toggle);
  expect(grid).toHaveClass('grid-rows-[0fr]');
  expect(grid.querySelector('a')).toBe(link);
  expect(grid).toHaveAttribute('inert');
});

it('keeps the closed panel for its exit animation without interactive controls', () => {
  const { container, rerender } = render(<HeaderSideMenu {...props} isOpen />);
  rerender(<HeaderSideMenu {...props} isOpen={false} />);
  const panel = container.querySelector('[role="dialog"]');
  expect(panel).toHaveClass('side-menu-panel-exit');
  expect(panel).toHaveAttribute('inert');
  expect(panel).toHaveAttribute('aria-hidden', 'true');
  act(() => jest.advanceTimersByTime(299));
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  act(() => jest.advanceTimersByTime(1));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

it('cancels pending removal when reopened quickly', () => {
  const { container, rerender } = render(<HeaderSideMenu {...props} isOpen />);
  rerender(<HeaderSideMenu {...props} isOpen={false} />);
  act(() => jest.advanceTimersByTime(150));
  rerender(<HeaderSideMenu {...props} isOpen />);
  act(() => jest.advanceTimersByTime(500));
  expect(container.querySelector('[role="dialog"]')).toHaveAttribute('data-state', 'open');
  expect(container.querySelector('[role="dialog"]')).not.toHaveAttribute('inert');
});
