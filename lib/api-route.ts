/**
 * Обёртка для route handlers: алерт при throw и при ответе 5xx.
 */
import type { NextRequest } from 'next/server';
import { reportServerError } from './report-server-error';

type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

type RouteHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<Response> | Response;

export function withApiRoute(
  handler: (req: NextRequest) => Promise<Response> | Response,
  routeLabel?: string
): RouteHandler {
  return async (req, context) => {
    const path = req.nextUrl.pathname;
    const label = routeLabel ?? `${req.method} ${path}`;

    try {
      const res = await handler(req);
      if (res.status >= 500) {
        let hint: string | undefined;
        try {
          const preview = (await res.clone().text()).slice(0, 300);
          if (preview) {
            hint = `body: ${preview}`;
          }
        } catch {
          /* ignore */
        }
        void reportServerError(
          {
            label,
            method: req.method,
            path,
            status: res.status,
            hint,
          },
          new Error(`API returned ${res.status}`)
        );
      }
      return res;
    } catch (error) {
      void reportServerError(
        { label, method: req.method, path },
        error
      );
      throw error;
    }
  };
}
