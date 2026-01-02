import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'div', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Санитизация HTML контента для безопасного отображения
 * Используется для контента, который рендерится через dangerouslySetInnerHTML
 */
export function sanitizeHTML(html: string): string {
  // Для серверного рендеринга используем JSDOM
  if (typeof window === 'undefined') {
    const dom = new JSDOM('');
    const purify = DOMPurify(dom.window as unknown as Window & typeof globalThis);
    return purify.sanitize(html, sanitizeConfig);
  }

  // Для клиентского рендеринга
  return DOMPurify.sanitize(html, sanitizeConfig);
}

