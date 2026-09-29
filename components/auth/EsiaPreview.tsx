'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ESIA_PREVIEW_COPY, nextEsiaPreviewStep, type EsiaPreviewStep } from '@/lib/esia-preparation';

export function EsiaPreview() {
  const [step, setStep] = useState<EsiaPreviewStep>('start');
  const copy = ESIA_PREVIEW_COPY[step];
  return <section className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
    <p className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Только dev-макет. ЕСИА не подключена. Настоящий вход и создание аккаунтов не выполняются.</p>
    <ShieldCheck aria-hidden="true" className="mb-4 h-9 w-9 text-blue-600" />
    <div aria-live="polite" aria-atomic="true">
      <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{copy.description}</p>
    </div>
    {copy.button && <button type="button" className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" onClick={() => setStep(s => nextEsiaPreviewStep(s, 'continue'))}>{copy.button}</button>}
    <div className="mt-5 flex flex-wrap gap-4 text-sm">
      {step !== 'start' && <button type="button" className="text-blue-700 underline" onClick={() => setStep(s => nextEsiaPreviewStep(s, 'restart'))}>Начать заново</button>}
      {(step === 'consent' || step === 'link') && <button type="button" className="text-slate-600 underline" onClick={() => setStep(s => nextEsiaPreviewStep(s, 'cancel'))}>Отменить</button>}
      <Link href="/login" className="text-blue-700 underline">Обычный вход</Link>
    </div>
  </section>;
}
