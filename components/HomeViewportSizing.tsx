"use client";

import { useEffect, useRef } from "react";

/** Size from the viewport, never from children whose size we are changing. */
export function HomeViewportSizing() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.parentElement;
    if (!root) return;
    let frame = 0;
    let inputKey = '';
    let previousDesktop = window.innerWidth >= 1280;
    const moving = Array.from(root.querySelectorAll<HTMLElement>('[data-seasonal-hero], [data-home-actions], .home-map-toggle'));
    // Following sections must stay in normal flow. Translating the news block
    // from its old position can pull it into the first screen during the slide.
    let previousRects = moving.map(element => element.getBoundingClientRect());
    const disclosure = root.querySelector<HTMLElement>('.home-map-disclosure');
    const surface = root.querySelector<HTMLElement>('.home-map-surface');
    const contacts = root.querySelector<HTMLElement>('[aria-label="Контакты служб"]');
    let previousMap = disclosure?.getBoundingClientRect();
    let animations: Animation[] = [];
    const transitionLayout = () => {
      const desktop = window.innerWidth >= 1280;
      const rects = moving.map(element => element.getBoundingClientRect());
      const mapRect = disclosure?.getBoundingClientRect();
      if (window.innerWidth < 640) {
        animations.forEach(animation => animation.cancel());
        animations = [];
      } else if (desktop !== previousDesktop && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animations.forEach(animation => animation.cancel());
        animations = [];
        const timing = { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' };
        moving.forEach((element, index) => {
          const from = previousRects[index], to = rects[index];
          if (!from.width || !from.height || !to.width || !to.height) return;
          // A newly stacked notice reserves space above the hero. Do not
          // animate the hero back up into that row from its old coordinates.
          const dy = element.hasAttribute('data-seasonal-hero') ? Math.max(0, from.top - to.top) : from.top - to.top;
          animations.push(element.animate([
            { transform: `translate3d(${from.left - to.left}px, ${dy}px, 0)` },
            { transform: 'translate3d(0, 0, 0)' },
          ], timing));
        });
        // The desktop map has already moved in the responsive grid. Keep its
        // live surface at the old coordinates while it slides out to the right.
        if (!desktop && disclosure && surface && previousMap?.width && previousMap.height) {
          // Keep a stationary clipped viewport inside the screen. Only its
          // contents move, so the animation cannot widen the document.
          const box = { position: 'fixed', left: `${previousMap.left}px`, top: `${previousMap.top}px`,
            width: `${Math.max(0, Math.min(previousMap.width, document.documentElement.clientWidth - previousMap.left))}px`,
            height: `${previousMap.height}px`, overflow: 'hidden', visibility: 'visible', zIndex: '40', gridTemplateRows: '1fr' };
          animations.push(disclosure.animate([box, box], timing));
          animations.push(surface.animate([
            { width: `${previousMap.width}px`, height: `${previousMap.height}px`, transform: 'translate3d(0, 0, 0)' },
            { width: `${previousMap.width}px`, height: `${previousMap.height}px`, transform: `translate3d(${previousMap.width + 1}px, 0, 0)` },
          ], timing));
        }
        if (desktop) {
          // Reserve the full map height immediately. Both surfaces enter from
          // the right inside the clipped column; contacts never travel down
          // behind a map whose height is still growing.
          for (const element of [surface, contacts]) {
            if (element) animations.push(element.animate([
              { transform: 'translate3d(100%, 0, 0)' },
              { transform: 'translate3d(0, 0, 0)' },
            ], timing));
          }
        }
      }
      previousDesktop = desktop;
      previousRects = rects;
      previousMap = mapRect;
    };
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const header = document.getElementById('site-header');
        const notice = document.querySelector('[aria-label="Важное уведомление"]');
        const available = (window.visualViewport?.height ?? window.innerHeight) - (header?.getBoundingClientRect().height ?? 72)
          - (notice?.getBoundingClientRect().height ?? 0);
        const key = JSON.stringify([window.innerWidth, window.innerHeight, window.devicePixelRatio,
          root.clientWidth, available]);
        if (key === inputKey) return;
        inputKey = key;
        const side = Math.floor(Math.max(360, Math.min(540, available - 360, root.clientWidth * .36)));
        const setChanged = (element: HTMLElement, name: string, value: string) => {
          if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
        };
        setChanged(root, '--home-available-height', `${Math.max(0, available)}px`);
        setChanged(root, '--home-map-side', `${side}px`);
        setChanged(document.documentElement, '--home-notice-map-width', `${side}px`);
        transitionLayout();
      });
    };
    const observer = new ResizeObserver(measure);
    [document.getElementById('site-header'), document.querySelector('[aria-label="Важное уведомление"]')].forEach(el => { if (el) observer.observe(el); });
    const mutations = new MutationObserver(measure);
    const shell = root.closest('.site-shell');
    if (shell) mutations.observe(shell, { childList: true });
    // One update per animation frame; no delayed second jump after resizing.
    const onResize = measure;
    const onFonts = () => { inputKey = ''; measure(); };
    document.fonts?.addEventListener('loadingdone', onFonts);
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    measure();
    return () => { observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame); animations.forEach(animation => animation.cancel()); document.fonts?.removeEventListener('loadingdone', onFonts); window.removeEventListener('resize', onResize); window.visualViewport?.removeEventListener('resize', onResize); document.documentElement.style.removeProperty('--home-notice-map-width'); };
  }, []);
  return <><span ref={anchor} hidden /><style jsx global>{`
    [data-home-composition] { position: relative; z-index: 1; background: #f8fafc; }
    [data-home-composition] [data-home-hero-content] > div { container-type: inline-size; width: 100%; }
    @media (min-width: 640px) {
      [data-home-composition] [data-seasonal-hero] { padding: 48px 32px 64px; }
      [data-home-composition] [data-seasonal-hero] > .relative { padding: 0; }
      [data-home-composition] [data-home-hero-content] { display: flex; flex-direction: column; justify-content: center; min-height: 300px; }
      [data-home-composition] [data-home-hero-content] > div { margin-inline: auto; }
      [data-home-composition] [data-seasonal-hero] h1 { font-size: min(44px, 4.6cqw); white-space: nowrap; }
      [data-home-composition] [data-seasonal-hero] p { font-size: 20px; line-height: 1.4; }
    }
    [data-home-composition] [data-home-actions] { padding: 20px 0 0; justify-content: flex-start; container-type: inline-size; container-name: home-actions; }
    [data-home-composition] [data-home-actions] > .container { padding: 0; max-width: none; justify-content: flex-start; }
    [data-home-composition] [data-home-actions] h2 { flex-shrink: 0; text-align: center; font-size: 26px; line-height: 32px; margin: 0 0 20px; }
    [data-home-composition] .quick-actions-grid { flex: 0 0 auto; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; padding: 0 20px 20px; }
    [data-home-composition] .quick-actions-grid > * { height: 180px; min-height: 0; min-width: 0; width: 100%; }
    [data-home-composition] .quick-action-card { min-width: 0; width: 100%; }
    [data-home-composition] .quick-action-card-footer button,
    [data-home-composition] .quick-action-card-footer span.quick-action-card-footer { min-width: 0; padding-left: 6px; padding-right: 6px; font-size: 12px; white-space: normal; text-align: center; }
    [data-home-composition] .quick-action-card > div:first-child { padding: 14px 14px 8px; }
    [data-home-composition] .quick-action-card-icon { width: 44px; height: 44px; margin: 0 0 8px; }
    [data-home-composition] .quick-action-card-icon svg { width: 36px; height: 36px; }
    [data-home-composition] .quick-action-card h3 { font-size: 16px; margin-top: auto; margin-bottom: 9px; }
    [data-home-composition] .quick-action-card p { display: none; }
    [data-home-composition] .quick-action-card > .quick-action-card-footer { padding: 0 14px 12px; }
    @container home-actions (min-width: 901px) {
      [data-home-composition] [data-home-actions] h2 { margin-bottom: 0; }
      [data-home-composition] .quick-actions-grid {
        flex: 1;
        grid-auto-rows: 180px;
        align-content: center;
        padding-top: 20px;
      }
    }
    /* Follow the available column width, not the viewport: the map can take
       almost half the screen while the viewport still looks like desktop. */
    @container home-actions (max-width: 900px) {
      [data-home-composition] .quick-actions-grid { flex: 1; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 0 16px 16px; }
      [data-home-composition] .quick-actions-grid > * { height: auto; min-height: 82px; }
      [data-home-composition] .quick-action-card > div:first-child { flex-direction: row; align-items: center; gap: 14px; padding: 18px; }
      [data-home-composition] .quick-action-card-icon { width: 36px; height: 36px; margin: 0; }
      [data-home-composition] .quick-action-card-icon svg { width: 30px; height: 30px; }
      [data-home-composition] .quick-action-card h3 { min-width: 0; margin: 0; font-size: 16px; line-height: 1.35; overflow-wrap: break-word; }
      [data-home-composition] .quick-action-card > .quick-action-card-footer { display: none; }
      [data-home-composition] .quick-action-card-link:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; }
    }
    @container home-actions (max-width: 600px) {
      [data-home-composition] .quick-actions-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 0 12px 12px; }
      [data-home-composition] .quick-actions-grid > * { min-height: 64px; }
      [data-home-composition] .quick-action-card > div:first-child { padding: 14px 16px; }
      [data-home-composition] .quick-action-card-icon { width: 30px; height: 30px; }
      [data-home-composition] .quick-action-card-icon svg { width: 26px; height: 26px; }
    }
    @media (max-width: 639px) {
      [data-home-composition] [data-home-actions] { padding: 14px 0 0; }
      [data-home-composition] [data-home-actions] > .container { flex: 0 0 auto; }
      [data-home-composition] [data-home-actions] h2 { text-align: left; font-size: 18px; line-height: 24px; margin: 0 16px 10px; }
      [data-home-composition] .home-actions-heading { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 8px; row-gap: 4px; margin: 14px 12px 10px; }
      [data-home-composition] .home-actions-heading h2 { grid-column: 1; grid-row: 1; margin: 0; font-size: 16px; line-height: 22px; }
      [data-home-composition] [data-home-map-column] > .home-expandable-map[data-open] { display: none; }
      [data-home-composition] .home-expandable-map .home-map-toggle { min-height: 66px; padding: 12px; border: 0; gap: 10px; }
      [data-home-composition] .home-map-toggle > span:first-child { width: 36px; height: 36px; border-radius: 0; }
      [data-home-composition] .home-map-toggle .text-base { font-size: 14px; line-height: 20px; }
      [data-home-composition] .home-map-toggle .text-xs { font-size: 11px; line-height: 16px; }
      [data-home-composition] .home-map-chevron { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 0; background: #f8fafc; }
      [data-home-composition] .quick-action-card { border-radius: 0; box-shadow: none; }
      [data-home-about] { display: none; }
      [data-home-news] .home-news-section { min-height: 0; padding-top: 24px; }
      [data-home-news] .home-news-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 12px 12px; }
      [data-home-news] .home-news-heading h2 { font-size: 24px; line-height: 30px; text-align: left; }
      [data-home-news] .home-news-heading a { flex-shrink: 0; margin: 0; font-size: 13px; min-height: 44px; }
      [data-home-news] .home-news-grid { flex: none; align-content: start; gap: 16px; padding: 16px 12px 28px; }
      [data-home-news] .news-card-link { min-width: 0; }
      [data-home-news] .news-card-body { padding: 16px; }
      [data-home-news] .news-card-body h2 { font-size: 18px; line-height: 24px; overflow-wrap: anywhere; }
      [data-home-news] .news-card-body > p { margin-bottom: 16px; font-size: 14px; line-height: 21px; overflow-wrap: anywhere; }

      [data-home-contacts] { padding: 24px 12px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
      [data-home-contacts] > .container { margin-bottom: 20px; padding: 0; }
      [data-home-contacts] h2 { font-size: 24px; line-height: 30px; text-align: left; }
      [data-home-contacts] > .grid { gap: 12px; }
      [data-home-contacts] [data-contact-card] { min-height: 0; border-width: 1px; }
      [data-home-contacts] [data-contact-card] > div { padding: 16px; }
      [data-home-contacts] [data-contact-heading] { display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; min-height: 0; margin-bottom: 8px; gap: 10px; }
      [data-home-contacts] [data-contact-heading] > svg { width: 24px; height: 24px; }
      [data-home-contacts] [data-contact-heading] h3 { font-size: 17px; line-height: 23px; text-align: left; }
      [data-home-contacts] [data-contact-heading] > p { display: none; }
      [data-home-contacts] [data-contact-hours] { display: block; width: 100%; margin-bottom: 12px; font-size: 12px; line-height: 18px; color: #64748b; text-align: left; }
      [data-home-contacts] [data-contact-methods] { gap: 8px; }
      [data-home-contacts] [data-contact-methods] > div:not([hidden]) { min-height: 0; margin: 0; }
      [data-home-contacts] [data-contact-phone] { position: relative; align-items: stretch; }
      [data-home-contacts] [data-contact-phone] > svg { position: absolute; left: 12px; top: 14px; width: 16px; height: 16px; pointer-events: none; }
      [data-home-contacts] [data-contact-phone] > a:not([hidden]) { display: flex; align-items: center; justify-content: center; min-height: 44px; margin: 0; padding: 8px 12px 8px 36px; border: 1px solid #cbd5e1; background: #fff; font-size: 15px; line-height: 20px; }
      [data-home-contacts] [data-contact-phone] > p { display: none; }
      [data-home-contacts] [data-contact-extra] { align-items: stretch; padding-top: 12px; margin-top: 4px !important; text-align: left; }
      [data-home-contacts] [data-contact-extra] > svg, [data-home-contacts] [data-contact-extra] > p:last-child { display: none; }
      [data-home-contacts] [data-contact-extra] > p { font-size: 12px; line-height: 18px; }
      [data-home-contacts] a[href^="mailto:"] { display: flex; align-items: center; min-height: 44px; font-size: 14px; overflow-wrap: anywhere; }
      [data-home-contacts] a[href="/emergency"] { width: 100%; min-height: 44px; padding: 10px 12px; font-size: 14px; }

      body:has([data-seasonal-home]) .site-footer { opacity: 1; transform: none; transition: none; }
      body:has([data-seasonal-home]) .site-footer > .container { padding: 24px 16px max(88px, env(safe-area-inset-bottom)); }
      body:has([data-seasonal-home]) .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 16px; }
      body:has([data-seasonal-home]) .footer-brand, body:has([data-seasonal-home]) .footer-contacts { grid-column: 1 / -1; }
      body:has([data-seasonal-home]) .footer-brand > a { margin-bottom: 10px; }
      body:has([data-seasonal-home]) .footer-brand img { width: 40px; height: 40px; }
      body:has([data-seasonal-home]) .footer-brand > p { max-width: 320px; font-size: 13px; line-height: 20px; }
      body:has([data-seasonal-home]) .footer-grid h3 { margin-bottom: 8px; font-size: 14px; }
      body:has([data-seasonal-home]) .site-footer .footer-grid li { margin-top: 0; }
      body:has([data-seasonal-home]) .footer-grid li a { display: flex; align-items: center; min-height: 44px; font-size: 13px; line-height: 18px; }
      body:has([data-seasonal-home]) .site-footer .footer-contacts li:last-child { margin-top: 8px; font-size: 13px; line-height: 20px; }
      body:has([data-seasonal-home]) .footer-legal { margin-top: 24px; padding-top: 20px; text-align: left; font-size: 12px; line-height: 18px; }
      body:has([data-seasonal-home]) .footer-legal > div { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; align-items: stretch; }
      body:has([data-seasonal-home]) .footer-legal a { display: flex; align-items: center; min-height: 44px; padding-block: 6px; }
      body:has([data-seasonal-home]) [data-assistant-mobile-spacer] { display: none; }
      /* A bounded, content-driven hero: short guest cards and tall/zoomed
         viewports must never turn the background into a full-screen poster. */
      [data-home-composition] [data-seasonal-hero] { min-height: clamp(244px, 37svh, 360px); padding-top: clamp(18px, 3svh, 26px); padding-bottom: clamp(18px, 3svh, 26px); flex: 0 0 auto; }
      [data-home-composition] [data-seasonal-hero] > .relative { padding-left: 16px; padding-right: 16px; }
      [data-home-composition] [data-seasonal-hero] > img { transform: scale(1.08); transform-origin: center; }
      [data-home-composition] [data-seasonal-hero] > .absolute { background: linear-gradient(110deg, #082f49b8, #0c4a6e80 70%, #07598573); }
      [data-home-composition] [data-home-hero-content] { min-height: 0; gap: 20px; }
      [data-home-composition] [data-home-hero-content] > div > div:first-child { display: none; }
      [data-home-composition] [data-seasonal-hero] h1 { font-size: clamp(28px, 7.5vw, 40px); line-height: 1.12; letter-spacing: -.025em; margin-bottom: 12px; text-wrap: balance; }
      [data-home-composition] [data-seasonal-hero] p { max-width: 440px; font-size: 15px; line-height: 21px; margin-bottom: 18px; color: #f0f9ff; }
      [data-home-composition] [data-home-hero-buttons] { margin-top: 0; gap: 8px; flex-direction: row; }
      [data-home-composition] [data-home-hero-buttons] > * { flex: 1; min-width: 0; min-height: 48px; padding: 10px 8px; font-size: 13px; line-height: 18px; border-radius: 0; }
      [data-home-composition] [data-home-hero-buttons] > :last-child { border-color: #ffffff40; background: #ffffff0a; }
    }
    @media (max-width: 1279px) {
      /* Fill the first screen through the actions, not an empty area after the
         map. Content may still grow naturally on short screens or when opened. */
      [data-home-composition] { display: flex; flex-direction: column; min-height: var(--home-available-height, calc(100dvh - 7.5rem)); }
      [data-home-composition] + [data-home-news] { padding-top: 0; }
      [data-home-hero-row], [data-home-map-column] { display: contents; }
      [data-home-hero-row] [data-seasonal-hero] { order: 0; flex-shrink: 0; }
      [data-home-composition] [data-home-actions] { order: 1; flex: 1 0 auto; }
      [data-home-map-column] > .home-expandable-map { order: 2; }
      [data-home-map-column] > section[aria-label="Контакты служб"] { display: none; }
    }
    @media (max-width: 639px) {
      [data-home-composition] { min-height: 0; }
      [data-home-composition] [data-home-actions] { order: 2; flex: 0 0 auto; padding-top: 0; }
      [data-home-composition] [data-home-map-column] > .home-expandable-map[data-open] { order: 1; position: static; margin-top: 12px; }
    }
    @media (min-width: 640px) and (max-width: 1279px) {
      /* Reserve the actual card row, heading/padding (60px), and map menu
         before sizing the hero. A 300px hero floor pushed the menu offscreen. */
      [data-home-composition] {
        --home-action-card-height: clamp(208px, calc(var(--home-available-height, 650px) * .4), 250px);
        --home-map-menu-height: 64px;
      }
      [data-home-composition] [data-seasonal-hero] { min-height: 0; height: clamp(172px, calc(var(--home-available-height, 650px) - var(--home-action-card-height) - 60px - var(--home-map-menu-height)), 412px); padding: 12px 32px; }
      [data-home-composition] [data-home-hero-content] { min-height: 0; }
      [data-home-composition] [data-home-hero-content] > div > div:first-child { margin-bottom: 10px; }
      [data-home-composition] [data-seasonal-hero] h1 { margin-bottom: 10px; }
      [data-home-composition] [data-seasonal-hero] p { font-size: 18px; line-height: 24px; margin-bottom: 0; }
      [data-home-composition] [data-home-hero-buttons] { margin-top: 14px; }
      [data-home-composition] [data-home-hero-buttons] > * { min-height: 44px; padding-block: 10px; }
      [data-home-composition] [data-home-actions] { padding: 10px 0 0; }
      [data-home-composition] [data-home-actions] h2 { font-size: 24px; line-height: 28px; margin: 0 0 10px; }
      [data-home-composition] .quick-actions-grid { padding: 0 16px 12px; align-content: center; }
      [data-home-composition] [data-home-actions] .quick-actions-grid:has(.home-metric-card) { grid-auto-rows: var(--home-action-card-height); }
      [data-home-composition] [data-home-actions] .quick-actions-grid > .home-metric-card { height: var(--home-action-card-height); min-height: 0; padding: 10px; }
      [data-home-composition] .home-metric-card > div { padding-top: 6px; margin-top: 6px; margin-bottom: 6px; }
      [data-home-composition] .home-metric-card > .home-metric-actions { padding-top: 0; margin-top: auto; margin-bottom: 0; }
      [data-home-composition] .home-expandable-map .home-map-toggle { height: var(--home-map-menu-height); min-height: var(--home-map-menu-height); padding: 10px 16px; }
    }
    @media (min-width: 640px) and (max-width: 1279px) and (max-height: 650px) {
      [data-home-composition] { --home-action-card-height: 212px; --home-map-menu-height: 60px; }
      [data-home-composition] [data-home-hero-content] > div > div:first-child { display: none; }
      [data-home-composition] [data-seasonal-hero] { height: max(152px, calc(var(--home-available-height, 500px) - 332px)); }
      [data-home-composition] .metric-bar-chart .bar-track { height: 28px; }
      [data-home-composition] .home-metric-card > .home-metric-actions { flex-direction: row; gap: 6px; }
      [data-home-composition] .home-metric-actions > * { flex: 1; text-align: center; }
    }
    @media (min-width: 1280px) {
      /* Keep card height stable until the map collapses; width stays fluid. */
      [data-home-composition] .quick-actions-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        justify-content: center;
        align-content: center;
        flex: 1;
        gap: 20px;
        padding: 20px;
      }
      [data-home-composition] [data-home-actions] .quick-actions-grid:has(.home-metric-card) { grid-auto-rows: 270px; }
      [data-home-composition] [data-home-actions] .quick-actions-grid > .home-metric-card { height: 270px; min-height: 270px; }
      [data-home-composition] [data-home-actions] h2 { margin-bottom: 0; }
      [data-home-composition] {
        display: grid;
        min-height: var(--home-available-height, calc(100dvh - 7.5rem));
        grid-template-columns: minmax(0, 1fr) var(--home-map-side, 400px);
        grid-template-rows: minmax(var(--home-map-side, 400px), auto) minmax(min-content, 1fr);
      }
      [data-home-hero-row] { display: contents; }
      [data-home-map-column] { grid-column: 2; grid-row: 1 / 3; }
      [data-home-actions] { grid-column: 1; grid-row: 2; }
      [data-home-hero-row] [data-seasonal-hero] { grid-column: 1; grid-row: 1; padding-top: 20px; padding-bottom: 20px; }
      [data-home-composition] [data-home-hero-content] > div { transform: none; }
      [data-home-composition] [data-home-hero-content] { min-height: 0; }
      [data-home-map-column] > section[aria-label="Контакты служб"] > a { flex-shrink: 0; }
      [data-home-map-column] > section[aria-label="Контакты служб"] > div > div { padding: 12px 8px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] h2 { margin-bottom: 8px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] a[href^="tel:"] { min-height: 32px; font-size: 12px; }
    }
    @media (min-width: 1280px) and (max-height: 850px) {
      /* Map width must not impose a square's height on a short window. */
      [data-home-composition] {
        --home-top-height: max(220px, calc(var(--home-available-height, 650px) - 310px));
        grid-template-rows: var(--home-top-height) minmax(310px, 1fr);
      }
      [data-home-composition] [data-seasonal-hero] { min-height: 0; padding-block: 12px; }
      [data-home-composition] [data-seasonal-hero] h1 { margin-bottom: 12px; }
      [data-home-composition] [data-seasonal-hero] p { margin-bottom: 12px; }
      [data-home-composition] [data-home-hero-buttons] { margin-top: 12px; }
      [data-home-composition] [data-home-hero-buttons] > * { padding-block: 12px; }
      [data-home-composition] [data-home-map-column] .home-map-surface { aspect-ratio: auto; height: var(--home-top-height); }
      [data-home-composition] [data-home-actions] { padding-top: 10px; padding-bottom: 0; }
      [data-home-composition] [data-home-actions] h2 { font-size: 22px; line-height: 28px; }
      [data-home-composition] [data-home-actions] .quick-actions-grid { padding: 10px 20px; }
      [data-home-composition] [data-home-actions] .quick-actions-grid:has(.home-metric-card) { grid-auto-rows: 252px; }
      [data-home-composition] [data-home-actions] .quick-actions-grid > .home-metric-card { height: 252px; min-height: 252px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] > div > div { padding-block: 8px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] > div > div > span { height: 28px; width: 28px; margin-bottom: 4px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] h2 { margin-bottom: 4px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] p { margin-top: 4px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] a[href="/emergency"] { margin-top: 6px; padding: 6px; }
    }
    @media (min-width: 1280px) and (max-height: 650px) {
      [data-home-composition] { --home-top-height: max(180px, calc(var(--home-available-height, 480px) - 266px)); grid-template-rows: var(--home-top-height) minmax(266px, 1fr); }
      [data-home-composition] [data-home-hero-content] > div > div:first-child { display: none; }
      [data-home-composition] [data-seasonal-hero] p { font-size: 16px; }
      [data-home-composition] [data-home-actions] .quick-actions-grid:has(.home-metric-card) { grid-auto-rows: 208px; }
      [data-home-composition] [data-home-actions] .quick-actions-grid > .home-metric-card { height: 208px; min-height: 208px; padding: 10px; }
      [data-home-composition] [data-home-actions] .home-metric-card > div { padding-top: 4px; margin-top: 4px; margin-bottom: 4px; }
      [data-home-composition] [data-home-actions] .home-metric-card > .home-metric-actions { display: flex; flex-direction: row; gap: 8px; margin-top: auto; margin-bottom: 0; padding-top: 0; }
      [data-home-composition] [data-home-actions] .home-metric-actions > * { flex: 1; }
      [data-home-composition] [data-home-actions] .metric-bar-chart .bar-track { height: 30px; }
      [data-home-map-column] > section[aria-label="Контакты служб"] > div > div > span { display: none; }
    }
  `}</style></>;
}
