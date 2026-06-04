'use client';

declare global {
  interface Window {
    isvek?: {
      Bvi: new (options?: {
        target?: string;
        lang?: string;
        speech?: boolean;
        panelFixed?: boolean;
        panelHide?: boolean;
        reload?: boolean;
      }) => void;
    };
    __bviInstance?: InstanceType<NonNullable<typeof window.isvek>['Bvi']> & {
      _init?: () => void;
      _config?: Record<string, string | number | boolean>;
    };
  }
}

import {
  applyBviLayoutFixes,
  clearBviLayoutFixes,
} from '@/lib/bvi-layout-fix';
import {
  BVI_ASSET_VERSION,
  BVI_CSS_HREF,
  BVI_KRIMVK_CSS_HREF,
} from '@/lib/bvi-assets';
import {
  applySpeechFixToInstance,
  bviSpeak,
  installBviSpeechFix,
  isChromiumBrowser,
  primeSpeechVoices,
  stopBviSpeech,
} from '@/lib/bvi-speech-patch';

const BVI_CSS = BVI_CSS_HREF;
const BVI_KRIMVK_CSS = BVI_KRIMVK_CSS_HREF;
const BVI_JS = `/bvi/js/bvi.min.js?v=${BVI_ASSET_VERSION}`;

/** Один скрытый триггер в layout — иначе на каждый new Bvi() вешаются лишние обработчики на кнопки в шапке. */
export const BVI_TRIGGER_ID = 'bvi-plugin-trigger';

const BVI_DEFAULT_COOKIES: Record<string, string | number | boolean> = {
  fontSize: 16,
  theme: 'white',
  images: 'grayscale',
  letterSpacing: 'normal',
  lineHeight: 'normal',
  speech: true,
  fontFamily: 'arial',
  builtElements: false,
  panelFixed: true,
  panelHide: false,
  reload: false,
  lang: 'ru-RU',
};

let bviActivateInFlight = false;

function clearBviCookie(name: string) {
  const trimmed = name.trim();
  const base = `${trimmed}=;path=/;max-age=0`;
  document.cookie = base;
  if (location.hostname) {
    document.cookie = `${base};domain=${location.hostname}`;
  }
}

function clearBviCookies() {
  if (typeof document === 'undefined') return;
  document.cookie.split(';').forEach((part) => {
    const name = part.split('=')[0]?.trim();
    if (name?.startsWith('bvi_')) {
      clearBviCookie(name);
    }
  });
}

function getBviCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)bvi_${name}=([^;]*)`));
  const value = match?.[1]?.trim();
  return value ? decodeURIComponent(value) : undefined;
}

function setBviCookie(name: string, value: string | number | boolean) {
  const expires = new Date(Date.now() + 864e5).toUTCString();
  const serialized = String(value);
  document.cookie = `bvi_${name}=${serialized};path=/;expires=${expires}`;
  if (location.hostname) {
    document.cookie = `bvi_${name}=${serialized};path=/;expires=${expires};domain=${location.hostname}`;
  }
}

function unwrapBviBody(wrapper: Element) {
  const parent = wrapper.parentNode;
  if (!parent) return;
  const docFrag = document.createDocumentFragment();
  while (wrapper.firstChild) {
    docFrag.appendChild(wrapper.firstChild);
  }
  parent.replaceChild(docFrag, wrapper);
}

function dedupeBviPanels() {
  const panels = document.querySelectorAll('.bvi-panel');
  for (let i = 1; i < panels.length; i++) {
    panels[i]?.remove();
  }
  const fixedLinks = document.querySelectorAll('.bvi-link-fixed-top');
  for (let i = 1; i < fixedLinks.length; i++) {
    fixedLinks[i]?.remove();
  }
}

/** Сбрасывает накопленные click-слушатели isvek на #bvi-plugin-trigger (каждый new Bvi() добавляет ещё один). */
function resetBviTriggerElement(): void {
  const el = document.getElementById(BVI_TRIGGER_ID);
  if (!el?.parentNode) return;
  const fresh = el.cloneNode(true) as HTMLAnchorElement;
  fresh.id = BVI_TRIGGER_ID;
  el.parentNode.replaceChild(fresh, el);
}

let bviPanelCloseHandler: ((event: Event) => void) | null = null;
let bviPanelDedupeObserver: MutationObserver | null = null;

function bindBviPanelCloseFix(): void {
  if (bviPanelCloseHandler) return;

  bviPanelCloseHandler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('.bvi-panel [data-bvi="close"]')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    closeBviPanel();
  };

  document.addEventListener('click', bviPanelCloseHandler, true);
}

function unbindBviPanelCloseFix(): void {
  if (!bviPanelCloseHandler) return;
  document.removeEventListener('click', bviPanelCloseHandler, true);
  bviPanelCloseHandler = null;
}

function observeBviPanelDedupe(): void {
  bviPanelDedupeObserver?.disconnect();
  bviPanelDedupeObserver = new MutationObserver(() => {
    if (document.querySelectorAll('.bvi-panel').length > 1) {
      dedupeBviPanels();
    }
  });
  bviPanelDedupeObserver.observe(document.body, { childList: true, subtree: true });
}

function disconnectBviPanelDedupeObserver(): void {
  bviPanelDedupeObserver?.disconnect();
  bviPanelDedupeObserver = null;
}

/** Полное выключение BVI (кнопка «Обычная версия сайта»). */
export function closeBviPanel(): void {
  if (typeof document === 'undefined') return;
  clearBviCookies();
  teardownBviDom();
  resetBviTriggerElement();
}

/** Снимает обёртку BVI с DOM (настройки в cookie сохраняются). */
export function teardownBviDom(): void {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('.bvi-panel').forEach((el) => el.remove());
  document.querySelectorAll('.bvi-link-fixed-top').forEach((el) => el.remove());
  document.querySelectorAll('.bvi-body').forEach((el) => unwrapBviBody(el));
  document.querySelectorAll('.bvi-speech').forEach((el) => el.remove());

  document.body.classList.remove('bvi-active', 'bvi-noscroll');
  document.documentElement.classList.remove('bvi-active');
  document.body.style.overflow = '';

  delete window.__bviInstance;

  clearBviLayoutFixes();
  stopBviSpeech();
  disconnectBviPanelDedupeObserver();
  unbindBviPanelCloseFix();
}

export function isBviPanelActive(): boolean {
  if (typeof document === 'undefined') return false;
  return (
    document.body.classList.contains('bvi-active') &&
    document.querySelectorAll('.bvi-panel').length > 0
  );
}

export function isBviEnabledInCookies(): boolean {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(/(?:^|;\s*)bvi_panelActive=([^;]*)/);
  const value = match?.[1]?.trim();
  return value === 'true' || value === '1';
}

/** Плагин в _init() сбрасывает panelActive, если нет cookie хотя бы для одного ключа _config (включая target). */
function writeBviCookiesForActivation(): void {
  const values: Record<string, string | number | boolean> = {
    ...BVI_DEFAULT_COOKIES,
    target: `#${BVI_TRIGGER_ID}`,
  };

  for (const [key, value] of Object.entries(values)) {
    setBviCookie(key, getBviCookie(key) ?? value);
  }
  setBviCookie('panelActive', 'true');
}

function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${href}`));
    document.head.appendChild(link);
  });
}

function waitForIsvek(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.isvek?.Bvi) {
      resolve();
      return;
    }
    const started = Date.now();
    const tick = () => {
      if (window.isvek?.Bvi) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('BVI script loaded but isvek.Bvi is missing'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function unloadLegacyBviScript() {
  document.querySelectorAll('script[src*="bvi.min.js"]').forEach((node) => {
    if (!node.getAttribute('src')?.includes(BVI_ASSET_VERSION)) {
      node.remove();
    }
  });
  if (!document.querySelector(`script[src="${BVI_JS}"]`)) {
    delete window.isvek;
    delete window.__bviInstance;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    unloadLegacyBviScript();

    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (window.isvek?.Bvi) {
        installBviSpeechFix();
        primeSpeechVoices();
        resolve();
        return;
      }
      existing.addEventListener(
        'load',
        () =>
          waitForIsvek()
            .then(() => {
              installBviSpeechFix();
              primeSpeechVoices();
            })
            .then(resolve, reject),
        { once: true }
      );
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      void waitForIsvek().then(resolve, reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () =>
      waitForIsvek()
        .then(() => {
          installBviSpeechFix();
          primeSpeechVoices();
        })
        .then(resolve, reject);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function createBviInstance(): NonNullable<typeof window.__bviInstance> {
  if (!window.isvek?.Bvi) {
    throw new Error('BVI is not available');
  }
  if (!document.getElementById(BVI_TRIGGER_ID)) {
    throw new Error(`BVI trigger #${BVI_TRIGGER_ID} is missing from the layout`);
  }
  return new window.isvek.Bvi({
    target: `#${BVI_TRIGGER_ID}`,
    lang: 'ru-RU',
    speech: true,
    panelFixed: true,
    panelHide: false,
    reload: false,
  });
}

/**
 * Включает панель. Конструктор Bvi уже вызывает _init() — повторно не вызываем.
 */
function activateBviPanel(): void {
  if (bviActivateInFlight) return;
  bviActivateInFlight = true;
  try {
    teardownBviDom();
    resetBviTriggerElement();
    writeBviCookiesForActivation();
    installBviSpeechFix();
    bindBviPanelCloseFix();
    window.__bviInstance = createBviInstance();
    applySpeechFixToInstance(window.__bviInstance);
    primeSpeechVoices();
    dedupeBviPanels();
    observeBviPanelDedupe();
    document.documentElement.classList.add('bvi-active');

    if (document.querySelectorAll('.bvi-panel').length === 0) {
      throw new Error('BVI panel was not created');
    }

    // Safari: приветствие после открытия. Chrome теряет user-gesture после await — не озвучиваем.
    applyBviLayoutFixes();

    if (!isChromiumBrowser()) {
      window.setTimeout(() => bviSpeak('Версия для слабовидящих включена'), 150);
    }
  } finally {
    bviActivateInFlight = false;
  }
}

/** Включает BVI только по действию пользователя. */
export async function openBviPanel(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isBviPanelActive()) return;

  await loadStylesheet(BVI_CSS);
  await loadStylesheet(BVI_KRIMVK_CSS);
  await loadScript(BVI_JS);
  activateBviPanel();
}

/** После клиентского перехода Next.js. */
export async function reapplyBviAfterNavigation(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!isBviEnabledInCookies()) return;
  if (isBviPanelActive()) return;
  if (bviActivateInFlight) return;

  try {
    await loadStylesheet(BVI_CSS);
    await loadStylesheet(BVI_KRIMVK_CSS);
    await loadScript(BVI_JS);
    activateBviPanel();
  } catch (err) {
    console.error('[BVI] reapply after navigation failed', err);
  }
}

/** Перед переходом по внутренней ссылке. */
export function teardownBviBeforeNavigation(): void {
  if (!isBviPanelActive() && !document.querySelector('.bvi-body')) return;
  teardownBviDom();
}

export function isInternalNavigationLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  if (anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export { clearBviCookies };
