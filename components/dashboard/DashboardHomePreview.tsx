"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowRight, CreditCard, Droplet, FileText, MapPin, MessageCircle, Plus, Settings2, ShieldCheck, Wallet } from 'lucide-react';
import type { DashboardAccount, DashboardAccountData } from '@/lib/dashboard-types';
import { ReadingMetric } from './QuickActionMetrics';

type Props = {
  name: string;
  accounts: DashboardAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  accountData: DashboardAccountData | null;
  loadingData: boolean;
  error: string | null;
  activeApplications: number;
  children?: ReactNode;
};
const money = (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const action = 'inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

/** Dev-only presentation layer. Existing routes and account services stay unchanged. */
export function DashboardHomePreview({ name, accounts, selectedAccountId, onSelectAccount, accountData, loadingData, error, activeApplications, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = document.getElementById('site-header');
    const notice = document.querySelector('[aria-label="Важное уведомление"]');
    const measure = () => {
      const available = (window.visualViewport?.height ?? window.innerHeight)
        - (header?.getBoundingClientRect().height ?? 0)
        - (notice?.getBoundingClientRect().height ?? 0);
      root.current?.style.setProperty('--dashboard-available-height', `${Math.max(0, available)}px`);
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (header) observer?.observe(header);
    if (notice) observer?.observe(notice);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    measure();
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('resize', measure); };
  }, []);
  const account = accounts.find(item => item.id === selectedAccountId);
  const data = loadingData ? null : accountData;
  const balance = data?.balance;
  const hasAccount = accounts.length > 0;
  const meters = data?.quickMetrics?.meters ?? [];
  return <div ref={root} className="dashboard-preview bg-[#f3f6fa] text-slate-900">
    <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 lg:py-10">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4" data-tour-id="tour-welcome">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-blue-600">Мой КрымВК</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Всё о вашем счёте</h1><p className="mt-2 text-sm text-slate-500">{name ? `${name}, ` : ''}платежи, показания и обращения — в одном месте.</p></div>
        <Link href="/dashboard/settings" className={`${action} border border-slate-300 bg-white hover:bg-slate-50`}><Settings2 size={16} />Настройки</Link>
      </header>
      {children}
      <section aria-label="Выбранный лицевой счёт" className="mb-6 flex flex-wrap items-center gap-4 border border-slate-200 bg-white p-4 sm:p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-blue-50 text-blue-600"><MapPin size={22} /></span>
        <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">{hasAccount ? 'Ваш адрес' : 'Начнём с лицевого счёта'}</p><p className="mt-1 break-words font-medium">{account?.address || (hasAccount ? 'Адрес не указан' : 'Подключите счёт, чтобы видеть расчёты и показания')}</p></div>
        {hasAccount && <div className="w-full sm:w-auto sm:max-w-sm"><label htmlFor="preview-account" className="mb-1 block text-xs text-slate-500">Лицевой счёт</label><select id="preview-account" value={selectedAccountId ?? ''} onChange={e => onSelectAccount(e.target.value)} className="min-h-11 w-full border border-slate-300 bg-white px-3 text-sm focus:outline-blue-600">{accounts.map(item => <option key={item.id} value={item.id}>№ {item.accountNumber}{accounts.length > 1 ? ` · ${item.address}` : ''}</option>)}</select></div>}
        <Link href="/dashboard/meters" className={`${action} text-blue-700 hover:bg-blue-50`}><Plus size={16} />Добавить счёт</Link>
      </section>
      {error && <p role="alert" className="mb-5 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error} Действия и история остаются доступны в соответствующих разделах.</p>}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr_.85fr]" aria-busy={loadingData}>
        <section className="flex min-w-0 flex-col border border-slate-200 bg-white" data-tour-id="tour-balance">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><h2 className="flex items-center gap-2 font-semibold"><Wallet size={19} className="text-blue-600" />Расчёты</h2><span className="text-xs text-slate-500">По выбранному счёту</span></div>
          <div className="preview-balance-body flex flex-1 flex-col p-6">
            <div className="preview-balance-summary">
            <p className="text-sm text-slate-500">{balance === undefined ? 'Баланс' : balance < 0 ? 'На счёте переплата' : balance === 0 ? 'Задолженности нет' : 'К оплате по данным 1С'}</p>
            <p className={`my-3 break-words text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${balance != null && balance > 0 ? 'text-red-600' : balance != null && balance < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{loadingData ? '…' : balance == null ? '—' : money(Math.abs(balance))}<span className="ml-2 text-2xl font-normal text-slate-400">₽</span></p>
            <p className="mb-6 text-xs leading-5 text-slate-500">{!hasAccount ? 'Сумма появится после подключения лицевого счёта.' : !data ? 'Данные расчётов пока недоступны.' : balance != null && balance < 0 ? 'Отрицательный баланс означает переплату, а не долг.' : 'Сумма из учётной системы. Историю поступлений можно проверить отдельно.'}</p>
            </div>
            <div className="preview-month-summary mb-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
              <div><p className="flex items-center gap-1 text-xs text-slate-500"><ArrowUpRight size={13} />Начислено за месяц</p><p className="mt-2 font-semibold tabular-nums">{data ? money(data.charged) : '—'} ₽</p></div>
              <div><p className="flex items-center gap-1 text-xs text-slate-500"><ArrowDownLeft size={13} />Оплачено за месяц</p><p className="mt-2 font-semibold tabular-nums text-emerald-700">{data ? money(data.paid) : '—'} ₽</p></div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2"><Link href={selectedAccountId && balance != null && balance > 0 ? `/dashboard/receipts/view?accountId=${encodeURIComponent(selectedAccountId)}` : '/dashboard/bills'} className={`${action} flex-1 bg-blue-600 text-white hover:bg-blue-700`}><CreditCard size={16} />{balance != null && balance > 0 ? 'Перейти к оплате' : 'Счета и оплата'}</Link><Link href="/dashboard/history" className={`${action} border border-slate-300 hover:bg-slate-50`}>История</Link></div>
          </div>
        </section>
        <section className="flex min-w-0 flex-col border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><h2 className="flex items-center gap-2 font-semibold"><Droplet size={19} className="text-blue-600" />Показания воды</h2><span className="text-xs text-slate-500">ХВС</span></div>
          <div className="flex flex-1 flex-col p-6"><p className="text-xs text-slate-500">{meters[0] ? `Счётчик № ${meters[0].number}` : 'Ваши приборы учёта'}</p>
            <div className="preview-readings mb-5 flex-1"><ReadingMetric data={data?.quickMetrics} accountId={selectedAccountId} loading={loadingData} /></div>
            <Link href="/dashboard/meters" className={`${action} border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100`}><Droplet size={16} />{hasAccount ? 'Передать показания' : 'Подключить лицевой счёт'}</Link>
          </div>
        </section>
        <section className="flex min-w-0 flex-col border border-slate-200 bg-[#f0f4ff]">
          <div className="flex items-center gap-2 border-b border-blue-100 px-6 py-5"><MessageCircle size={19} className="text-indigo-600" /><h2 className="font-semibold">На связи с вами</h2></div>
          <div className="flex flex-1 flex-col p-6"><p className="text-sm text-slate-500">Активные заявки</p><p className="my-3 text-5xl font-semibold tracking-tight">{activeApplications}</p><p className="mb-5 text-sm leading-6 text-slate-600">{activeApplications > 0 ? 'Посмотрите статус и подробности ваших обращений.' : 'Сейчас активных заявок нет. Если нужна помощь — мы рядом.'}</p><Link href="/dashboard/applications" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-700">Все мои заявки<ArrowRight size={15} /></Link><div className="mt-auto grid gap-2"><Link href="/services" className={`${action} border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50`}><Plus size={16} />Новая заявка</Link><Link href="/dashboard/questions" className={`${action} text-slate-700 hover:bg-white`}>Написать в поддержку<ArrowUpRight size={16} /></Link></div></div>
        </section>
      </div>
      <div className="preview-tools mt-4 grid gap-5 border border-slate-200 bg-white p-4 lg:grid-cols-[1.5fr_1fr]" data-tour-id="tour-quick">
        <div className="flex flex-col justify-center"><h2 className="mb-3 text-sm font-semibold text-slate-900">Документы и история</h2><nav aria-label="Документы и история" className="grid grid-cols-1 gap-2 sm:grid-cols-3">{[
          { href: '/dashboard/receipts', title: 'Квитанции', text: 'Посмотреть и скачать', icon: FileText },
          { href: '/dashboard/history', title: 'Платежи', text: 'Проверить поступления', icon: CreditCard },
          { href: '/dashboard/settings', title: 'Мои данные', text: 'Контакты и привязки', icon: Settings2 },
        ].map(({ href, title, text, icon: Icon }) => <Link key={href} href={href} className="flex min-h-16 items-center gap-3 border border-slate-200 px-3 py-3 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50"><Icon size={18} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><span className="block font-medium">{title}</span><span className="preview-tool-description mt-1 block text-xs text-slate-500">{text}</span></span><ArrowUpRight size={13} className="shrink-0" /></Link>)}</nav></div>
        <aside className="flex min-w-0 flex-col justify-center border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ShieldCheck size={18} className="shrink-0 text-blue-600" />Оплатили, а сумма не изменилась?</h2><p className="preview-payment-help mt-2 text-xs leading-5 text-slate-500">История платежей и баланс в 1С могут обновляться в разное время. Проверьте поступление в истории, прежде чем платить повторно.</p><Link href="/dashboard/questions" className="mt-2 inline-flex min-h-9 items-center gap-2 text-sm font-medium text-blue-700">Задать вопрос по оплате<ArrowRight size={14} /></Link></aside>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">Расчёты и показания — по выбранному счёту. Заявки — по всему аккаунту.</p>
    </div>
    <style jsx global>{`
      @media (min-width: 1024px) {
        .dashboard-preview { display: flex; min-height: var(--dashboard-available-height, calc(100dvh - 121px)); }
        .dashboard-preview > div { display: flex; flex-direction: column; flex: 1; min-width: 0; width: 100%; }
        .dashboard-preview [aria-busy] { flex: 1; }
      }
      .dashboard-preview > div { padding-top: 18px; padding-bottom: 14px; }
      .dashboard-preview header { margin-bottom: 16px; }
      .dashboard-preview header h1 { font-size: 30px; }
      .dashboard-preview header > div > p:first-child { margin-bottom: 4px; }
      .dashboard-preview [aria-label="Выбранный лицевой счёт"] { margin-bottom: 16px; padding: 12px 16px; }
      .dashboard-preview [aria-busy] > section > div:first-child { padding: 12px 18px; }
      .dashboard-preview [aria-busy] > section > div:last-child { padding: 16px 18px; }
      .dashboard-preview [aria-busy] .mb-6 { margin-bottom: 12px; }
      .dashboard-preview [aria-busy] .mb-5 { margin-bottom: 12px; }
      .dashboard-preview [aria-busy] .my-3 { margin-top: 8px; margin-bottom: 8px; }
      .dashboard-preview [aria-busy] .text-5xl { font-size: 38px; line-height: 1.15; }
      .dashboard-preview [aria-busy] .border-y { padding-top: 12px; padding-bottom: 12px; }
      .dashboard-preview .preview-readings .metric-details { border: 0; padding-top: 12px; }
      .dashboard-preview .preview-readings .text-3xl { font-size: 34px; line-height: 1.2; }
      .dashboard-preview .preview-readings .metric-bar-chart { margin-top: 12px; }
      .dashboard-preview .preview-readings .bar-track { height: 44px; }
      .dashboard-preview .preview-readings .metric-note { margin-top: 8px; }
      @media (min-width: 1024px) and (min-height: 801px) {
        .dashboard-preview .preview-tools { min-height: clamp(140px, 18vh, 210px); padding: 20px; }
      }
      @media (min-width: 1024px) and (max-height: 800px) {
        .dashboard-preview > div { padding-top: 12px; padding-bottom: 8px; }
        .dashboard-preview header > div > p { display: none; }
        .dashboard-preview header h1 { font-size: 28px; }
        .dashboard-preview header { margin-bottom: 12px; }
        .dashboard-preview [aria-label="Выбранный лицевой счёт"] { padding-block: 8px; margin-bottom: 12px; }
        .dashboard-preview [aria-label="Выбранный лицевой счёт"] > div:has(select) { display: flex; align-items: center; gap: 10px; }
        .dashboard-preview [aria-label="Выбранный лицевой счёт"] label { margin: 0; white-space: nowrap; }
        .dashboard-preview [aria-busy] > section > div:last-child { padding-block: 7px; }
        .dashboard-preview .preview-tools { margin-top: 8px; padding-block: 4px; }
        .dashboard-preview .preview-month-summary { margin-bottom: 4px; }
        .dashboard-preview .preview-balance-summary > p:last-child { margin-bottom: 8px; }
        .dashboard-preview .preview-tools h2 { margin-bottom: 4px; }
        .dashboard-preview .preview-tools nav a { min-height: 44px; padding-block: 6px; }
        .dashboard-preview .preview-tool-description, .dashboard-preview .preview-payment-help { display: none; }
      }
      @media (max-width: 639px) { .dashboard-preview .preview-readings .bar-track { height: 48px; } }
    `}</style>
  </div>;
}
