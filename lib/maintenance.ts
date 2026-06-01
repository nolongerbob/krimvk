/** Включить через MAINTENANCE_MODE=1 в .env (pm2 restart --update-env) */
export function isMaintenanceMode(): boolean {
  const v = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Пути, доступные во время обслуживания */
export function isMaintenanceBypass(pathname: string): boolean {
  if (pathname === '/maintenance.html') return true;
  if (pathname.startsWith('/images/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/api/health') return true;
  return false;
}
