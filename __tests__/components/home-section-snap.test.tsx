import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { HomeSectionSnap } from '@/components/HomeSectionSnap';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn(() => ({ matches: false })) });
});

it('does not arm native snapping during hydration or programmatic scroll', () => {
  const { unmount } = render(<HomeSectionSnap />);
  expect(document.documentElement).not.toHaveAttribute('data-home-snap-ready');
  fireEvent.scroll(window);
  fireEvent.resize(window);
  expect(document.documentElement).not.toHaveAttribute('data-home-snap-ready');
  fireEvent.wheel(window, { deltaY: 30 });
  expect(document.documentElement).toHaveAttribute('data-home-snap-ready');
  unmount();
  expect(document.documentElement).not.toHaveAttribute('data-home-snap-ready');
  fireEvent.wheel(window, { deltaY: 30 });
  expect(document.documentElement).not.toHaveAttribute('data-home-snap-ready');
});

it('arms for touch scrolling and cleans up on navigation', () => {
  const { unmount } = render(<HomeSectionSnap />);
  fireEvent.touchMove(window);
  expect(document.documentElement).toHaveAttribute('data-home-snap-ready');
  unmount();
  expect(document.documentElement).not.toHaveAttribute('data-home-snap-ready');
});

it('arms only for scrolling keys outside interactive controls', () => {
  const { getByRole } = render(<><HomeSectionSnap /><input aria-label="Текст" /></>);
  fireEvent.keyDown(getByRole('textbox'), { key: 'ArrowDown' });
  fireEvent.keyDown(window, { key: 'Tab' });
  expect(document.documentElement).not.toHaveAttribute('data-home-snap-ready');
  fireEvent.keyDown(window, { key: 'PageDown' });
  expect(document.documentElement).toHaveAttribute('data-home-snap-ready');
});
