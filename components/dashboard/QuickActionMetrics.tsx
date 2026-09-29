"use client";

import { useEffect, useState } from 'react';
import { consumptionHistory, meterReadings, type ConsumptionPoint, type QuickMetrics } from '@/lib/quick-action-metrics';
import { halfYearMonths, monthlyConsumption, type MonthPoint } from '@/lib/half-year-metrics';
import { MetricStepChart } from './MetricStepChart';

const number = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

export function PaymentMetric({ data, loading, accountId }: { data?: QuickMetrics; loading: boolean; accountId?: string | null }) {
  const [history, setHistory] = useState<{ id: string; points: MonthPoint[] } | null>(null);
  useEffect(() => {
    setHistory(null);
    if (!accountId || loading) return;
    const controller = new AbortController();
    fetch(`/api/accounts/${encodeURIComponent(accountId)}/balance-history`, { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); })
      .then(result => { if (!controller.signal.aborted) setHistory({ id: accountId, points: result.points }); })
      .catch(() => { if (!controller.signal.aborted) setHistory({ id: accountId, points: halfYearMonths().map(month => ({ month, value: null })) }); });
    return () => controller.abort();
  }, [accountId, loading]);
  const balance = data?.balance;
  if (loading) return <p className="text-sm text-slate-400">Обновляем сумму…</p>;
  if (balance == null) return <p className="text-sm text-slate-500">Сумма пока недоступна</p>;
  const change = data?.openingBalance == null ? null : balance - data.openingBalance;
  return <div className="metric-details mt-2 border-t border-slate-100 pt-4">
    <p className="text-xs text-slate-500">{balance < 0 ? 'Переплата по выбранному счёту' : balance > 0 ? 'К оплате по данным 1С' : 'Задолженности нет'}</p>
    <p className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{number(Math.abs(balance))} <span className="text-lg">₽</span></p>
    {history && history.id === accountId ? <MetricStepChart points={history.points} label="Баланс на конец месяца" unit="₽" color="text-emerald-500" /> : <p className="metric-history-loading mt-2 text-xs text-slate-400">Загружаем историю за 6 месяцев…</p>}
    <p className="metric-note mt-2 text-xs leading-5 text-slate-500">{change === null ? 'Нет данных для сравнения' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${number(Math.abs(change))} ₽ · с начала периода`}</p>
  </div>;
}

export function ReadingMetric({ data, accountId, loading }: { data?: QuickMetrics; accountId: string | null; loading: boolean }) {
  const meter = data?.meters[0];
  const [history, setHistory] = useState<{ accountId: string; points: ConsumptionPoint[]; months: MonthPoint[]; latest?: [number, number] } | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setHistory(null);
    if (!accountId || !meter?.number || loading) return;
    const controller = new AbortController();
    setPending(true);
    const today = new Date();
    const firstMonth = halfYearMonths()[0].split('-').map(Number);
    const from = new Date(firstMonth[0], firstMonth[1] - 2, 1);
    const date = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const params = new URLSearchParams({ accountId, dateFrom: date(from), dateTo: date(today) });
    fetch(`/api/1c/meter-history?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('History unavailable'); return response.json(); })
      .then(result => { if (!controller.signal.aborted) setHistory({ accountId, points: consumptionHistory(result.history, meter.number), months: monthlyConsumption(result.history, meter.number), latest: meterReadings(result.history, meter.number).at(-1) }); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setPending(false); });
    return () => controller.abort();
  }, [accountId, meter?.number, loading]);
  if (loading) return <p className="text-sm text-slate-400">Обновляем показания…</p>;
  const latest = history?.accountId === accountId ? history.latest : undefined;
  const reading = meter?.value ?? latest?.[1];
  if (!meter || reading == null) return <p className="text-sm text-slate-500">{pending ? 'Загружаем показания…' : 'Нет данных о последнем показании'}</p>;
  const points = history?.accountId === accountId ? history.points : [];
  const last = points.at(-1);
  return <div className="metric-details mt-2 border-t border-slate-100 pt-4">
    <p className="text-xs text-slate-500" title={`Счётчик ${meter.number}`}>Последняя передача</p>
    <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{number(reading)} <span className="text-sm font-normal text-slate-500">м³</span></p>
    {!meter.date && meter.value == null && latest && <p className="mt-1 text-xs text-slate-500">{new Date(latest[0]).toLocaleDateString('ru-RU')}</p>}
    {meter.date && <p className="mt-1 text-xs text-slate-500">{meter.date}</p>}
    {!pending && <MetricStepChart points={history?.accountId === accountId ? history.months : halfYearMonths().map(month => ({ month, value: null }))} label="Расход по последним показаниям каждого месяца" unit="м³" />}
    <p className="metric-note mt-2 text-xs leading-5 text-slate-500">{pending ? 'Загружаем расход…' : last ? `${number(last.value)} м³ за ${last.days} дн.` : 'Недостаточно истории'}</p>
    {(data?.meters.length ?? 0) > 1 && <p className="mt-1 text-xs text-slate-400">Показан один из {data?.meters.length} счётчиков · все — внутри</p>}
  </div>;
}
