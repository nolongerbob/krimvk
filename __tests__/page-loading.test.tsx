import { act, render, screen } from '@testing-library/react';
import { Loading } from '@/components/Loading';
import { PageLoadingProvider } from '@/components/PageLoadingProvider';
import { usePathname } from 'next/navigation';
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

beforeEach(() => {
  (usePathname as jest.Mock).mockReturnValue('/dashboard');
  jest.useFakeTimers();
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn(() => ({ matches: false })) });
});

it('shows the leaf on a ready cached home and dismisses after initialization', async () => {
  (usePathname as jest.Mock).mockReturnValue('/');
  render(<Page pending={false} />);
  expect(screen.getByRole('status')).toHaveClass('opacity-100');
  await act(async () => {});
  act(() => jest.advanceTimersByTime(1400));
  expect(screen.getByRole('status')).toHaveClass('opacity-0');
  act(() => jest.advanceTimersByTime(650));
  expect(screen.queryByRole('status')).toBeNull();
});

it('shows again on every return to the cached home, not just the first visit', async () => {
  (usePathname as jest.Mock).mockReturnValue('/');
  const { rerender } = render(<Page pending={false} />);
  await act(async () => {});
  act(() => jest.advanceTimersByTime(2100));
  expect(screen.queryByRole('status')).toBeNull();
  (usePathname as jest.Mock).mockReturnValue('/news');
  rerender(<Page pending={false} />);
  (usePathname as jest.Mock).mockReturnValue('/');
  rerender(<Page pending={false} />);
  expect(screen.getByRole('status')).toHaveClass('opacity-100');
  await act(async () => {});
  act(() => jest.advanceTimersByTime(2100));
  expect(screen.queryByRole('status')).toBeNull();
});
afterEach(() => jest.useRealTimers());

function Page({ pending, second = false }: { pending: boolean; second?: boolean }) {
  return <PageLoadingProvider>{pending && <Loading />}{second && <Loading />}<div>Страница</div></PageLoadingProvider>;
}

it('keeps the leaf until the page is ready, then completes the full fade', () => {
  const { rerender } = render(<Page pending />);
  act(() => jest.advanceTimersByTime(5000));
  expect(screen.getByRole('status')).toHaveClass('opacity-100');
  rerender(<Page pending={false} />);
  act(() => jest.advanceTimersByTime(1));
  expect(screen.getByRole('status')).toHaveClass('opacity-0');
  act(() => jest.advanceTimersByTime(650));
  expect(screen.queryByRole('status')).toBeNull();
});

it('shows fast loads for at least 1400ms and cancels dismissal on another load', () => {
  const { rerender } = render(<Page pending />);
  act(() => jest.advanceTimersByTime(100));
  rerender(<Page pending={false} />);
  act(() => jest.advanceTimersByTime(1299));
  expect(screen.getByRole('status')).toHaveClass('opacity-100');
  act(() => jest.advanceTimersByTime(1));
  expect(screen.getByRole('status')).toHaveClass('opacity-0');
  rerender(<Page pending />);
  act(() => jest.advanceTimersByTime(3000));
  expect(screen.getByRole('status')).toHaveClass('opacity-100');
});

it('waits for all pending boundaries and does not show on ready pages', () => {
  const { rerender } = render(<Page pending={false} />);
  expect(screen.queryByRole('status')).toBeNull();
  rerender(<Page pending second />);
  rerender(<Page pending={false} second />);
  act(() => jest.advanceTimersByTime(5000));
  expect(screen.getByRole('status')).toHaveClass('opacity-100');
});
