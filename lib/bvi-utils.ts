// Утилиты для работы с cookies
export const setCookie = (name: string, value: string) => {
  const now = new Date();
  let time = now.getTime();
  time += 24 * 60 * 60 * 1000; // 24 часа
  now.setTime(time);
  document.cookie = `bvi_${name}=${value};path=/;expires=${now.toUTCString()};domain=${location.hostname}`;
};

export const getCookie = (name: string): string | undefined => {
  const nameEQ = `bvi_${name}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return undefined;
};

export const removeCookie = (name: string) => {
  document.cookie = `bvi_${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=${location.hostname}`;
};

export const stringToBoolean = (str: string | undefined): boolean => {
  if (!str) return false;
  switch (str) {
    case 'on':
    case 'true':
    case '1':
      return true;
    default:
      return false;
  }
};

// Синтез речи
export const synth = () => window.speechSynthesis;

export const speak = (text: string, lang: string = 'ru-RU') => {
  if (!('speechSynthesis' in window)) return;

  synth().cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.volume = 1;
  utter.rate = 1;
  utter.pitch = 1;
  utter.lang = lang;

  const voices = synth().getVoices();
  for (let i = 0; i < voices.length; i++) {
    if (lang === 'ru-RU' && voices[i].name.includes('Russian')) {
      utter.voice = voices[i];
      break;
    }
    if (lang === 'en-US' && voices[i].name.includes('English')) {
      utter.voice = voices[i];
      break;
    }
  }

  synth().speak(utter);
};

