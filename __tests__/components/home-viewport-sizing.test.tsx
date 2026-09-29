import { act, render } from '@testing-library/react';
import { HomeViewportSizing } from '@/components/HomeViewportSizing';

it('does not measure dependent cards and updates only for new viewport inputs', () => {
  const originalObserver = global.ResizeObserver;
  let resize: () => void = () => {};
  global.ResizeObserver = class {
    constructor(callback: () => void) { resize = callback; }
    observe() {} unobserve() {} disconnect() {}
  } as unknown as typeof ResizeObserver;
  let frame: FrameRequestCallback | undefined;
  const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frame = callback; return 1; });
  const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { frame = undefined; });
  const previousHeight = window.innerHeight;
  const flush = () => act(() => { const callback = frame; frame = undefined; callback?.(0); });
  const view = render(<div data-home-composition><HomeViewportSizing /><div data-home-hero-row /><section data-home-actions><div className="quick-actions-grid"><div><span>Action</span></div></div></section></div>);
  try {
    flush();
    const card = view.container.querySelector('.quick-actions-grid span')!;
    const reads = jest.spyOn(card, 'getBoundingClientRect');
    for (let i = 0; i < 12; i++) { act(() => resize()); flush(); }
    expect(reads).not.toHaveBeenCalled();
    reads.mockClear();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight + 100 });
    act(() => resize()); flush();
    expect(reads).not.toHaveBeenCalled();
    expect((view.container.firstElementChild as HTMLElement).style.getPropertyValue('--home-available-height')).toBe(`${previousHeight + 100 - 72}px`);
    reads.mockRestore();
  } finally {
    view.unmount();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    global.ResizeObserver = originalObserver;
    raf.mockRestore(); cancel.mockRestore();
  }
});
