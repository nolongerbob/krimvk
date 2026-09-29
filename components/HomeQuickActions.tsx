"use client";

import Link from 'next/link';
import { Droplet, CreditCard, FileText, ArrowRight } from 'lucide-react';
import { QuickActionCard } from './QuickActionCard';
import { PaymentMetric, ReadingMetric } from './dashboard/QuickActionMetrics';
import { useHomeAccount } from './HomeAccountProvider';

export function HomeQuickActions() {
  const { overview: data, accountData, selectedAccountId, loading, authenticated } = useHomeAccount();
  const metrics = accountData?.quickMetrics;
  const accountQuery = selectedAccountId ? `?${new URLSearchParams({ accountId: selectedAccountId })}` : '';
  return <div className="quick-actions-grid grid auto-rows-fr grid-cols-1 items-stretch gap-4 pb-0 md:grid-cols-3">
    {authenticated ? <>
      <div className="home-metric-card home-metric-card-with-action" data-tone="blue">
        <h3><Droplet className="text-blue-500" size={22} />Передать показания</h3>
        <ReadingMetric key={selectedAccountId} data={metrics} accountId={selectedAccountId} loading={loading} />
        <Link href={`/dashboard/meters${accountQuery}`} className="home-metric-button">Передать показания<ArrowRight className="home-action-arrow" size={16} aria-hidden="true" /></Link>
      </div>
      <div className="home-metric-card home-metric-card-with-action" data-tone="green">
        <h3><CreditCard className="text-green-500" size={22} />Оплатить счет</h3>
        <PaymentMetric key={selectedAccountId} data={metrics} loading={loading} accountId={selectedAccountId} />
        <Link href={`/dashboard/bills${accountQuery}`} className="home-metric-button">Оплатить счет<ArrowRight className="home-action-arrow" size={16} aria-hidden="true" /></Link>
      </div>
      <div className="home-metric-card" data-tone="purple">
        <h3><FileText className="text-purple-500" size={22} />Мои заявки</h3>
        <div className="metric-requests mt-2 border-t border-slate-100 pt-4">
          <p className="requests-label text-xs text-slate-500">Активные заявки · по всем счетам</p>
          <p className="requests-value mt-1 text-3xl font-semibold tabular-nums text-slate-900">{data ? data.stats.activeApplications : loading ? '…' : '—'}</p>
          <p className="requests-note mt-2 text-xs text-slate-500">{data ? data.stats.activeApplications === 0 ? 'Сейчас нет заявок в работе' : 'Ожидают обработки или в работе' : 'Данные пока недоступны'}</p>
        </div>
        <div className="home-metric-actions">
          <Link href="/services" className="home-metric-button home-metric-new">Подать новую заявку</Link>
          <Link href="/dashboard/applications" className="home-metric-button">Мои заявки</Link>
        </div>
      </div>
    </> : <>
      <QuickActionCard iconName="Droplet" title="Передать показания" description="Передать показания счетчиков воды" href="/dashboard/meters" iconColor="text-blue-500" />
      <QuickActionCard iconName="CreditCard" title="Оплатить счет" description="Оплатить счета за водоснабжение" href="/dashboard/bills" iconColor="text-green-500" />
      <QuickActionCard iconName="FileText" title="Мои заявки" description="Просмотр статуса заявок" href="/dashboard/applications" iconColor="text-purple-500" />
    </>}
    <style jsx global>{`
      .home-metric-card { display: flex; flex-direction: column; padding: 14px; min-width: 0; background: white; border: 1px solid #e2e8f0; transition: border-color .2s; }
      .home-metric-card { --action-color: #2563eb; --action-border: #60a5fa; --action-tint: #eff6ff; }
      .home-metric-card[data-tone="green"] { --action-color: #15803d; --action-border: #4ade80; --action-tint: #f0fdf4; }
      .home-metric-card[data-tone="purple"] { --action-color: #9333ea; --action-border: #c084fc; --action-tint: #faf5ff; }
      .home-metric-card:hover { border-color: var(--action-border); }
      .home-metric-card:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
      .home-metric-card h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; line-height: 20px; }
      .home-metric-card h3 svg { flex-shrink: 0; }
      .home-metric-card > div { padding-top: 8px; margin-top: 8px; }
      .home-metric-card p { font-size: 11px; line-height: 15px; }
      .home-metric-card p.text-3xl { font-size: 24px; line-height: 28px; white-space: nowrap; overflow-wrap: normal; }
      .home-metric-card svg[role="img"] { display: block; height: 36px; width: 100%; margin-top: 6px; }
      .home-metric-card p.mt-2 { margin-top: 4px; }
      .home-metric-button { display: flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 34px; margin-top: auto; border: 1px solid var(--action-border); background: white; font-size: 12px; font-weight: 500; color: var(--action-color); transition: background-color .15s, border-color .15s; }
      .home-metric-button:hover { border-color: var(--action-color); background: var(--action-tint); }
      .home-action-arrow { display: none; }
      .home-metric-card > div { margin-bottom: 10px; }
      .home-metric-card > .home-metric-actions { margin-top: auto; margin-bottom: 0; padding-top: 0; display: flex; flex-direction: column; gap: 6px; }
      .home-metric-actions .home-metric-button { margin-top: 0; }
      .home-metric-button:focus-visible { outline: 2px solid var(--action-color); outline-offset: 2px; }
      .home-metric-new { color: #0f172a; border-color: #0f172a; background: transparent; }
      .home-metric-new:hover { color: #020617; border-color: #020617; background: transparent; }
      .home-metric-new:focus-visible { outline-color: #0f172a; }
      [data-home-composition] .quick-actions-grid:has(.home-metric-card) { grid-auto-rows: minmax(250px, auto); }
      [data-home-composition] .quick-actions-grid > .home-metric-card { height: auto; min-height: 250px; }
      @container home-actions (max-width: 900px) {
        [data-home-composition] .quick-actions-grid > .home-metric-card { min-height: 250px; }
      }
      @media (max-width: 639px) {
        [data-home-composition] .quick-actions-grid:has(.home-metric-card) { flex: 0 0 auto; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: auto; align-content: start; gap: 8px; padding: 0 12px 12px; }
        [data-home-composition] .quick-actions-grid > .home-metric-card { min-height: 0; height: auto; padding: 10px; border-radius: 0; border-color: #e2e8f0; box-shadow: none; }
        [data-home-composition] .home-metric-card[data-tone="purple"] { grid-column: 1 / -1; }
        [data-home-composition] .home-metric-card-with-action { display: flex; flex-direction: column; gap: 8px; }
        [data-home-composition] .home-metric-card-with-action > :is(div, p) { min-width: 0; margin: 0; }
        [data-home-composition] .home-metric-card h3 { gap: 8px; font-size: 14px; line-height: 24px; }
        [data-home-composition] .home-metric-card-with-action > h3 { min-height: 36px; gap: 6px; font-size: 13px; line-height: 18px; }
        [data-home-composition] .home-metric-card h3 svg { width: 24px; height: 24px; padding: 3px; border-radius: 0; background: var(--action-tint); }
        [data-home-composition] .home-metric-card > div { border-top: 0; padding-top: 0; margin-top: 6px; margin-bottom: 8px; }
        [data-home-composition] .home-metric-card p { font-size: 11px; line-height: 14px; }
        [data-home-composition] .home-metric-card p.text-3xl { font-size: clamp(20px, 6vw, 28px); line-height: 28px; margin-top: 0; letter-spacing: -.025em; }
        [data-home-composition] .home-metric-card .metric-details { display: block; margin: 0; }
        [data-home-composition] .home-metric-card-with-action .metric-details > p:first-child { min-height: 28px; }
        [data-home-composition] .home-metric-card .metric-details > p { overflow-wrap: break-word; }
        [data-home-composition] .home-metric-card :is(.metric-bar-chart, .metric-history-loading) { display: none; }
        [data-home-composition] .home-metric-card .metric-details > .metric-note { margin-top: 2px; }
        [data-home-composition] .home-metric-card .metric-requests { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "value label" "value note"; align-items: center; column-gap: 12px; }
        [data-home-composition] .home-metric-card .requests-label { grid-area: label; }
        [data-home-composition] .home-metric-card .requests-value { grid-area: value; margin: 0; }
        [data-home-composition] .home-metric-card .requests-note { grid-area: note; margin: 0; }
        [data-home-composition] .home-metric-card > .home-metric-actions { display: grid; grid-template-columns: 1.15fr 1fr; margin: 0; padding: 0; gap: 8px; }
        [data-home-composition] .home-metric-card .home-metric-button { min-height: 44px; border-radius: 0; border-color: transparent; background: var(--action-tint); font-size: 12px; line-height: 16px; font-weight: 600; padding: 8px 12px; text-align: center; }
        [data-home-composition] .home-metric-card-with-action > .home-metric-button { min-width: 0; min-height: 50px; justify-content: center; margin-top: auto; padding-inline: 6px; text-align: center; }
        [data-home-composition] .home-metric-card .home-metric-button:active { background: #e2e8f0; }
        [data-home-composition] .home-metric-card .home-metric-new { color: #334155; border-color: #cbd5e1; background: transparent; }
      }
    `}</style>
  </div>;
}
