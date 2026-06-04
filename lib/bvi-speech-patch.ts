'use client';

type BviInstance = {
  _config?: { lang?: string };
  _speech?: (text: string, element?: Element, echo?: boolean) => void;
};

type BviProto = {
  _speech?: (text: string, element?: Element, echo?: boolean) => void;
  __krimvkSpeechPatched?: boolean;
};

const CHROME_KEEPALIVE_MS = 12_000;

let chromeKeepAliveTimer: ReturnType<typeof setInterval> | null = null;
let chromeKeepAliveUtterances = 0;

function getSynth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

/** Safari на Mac работает; Chrome/Edge — нужны локальные голоса и keep-alive. */
export function isChromiumBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|CriOS|FxiOS/i.test(ua);
  return !isSafari && /Chrome|Chromium|Edg|OPR|CriOS/i.test(ua);
}

function isSpeechEnabled(): boolean {
  const attr = document.querySelector('.bvi-body')?.getAttribute('data-bvi-speech');
  if (attr === 'false') return false;
  if (attr === 'true') return true;

  const value = document.cookie.match(/(?:^|;\s*)bvi_speech=([^;]*)/)?.[1]?.trim();
  return value === 'true' || value === '1' || value === 'on';
}

function langPrefix(lang: string): string {
  return lang.replace('_', '-').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

/**
 * Chrome: только localService (системные голоса macOS). Удалённые Google-голоса часто не дают звука.
 * Safari: логика старой панели — Russian в имени или ru по lang.
 */
function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const prefix = langPrefix(lang);

  if (isChromiumBrowser()) {
    const localByLang = voices.filter(
      (v) =>
        v.localService &&
        v.lang.replace('_', '-').toLowerCase().startsWith(prefix)
    );
    if (localByLang.length > 0) {
      if (lang === 'ru-RU') {
        return (
          localByLang.find((v) => /milena|yuri|anna|alena|katya|dmitri|russian/i.test(v.name)) ??
          localByLang[0]
        );
      }
      return localByLang[0];
    }

    const anyLocal = voices.find((v) => v.localService);
    if (anyLocal) return anyLocal;

    return null;
  }

  for (let i = 0; i < voices.length; i++) {
    if (lang === 'ru-RU' && voices[i].name.includes('Russian')) return voices[i];
    if (lang === 'en-US' && voices[i].name.includes('English')) return voices[i];
  }

  if (lang === 'ru-RU') {
    return (
      voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ru')) ?? null
    );
  }

  return null;
}

function stopChromeKeepAliveIfIdle(): void {
  if (chromeKeepAliveUtterances > 0) return;
  if (chromeKeepAliveTimer) {
    clearInterval(chromeKeepAliveTimer);
    chromeKeepAliveTimer = null;
  }
}

function startChromeKeepAlive(): void {
  if (!isChromiumBrowser() || chromeKeepAliveTimer) return;

  chromeKeepAliveTimer = setInterval(() => {
    const synth = getSynth();
    if (!synth || (!synth.speaking && !synth.pending)) {
      stopChromeKeepAliveIfIdle();
      return;
    }
    try {
      synth.pause();
      synth.resume();
    } catch {
      /* ignore */
    }
  }, CHROME_KEEPALIVE_MS);
}

function trackUtteranceForChrome(utter: SpeechSynthesisUtterance): void {
  if (!isChromiumBrowser()) return;

  chromeKeepAliveUtterances += 1;
  startChromeKeepAlive();

  const done = () => {
    chromeKeepAliveUtterances = Math.max(0, chromeKeepAliveUtterances - 1);
    if (chromeKeepAliveUtterances === 0) {
      stopChromeKeepAliveIfIdle();
    }
  };

  const prevEnd = utter.onend;
  const prevError = utter.onerror;

  utter.onend = (ev) => {
    done();
    prevEnd?.call(utter, ev);
  };
  utter.onerror = (ev) => {
    done();
    prevError?.call(utter, ev);
  };
}

function buildUtterance(text: string, lang: string): SpeechSynthesisUtterance {
  const utter = new SpeechSynthesisUtterance(text.trim());
  utter.volume = 1;
  utter.rate = 1;
  utter.pitch = 1;
  utter.lang = lang;

  const synth = getSynth();
  const voice = pickVoice(synth?.getVoices() ?? [], lang);
  if (voice) utter.voice = voice;

  trackUtteranceForChrome(utter);
  return utter;
}

/**
 * Как в старой BVIPanel (bvi-utils.speak): один utterance, синхронно из click.
 * Дополнительно: Chrome → локальный голос, без «пустого» prime speak+cancel.
 */
export function bviSpeak(text: string, lang = 'ru-RU'): void {
  const synth = getSynth();
  if (!synth || !text.trim()) return;

  try {
    synth.resume();
  } catch {
    /* ignore */
  }

  if (isChromiumBrowser()) {
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
  } else {
    synth.cancel();
  }

  const utter = buildUtterance(text, lang);
  synth.speak(utter);
}

/** Разблокировка TTS в цепочке жеста (pointerdown/click). */
export function prepareSpeechForUserGesture(): void {
  const synth = getSynth();
  if (!synth) return;

  try {
    synth.resume();
  } catch {
    /* ignore */
  }

  synth.getVoices();
}

export function stopBviSpeech(): void {
  const synth = getSynth();
  synth?.cancel();
  chromeKeepAliveUtterances = 0;
  stopChromeKeepAliveIfIdle();
}

function speakEchoChunks(
  text: string,
  lang: string,
  element: Element,
  voices: SpeechSynthesisVoice[]
): void {
  const synth = getSynth();
  if (!synth) return;

  const chunkLength = 120;
  const patternRegex = new RegExp(
    `^[\\s\\S]{${Math.floor(chunkLength / 2)},${chunkLength}}[.!?,]{1}|^[\\s\\S]{1,${chunkLength}}$|^[\\s\\S]{1,${chunkLength}} `
  );

  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > 0) {
    const match = rest.match(patternRegex);
    if (!match?.[0]) break;
    chunks.push(match[0].trim());
    rest = rest.substring(match[0].length).trim();
  }
  if (chunks.length === 0) chunks.push(text.trim());

  const voice = pickVoice(voices, lang);
  if (isChromiumBrowser()) {
    if (synth.speaking || synth.pending) synth.cancel();
  } else {
    synth.cancel();
  }

  let index = 0;

  const speakNext = () => {
    if (index >= chunks.length) {
      element.classList.remove('bvi-highlighting');
      return;
    }

    const chunk = chunks[index++];
    const utter = new SpeechSynthesisUtterance(chunk);
    utter.volume = 1;
    utter.rate = 1;
    utter.pitch = 1;
    utter.lang = lang;
    if (voice) utter.voice = voice;

    const prevStart = utter.onstart;
    utter.onstart = (ev) => {
      element.classList.add('bvi-highlighting');
      prevStart?.call(utter, ev);
    };

    utter.onend = speakNext;
    utter.onerror = speakNext;
    trackUtteranceForChrome(utter);

    try {
      synth.resume();
    } catch {
      /* ignore */
    }
    synth.speak(utter);
  };

  speakNext();
}

function patchedSpeech(this: BviInstance, text: string, element?: Element, echo = false): void {
  if (!getSynth() || !isSpeechEnabled()) return;

  const lang = this._config?.lang ?? 'ru-RU';

  if (echo && element) {
    prepareSpeechForUserGesture();
    speakEchoChunks(text, lang, element, getSynth()!.getVoices());
    return;
  }

  bviSpeak(text, lang);
}

export function installBviSpeechFix(): void {
  if (typeof window === 'undefined' || !window.isvek?.Bvi) return;

  const proto = window.isvek.Bvi.prototype as BviProto;
  if (proto.__krimvkSpeechPatched) return;
  if (typeof proto._speech !== 'function') return;

  proto.__krimvkSpeechPatched = true;
  proto._speech = patchedSpeech;
}

export function applySpeechFixToInstance(instance: BviInstance | undefined): void {
  if (!instance) return;
  instance._speech = patchedSpeech.bind(instance);
}

export function primeSpeechVoices(): void {
  if (typeof window === 'undefined') return;
  prepareSpeechForUserGesture();
  const synth = getSynth();
  if (!synth) return;
  const load = () => synth.getVoices();
  synth.addEventListener('voiceschanged', load);
  load();
}

export function bindBviPanelSpeechPriming(): () => void {
  if (typeof document === 'undefined') return () => {};

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.bvi-panel, .bvi-link-fixed-top, .bvi-modal, [aria-label="Версия для слабовидящих"]')) {
      prepareSpeechForUserGesture();
    }
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  return () => document.removeEventListener('pointerdown', onPointerDown, true);
}

if (typeof window !== 'undefined') {
  const synth = getSynth();
  if (synth) {
    synth.addEventListener('voiceschanged', () => synth.getVoices());
  }
}
