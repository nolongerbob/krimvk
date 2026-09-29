// The visual preview may send messages only to its dedicated local test DB.
export function isAssistantTestSupportEnabled() {
  if (process.env.NODE_ENV === 'production') return process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === 'true' && process.env.ASSISTANT_OPERATOR_ENABLED === 'true';
  if (process.env.NODE_ENV !== 'development' || process.env.ASSISTANT_TEST_SUPPORT_ENABLED !== 'true') return false;
  if (process.env.SEASONAL_DEV_DIST !== '1') return true;
  try {
    const url = new URL(process.env.DATABASE_URL || '');
    return url.protocol === 'postgresql:' && url.hostname === '127.0.0.1' &&
      url.port === '55435' && url.pathname === '/krimvk_dev' && url.username === 'krimvk_dev';
  } catch { return false; }
}
