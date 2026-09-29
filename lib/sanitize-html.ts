import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

let serverPurify: ReturnType<typeof DOMPurify> | null = null;
const sanitizeCache = new Map<string, string>();
const SANITIZE_CACHE_MAX = 500;

function getServerPurify() {
  if (!serverPurify) {
    const dom = new JSDOM('');
    serverPurify = DOMPurify(dom.window);
  }
  return serverPurify;
}

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
  const cached = sanitizeCache.get(html);
  if (cached !== undefined) return cached;

  const sanitized =
    typeof window === 'undefined'
      ? getServerPurify().sanitize(html, sanitizeConfig)
      : DOMPurify.sanitize(html, sanitizeConfig);

  if (sanitizeCache.size >= SANITIZE_CACHE_MAX) {
    const oldest = sanitizeCache.keys().next().value;
    if (oldest !== undefined) sanitizeCache.delete(oldest);
  }
  sanitizeCache.set(html, sanitized);

  return sanitized;
}
