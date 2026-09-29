import { act, fireEvent, render, screen } from '@testing-library/react';
import { DevTariffNotice } from '@/components/layout/DevTariffNotice';
import { usePathname } from 'next/navigation';
import fs from 'fs';
import path from 'path';
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
const fetchOriginal = global.fetch;
const notice = { id:'n',text:'С 1 октября изменятся тарифы',buttonLabel:'Что изменится',newsId:'article',endsAt:'2026-10-01T00:00:00Z',updatedAt:'v1' };
beforeEach(() => {
  (usePathname as jest.Mock).mockReturnValue('/');
  global.fetch = jest.fn().mockResolvedValue({ok:true,json:async()=>({notice,serverNow:'2026-09-21T00:00:00Z'})});
});
afterEach(() => { global.fetch = fetchOriginal; jest.useRealTimers(); });
it('links directly to the configured news', async () => {
  render(<DevTariffNotice />);
  expect(await screen.findByRole('link',{name:'Что изменится'})).toHaveAttribute('href','/news/article');
});
it.each([0, 1])('can dismiss and reopen the same notice using close control %s', async control => {
  render(<DevTariffNotice />); await screen.findByRole('region');
  // JSDOM does not apply the responsive CSS hiding the other viewport's control.
  fireEvent.click(screen.getAllByRole('button',{name:'Свернуть уведомление'})[control]);
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Важное уведомление'}));
  expect(screen.getByRole('region')).toBeInTheDocument();
});
it('removes the notice when its deadline passes without reloading', async () => {
  jest.useFakeTimers();
  (global.fetch as jest.Mock).mockResolvedValueOnce({ok:true,json:async()=>({notice:{...notice,endsAt:'2026-09-21T00:00:01Z'},serverNow:'2026-09-21T00:00:00Z'})}).mockResolvedValue({ok:true,json:async()=>({notice:null,serverNow:'2026-09-21T00:00:01Z'})});
  render(<DevTariffNotice />);
  await act(async()=>{});
  expect(screen.getByRole('region')).toBeInTheDocument();
  await act(async()=>{jest.advanceTimersByTime(1100);});
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
});
it.each(['/login','/admin','/services'])('does not request notices on %s', route => {
  (usePathname as jest.Mock).mockReturnValue(route);
  render(<DevTariffNotice />); expect(global.fetch).not.toHaveBeenCalled();
});
it('does not invent a notice when API is unavailable',async()=>{
  (global.fetch as jest.Mock).mockResolvedValue({ok:false});
  await act(async()=>{render(<DevTariffNotice />);});
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
});
it('is gated by an explicit release feature flag',()=>{
  expect(fs.readFileSync(path.join(process.cwd(),'app/layout.tsx'),'utf8')).toContain("noticesEnabled() && <DevTariffNotice />");
});

it('uses the entire notice row without a demo outage notice or split column', async () => {
  const env = jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development', NEXT_PUBLIC_HOME_VISUAL_PREVIEW: 'true' });
  const view = render(<DevTariffNotice />);
  try {
    await act(async () => {});
    expect(screen.getByRole('region', { name: 'Важное уведомление' })).not.toHaveAttribute('data-home-notice-split');
    expect(screen.queryByText('По вашему адресу ведутся работы')).not.toBeInTheDocument();
    expect(view.container.querySelector('.outage-slot')).toBeNull();
  } finally {
    view.unmount();
    env.restore();
  }
});
