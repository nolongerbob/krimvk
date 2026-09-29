import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SeasonalPreviewSettings } from '@/components/seasonal/SeasonalPreviewSettings';

export default function AutumnPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <div className="mx-auto w-full max-w-5xl space-y-10 px-6 py-12">
    <SeasonalPreviewSettings />
    <div className="grid gap-10 md:grid-cols-2">
      <section data-seasonal-surface className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Тестовая карточка счёта</h2><p className="my-4">Всё оплачено · демонстрационные данные</p><button type="button" className="rounded-lg border px-4 py-3" onClick={undefined}>Проверка доступности кнопки</button></section>
      <section data-seasonal-surface className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Тестовая карточка показаний</h2><p className="my-4">1 284 м³ · демонстрационные данные</p><Link href="/" className="inline-block rounded-lg border px-4 py-3">Посмотреть на главной</Link></section>
    </div>
    <p className="pb-40 text-slate-600">Это страница внутри настоящей локальной оболочки сайта, без подключения тестовых данных к лицевым счетам.</p>
  </div>;
}
