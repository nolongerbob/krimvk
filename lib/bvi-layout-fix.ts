'use client';

import { SITE_HEADER_ID, SITE_SHELL_CLASS } from '@/lib/bvi-constants';

export { SITE_HEADER_ID, SITE_SHELL_CLASS };

/** Как в isvek BVI: fontSize 1–40 (см. bvi.min.js). */
export const BVI_FONT_SIZE_MIN = 1;
export const BVI_FONT_SIZE_MAX = 40;

const BVI_BODY_ATTRS = [
  'data-bvi-fontsize',
  'data-bvi-theme',
  'data-bvi-images',
  'data-bvi-speech',
  'data-bvi-lineheight',
  'data-bvi-letterspacing',
  'data-bvi-fontfamily',
] as const;

let panelResizeObserver: ResizeObserver | null = null;
let bviBodyObserver: MutationObserver | null = null;
let panelClickHandler: ((e: Event) => void) | null = null;
let lastSyncedKey = '';
let syncUiRaf = 0;

export function readBviFontSizeFromBody(): number {
  if (typeof document === 'undefined') return 16;

  const wrapper = document.querySelector('.bvi-body');
  if (!wrapper) return 16;

  const fontAttr =
    wrapper.getAttribute('data-bvi-fontsize') ??
    wrapper.getAttribute('data-bvi-fontSize');
  const parsed = fontAttr ? Number.parseInt(fontAttr, 10) : 16;

  return Math.min(
    BVI_FONT_SIZE_MAX,
    Math.max(BVI_FONT_SIZE_MIN, Number.isFinite(parsed) ? parsed : 16)
  );
}

export function resetBviUiSyncCache(): void {
  lastSyncedKey = '';
}

/** Синхронизирует масштаб (rem) и тему шапки с .bvi-body. */
export function syncBviUiFromBody(): void {
  if (typeof document === 'undefined') return;

  if (syncUiRaf) cancelAnimationFrame(syncUiRaf);
  syncUiRaf = requestAnimationFrame(() => {
    syncUiRaf = 0;

    const wrapper = document.querySelector('.bvi-body');
    if (!wrapper) return;

    const size = readBviFontSizeFromBody();
    const fontAttr =
      wrapper.getAttribute('data-bvi-fontsize') ??
      wrapper.getAttribute('data-bvi-fontSize');
    const theme = wrapper.getAttribute('data-bvi-theme') ?? 'white';
    const key = `${size}:${theme}`;

    if (lastSyncedKey === key) return;
    lastSyncedKey = key;

    if (fontAttr !== String(size)) {
      wrapper.setAttribute('data-bvi-fontsize', String(size));
    }

    document.documentElement.style.setProperty('--bvi-root-px', `${size}px`);
    const headerPx = Math.min(22, Math.max(16, size));
    document.documentElement.style.setProperty('--bvi-header-px', `${headerPx}px`);

    const header = document.getElementById(SITE_HEADER_ID);
    if (header) {
      for (const attr of BVI_BODY_ATTRS) {
        const value = wrapper.getAttribute(attr);
        if (value == null) header.removeAttribute(attr);
        else header.setAttribute(attr, value);
      }
    }

    const footer = document.querySelector('footer.site-footer');
    if (footer) {
      for (const attr of BVI_BODY_ATTRS) {
        const value = wrapper.getAttribute(attr);
        if (value == null) footer.removeAttribute(attr);
        else footer.setAttribute(attr, value);
      }
    }

    window.dispatchEvent(new CustomEvent('bvi-layout-updated'));
  });
}

function observeBviBody(): void {
  bviBodyObserver?.disconnect();

  const wrapper = document.querySelector('.bvi-body');
  if (!wrapper) return;

  syncBviUiFromBody();
  bviBodyObserver = new MutationObserver(() => syncBviUiFromBody());
  bviBodyObserver.observe(wrapper, {
    attributes: true,
    attributeFilter: [...BVI_BODY_ATTRS],
  });
}

function bindBviPanelSync(): void {
  if (panelClickHandler) return;

  panelClickHandler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('.bvi-panel')) return;
    syncBviUiFromBody();
  };

  document.addEventListener('click', panelClickHandler, true);
}

function unbindBviPanelSync(): void {
  if (!panelClickHandler) return;
  document.removeEventListener('click', panelClickHandler, true);
  panelClickHandler = null;
}

function disconnectBviBodyObserver(): void {
  bviBodyObserver?.disconnect();
  bviBodyObserver = null;
  document.documentElement.style.removeProperty('--bvi-root-px');
  lastSyncedKey = '';
}

export function isolateSiteHeaderFromBviBody(): void {
  if (typeof document === 'undefined') return;

  const header = document.getElementById(SITE_HEADER_ID);
  const wrapper = document.querySelector('.bvi-body');
  if (!header || !wrapper?.parentElement) return;

  if (!header.closest('.bvi-body')) return;

  wrapper.parentElement.insertBefore(header, wrapper);
}

export function restoreSiteHeaderToShell(): void {
  if (typeof document === 'undefined') return;

  const header = document.getElementById(SITE_HEADER_ID);
  const shell = document.querySelector(`.${SITE_SHELL_CLASS}`);
  if (!header || !shell || header.parentElement === shell) return;

  shell.insertBefore(header, shell.firstChild);

  for (const attr of BVI_BODY_ATTRS) {
    header.removeAttribute(attr);
  }

  const footer = document.querySelector('footer.site-footer');
  if (footer) {
    for (const attr of BVI_BODY_ATTRS) {
      footer.removeAttribute(attr);
    }
  }
}

/** Футер вне .bvi-body — на всю ширину, без двойных боковых отступов. */
export function isolateSiteFooterFromBviBody(): void {
  if (typeof document === 'undefined') return;

  const footer = document.querySelector('footer.site-footer');
  const wrapper = document.querySelector('.bvi-body');
  if (!footer || !wrapper?.parentElement) return;

  if (!footer.closest('.bvi-body')) return;

  wrapper.parentElement.appendChild(footer);
}

export function restoreSiteFooterToShell(): void {
  if (typeof document === 'undefined') return;

  const footer = document.querySelector('footer.site-footer');
  const shell = document.querySelector(`.${SITE_SHELL_CLASS}`);
  const main = shell?.querySelector('main');
  if (!footer || !shell || !main) return;

  if (footer.parentElement === shell && main.nextElementSibling === footer) return;

  main.after(footer);
}

export function syncBviPanelOffset(): void {
  if (typeof document === 'undefined') return;

  const panel = document.querySelector('.bvi-panel') as HTMLElement | null;
  const offset = panel?.offsetHeight ?? 0;
  document.documentElement.style.setProperty('--bvi-panel-offset', `${offset}px`);
  document.body.classList.toggle(
    'bvi-panel-fixed',
    panel?.classList.contains('bvi-fixed-top') ?? false
  );
}

export function observeBviPanelHeight(): void {
  disconnectBviPanelObserver();

  const panel = document.querySelector('.bvi-panel');
  if (!panel) return;

  syncBviPanelOffset();
  panelResizeObserver = new ResizeObserver(() => syncBviPanelOffset());
  panelResizeObserver.observe(panel);
}

export function disconnectBviPanelObserver(): void {
  panelResizeObserver?.disconnect();
  panelResizeObserver = null;
  document.documentElement.style.removeProperty('--bvi-panel-offset');
  document.body.classList.remove('bvi-panel-fixed');
}

export function applyBviLayoutFixes(): void {
  // Не переносим header/footer в DOM — React теряет узлы (NotFoundError).
  observeBviPanelHeight();
  observeBviBody();
  bindBviPanelSync();
  requestAnimationFrame(() => {
    syncBviPanelOffset();
    syncBviUiFromBody();
  });
}

export function clearBviLayoutFixes(): void {
  disconnectBviPanelObserver();
  disconnectBviBodyObserver();
  unbindBviPanelSync();
  restoreSiteHeaderToShell();
  restoreSiteFooterToShell();
}

/** @deprecated use syncBviUiFromBody */
export const syncBviRootFontSize = syncBviUiFromBody;
