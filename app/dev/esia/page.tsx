import { notFound } from 'next/navigation';
import { EsiaPreview } from '@/components/auth/EsiaPreview';
import { isEsiaPreviewEnabled } from '@/lib/esia-preparation';
import { getEsiaPreparation } from '@/lib/esia-config';
import { requireAdminPage } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';
export default async function EsiaPreviewPage() {
  if (!isEsiaPreviewEnabled()) notFound();
  await requireAdminPage('/dev/esia');
  const preparation = getEsiaPreparation();
  return <main className="px-6 py-12">
    <section className="mx-auto mb-8 max-w-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold">Подготовка Госуслуг</h1>
      <p className="mt-2 text-sm text-slate-600">Настоящий вход выключен. Ни этот экран, ни макет ниже не создают сессию и не привязывают аккаунт.</p>
      <ul className="mt-5 space-y-3">{preparation.checks.map(check => <li key={check.id} className="flex items-start justify-between gap-4 text-sm">
        <span>{check.label}</span><span className={check.ready ? 'shrink-0 text-green-700' : 'shrink-0 text-slate-500'}>{check.ready ? 'Задано' : 'Ожидается'}</span>
      </li>)}</ul>
      <p className="mt-5 text-xs text-slate-500">«Задано» означает наличие настройки, а не подтверждение её регистрации в ЕСИА. Ключи и сертификаты здесь не показываются.</p>
      <p className="mt-3 break-all text-sm">Путь возврата: <code>/api/auth/callback/esia</code></p>
    </section>
    <EsiaPreview />
  </main>;
}
