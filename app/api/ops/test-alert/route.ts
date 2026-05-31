import { NextRequest, NextResponse } from 'next/server';
import { reportServerError } from '@/lib/report-server-error';

export { dynamic } from '@/lib/force-dynamic-route';

/**
 * Проверка полного формата алерта (только с секретом).
 * curl -X POST -H "X-Ops-Secret: $OPS_TEST_SECRET" https://krimvk.ru/api/ops/test-alert
 */
export async function POST(req: NextRequest) {
  const expected = process.env.OPS_TEST_SECRET;
  const got = req.headers.get('x-ops-secret');

  if (!expected || got !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const err = new Error('KrimVK ops test alert (safe to ignore)');
  err.stack = [
    'Error: KrimVK ops test alert (safe to ignore)',
    '    at POST (/var/www/krimvk/app/api/ops/test-alert/route.ts:1:1)',
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
  ].join('\n');

  await reportServerError(
    {
      label: 'ops/test-alert',
      method: 'POST',
      path: '/api/ops/test-alert',
      hint: 'manual test',
    },
    err
  );

  return NextResponse.json({ ok: true, sent: true });
}
