// NEXT_PUBLIC flags are fixed at build time and must match the server environment.
// The reviewed account layout is the default in every environment. This flag
// is an explicit build-time rollback, not a reason to run production in dev mode.
export function accountHomeEnabled() {
  return process.env.NEXT_PUBLIC_ACCOUNT_HOME_ENABLED !== 'false';
}
export function assistantEnabled() {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === 'true';
}
export function seasonalEnabled() {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SEASONAL_ENABLED === 'true';
}
export function noticesEnabled() {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SITE_NOTICES_ENABLED === 'true';
}
