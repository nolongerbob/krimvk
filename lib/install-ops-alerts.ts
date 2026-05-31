/**
 * Подключает глобальные обработчики и перехват console.error (Node runtime).
 * Вызывается один раз из instrumentation.ts.
 */

import { reportFromConsoleErrorArgs, reportServerError } from './report-server-error';

let installed = false;

export function installOpsAlerts(): void {
  if (installed) {
    return;
  }
  installed = true;

  const originalError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    originalError(...args);
    try {
      reportFromConsoleErrorArgs(args);
    } catch {
      /* не ломаем логирование */
    }
  };

  const notify = (label: string, err: unknown) => {
    void reportServerError({ label }, err);
  };

  process.on('uncaughtException', (err) => {
    notify('uncaughtException', err);
  });

  process.on('unhandledRejection', (reason) => {
    notify('unhandledRejection', reason);
  });
}
