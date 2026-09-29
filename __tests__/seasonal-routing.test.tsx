import { act, render, cleanup, fireEvent } from '@testing-library/react';
import { SeasonalPreview } from '@/components/seasonal/SeasonalPreview';
import { startAutumnScene } from '@/components/seasonal/autumn-scene';
import { usePathname } from 'next/navigation';
import { prepareSpriteFrames } from '@/components/seasonal/sprite-frames';

jest.mock('@/components/seasonal/sprite-frames', () => ({ prepareSpriteFrames: jest.fn() }));

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('@/components/seasonal/autumn-scene', () => ({ startAutumnScene: jest.fn() }));
jest.mock('@/lib/seasonal-preview', () => ({
  ...jest.requireActual('@/lib/seasonal-preview'), readSeasonalPreview: () => true,
}));

describe('seasonal route switching', () => {
  it('does not render the mascot or its chat in admin support', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/questions');
    const { container, queryByRole } = render(<SeasonalPreview />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(queryByRole('button', { name: 'Открыть помощника Капельку' })).toBeNull();
    expect(queryByRole('dialog')).toBeNull();
    expect(startAutumnScene).not.toHaveBeenCalled();
  });
  it('keeps the same scene and pet across account pages, but cleans up for embedded chat', () => {
    const dispose = jest.fn();
    (startAutumnScene as jest.Mock).mockReturnValue(dispose);
    (usePathname as jest.Mock).mockReturnValue('/dashboard/meters');
    const { container, rerender } = render(<SeasonalPreview />);
    const pet = container.querySelector('[aria-label="Открыть помощника Капельку"]');
    for (const path of ['/dashboard/history', '/dashboard', '/dashboard/settings']) {
      (usePathname as jest.Mock).mockReturnValue(path);
      rerender(<SeasonalPreview />);
      expect(container.querySelector('[aria-label="Открыть помощника Капельку"]')).toBe(pet);
    }
    expect(startAutumnScene).toHaveBeenCalledTimes(1);
    expect(dispose).not.toHaveBeenCalled();
    (usePathname as jest.Mock).mockReturnValue('/dashboard/questions');
    rerender(<SeasonalPreview />);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector('canvas')).toBeNull();
  });
  const environment = process.env.NODE_ENV;
  beforeEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn(() => ({
      matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    })) });
    jest.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    Object.defineProperty(process.env, 'NODE_ENV', { value: environment, configurable: true });
  });
  it('animates hops and bubbles locally and cancels the animation on unmount', () => {
    (usePathname as jest.Mock).mockReturnValue('/news');
    const frames = Array.from({ length: 6 }, () => document.createElement('canvas'));
    (prepareSpriteFrames as jest.Mock).mockReturnValue(frames);
    const context = { clearRect: jest.fn(), drawImage: jest.fn(), fillRect: jest.fn() };
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    let image: HTMLImageElement;
    jest.spyOn(window, 'Image').mockImplementation(() => { image = document.createElement('img'); return image; });
    let tick: FrameRequestCallback = () => {};
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { tick = cb; return 42; });
    const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const { unmount, container } = render(<SeasonalPreview />);
    act(() => { image!.onload!(new Event('load')); });
    for (let i = 1; i <= 92; i++) tick(i * 50);
    expect(context.drawImage.mock.calls.some(([frame]) => frame === frames[4])).toBe(true);
    expect(container.querySelector('canvas')!.style.transform).toMatch(/translateY\(-[1-9]/);
    for (let i = 93; i <= 225; i++) tick(i * 50);
    expect(context.fillRect).toHaveBeenCalled();
    expect(startAutumnScene).not.toHaveBeenCalled();
    unmount();
    expect(cancel).toHaveBeenCalledWith(42);
  });
  it('allows dragging and returns quickly without opening the assistant', () => {
    (usePathname as jest.Mock).mockReturnValue('/services');
    const { container, queryByRole } = render(<SeasonalPreview />);
    const pet = container.querySelector('[data-seasonal-corner-pet]') as HTMLButtonElement;
    pet.setPointerCapture = jest.fn();
    pet.hasPointerCapture = jest.fn(() => true);
    pet.releasePointerCapture = jest.fn();
    const pointer = (type: string, x: number, y: number) => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
      Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
      fireEvent(pet,event);
    };
    pointer('pointerdown',900,650);
    pointer('pointermove',500,300);
    expect(pet.dataset.dragging).toBe('true');
    expect(pet.style.transform).not.toBe('translate(0px, 0px)');
    pointer('pointerup',500,300);
    expect(pet.style.transform).toBe('translate(0px, 0px)');
    expect(pet.style.transition).toContain('260ms');
    fireEvent.click(pet,{ detail: 1 });
    expect(queryByRole('dialog')).toBeNull();
    expect(pet.releasePointerCapture).toHaveBeenCalledWith(1);
  });
  it('renders just the corner companion on an ordinary page, without starting leaves', () => {
    (usePathname as jest.Mock).mockReturnValue('/about');
    const { container } = render(<SeasonalPreview />);
    expect(container.querySelector('[data-seasonal-corner-pet]')).not.toBeNull();
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    expect(startAutumnScene).not.toHaveBeenCalled();
  });
  it('cleans up seasonal animation when moving from home to an ordinary page', () => {
    const dispose = jest.fn();
    (startAutumnScene as jest.Mock).mockReturnValue(dispose);
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container, rerender } = render(<SeasonalPreview />);
    expect(startAutumnScene).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-seasonal-corner-pet]')).toBeNull();
    (usePathname as jest.Mock).mockReturnValue('/contacts');
    rerender(<SeasonalPreview />);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(startAutumnScene).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-seasonal-corner-pet]')).not.toBeNull();
  });
  it('keeps the home scene alive and ignores jitter at the corner handoff', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const dispose = jest.fn();
    (startAutumnScene as jest.Mock).mockReturnValue(dispose);
    const home = document.createElement('div');
    home.setAttribute('data-seasonal-home', '');
    const first = document.createElement('div');
    home.append(first); document.body.append(home);
    let bottom = 500;
    jest.spyOn(first, 'getBoundingClientRect').mockImplementation(() => ({ bottom } as DOMRect));
    let tick: FrameRequestCallback = () => {};
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { tick = cb; return 1; });
    const { container, unmount } = render(<SeasonalPreview />);
    const scroll = (value: number) => { bottom = value; act(() => { window.dispatchEvent(new Event('scroll')); tick(0); }); };
    scroll(72);
    const corner = container.querySelector('[data-seasonal-corner-pet]');
    expect(corner).not.toBeNull();
    for (const value of [75, 71, 80, 72, 95]) { scroll(value); expect(container.querySelector('[data-seasonal-corner-pet]')).toBe(corner); }
    expect(startAutumnScene).toHaveBeenCalledTimes(1);
    expect(dispose).not.toHaveBeenCalled();
    scroll(140);
    expect(container.querySelector('[data-seasonal-corner-pet]')).toBeNull();
    expect(startAutumnScene).toHaveBeenCalledTimes(1);
    unmount(); home.remove();
  });
  it('keeps the mobile companion off the home actions and reveals it after the first section', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query === '(max-width: 639px)', addEventListener: jest.fn(), removeEventListener: jest.fn(),
    }));
    const home = document.createElement('div');
    home.setAttribute('data-seasonal-home', '');
    const first = document.createElement('div');
    home.append(first); document.body.append(home);
    let bottom = 900;
    jest.spyOn(first, 'getBoundingClientRect').mockImplementation(() => ({ bottom } as DOMRect));
    let tick: FrameRequestCallback = () => {};
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { tick = cb; return 1; });
    const { container, unmount } = render(<SeasonalPreview />);
    expect(container.querySelector('[data-seasonal-corner-pet]')).toBeNull();
    bottom = 72;
    act(() => { window.dispatchEvent(new Event('scroll')); tick(0); });
    expect(container.querySelector('[data-seasonal-corner-pet]')).not.toBeNull();
    bottom = 900;
    act(() => { window.dispatchEvent(new Event('scroll')); tick(0); });
    expect(container.querySelector('[data-seasonal-corner-pet]')).toBeNull();
    unmount(); home.remove();
  });
});
