import { readSeasonalPreview, setSeasonalPreview, shouldShowSeasonalPet, shouldShowSeasonalEffects, SEASONAL_PREVIEW_KEY, SEASONAL_PREVIEW_EVENT } from '@/lib/seasonal-preview';

describe('seasonal dev settings', () => {
  it('limits seasonal effects to the home hero and personal account',()=>{
    for(const path of ['/','/dashboard','/dashboard/settings','/dashboard/meters'])expect(shouldShowSeasonalEffects(path)).toBe(true);
    for(const path of ['/about','/admin','/dev/autumn','/dashboard-other',null])expect(shouldShowSeasonalEffects(path)).toBe(false);
  });
  it('keeps the companion available on other pages too',()=>{
    for(const path of ['/','/dashboard','/about','/admin','/dev/autumn','/login'])expect(shouldShowSeasonalPet(path)).toBe(true);
    expect(shouldShowSeasonalPet(null)).toBe(false);
    expect(shouldShowSeasonalPet('/admin/questions')).toBe(false);
    expect(shouldShowSeasonalPet('/admin/questions/example')).toBe(false);
    expect(shouldShowSeasonalPet('/admin')).toBe(true);
  });
  const original = process.env.NODE_ENV;
  afterEach(() => { Object.defineProperty(process.env, 'NODE_ENV', { value: original, writable: true }); localStorage.clear(); });
  function environment(value: string) { Object.defineProperty(process.env, 'NODE_ENV', { value, writable: true }); }
  it('is off by default in development', () => { environment('development'); expect(readSeasonalPreview()).toBe(false); });
  it('saves browser-only preference and notifies the same tab', () => {
    environment('development'); const listener=jest.fn();window.addEventListener(SEASONAL_PREVIEW_EVENT,listener);
    setSeasonalPreview(true);expect(readSeasonalPreview()).toBe(true);expect(listener).toHaveBeenCalledTimes(1);
    setSeasonalPreview(false);expect(readSeasonalPreview()).toBe(false);window.removeEventListener(SEASONAL_PREVIEW_EVENT,listener);
  });
  it('cannot activate in production even with an existing preference', () => {
    environment('production');localStorage.setItem(SEASONAL_PREVIEW_KEY,'on');expect(readSeasonalPreview()).toBe(false);
    setSeasonalPreview(false);expect(localStorage.getItem(SEASONAL_PREVIEW_KEY)).toBe('on');
  });
  it('fails closed when browser storage is unavailable', () => {
    environment('development');const spy=jest.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('denied');});
    expect(readSeasonalPreview()).toBe(false);spy.mockRestore();
  });
});
