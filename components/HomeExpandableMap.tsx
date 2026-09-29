"use client";

import { useId, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { HomeAccountMap } from "./HomeAccountMap";
import { useHomeAccount } from './HomeAccountProvider';

export function HomeExpandableMap() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { selectedAccount } = useHomeAccount();

  return <div className="home-expandable-map" data-open={open}>
    <button type="button" className="home-map-toggle" aria-expanded={open}
      aria-controls={panelId} onClick={() => setOpen(value => !value)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-blue-50 text-blue-600"><MapPin size={20} /></span>
      <span className="min-w-0 flex-1 text-left">
        <span className="home-map-default-title block text-base font-semibold text-slate-900">Мои лицевые счета</span>
        <span className="home-map-phone-title text-base font-semibold text-slate-900">{selectedAccount ? `Лицевой счёт № ${selectedAccount.accountNumber}` : 'Мои лицевые счета'}</span>
        <span className="home-map-default-note block text-xs text-slate-500">{open ? "Свернуть карту" : "Выбрать счёт и посмотреть адрес"}</span>
        <span className="home-map-phone-note text-xs text-slate-500">{open ? 'Свернуть список счетов' : selectedAccount?.address || 'Выбрать лицевой счёт'}</span>
      </span>
      <span className="home-map-chevron"><ChevronDown className="h-5 w-5 text-slate-500" /></span>
    </button>
    <div id={panelId} className="home-map-disclosure">
      <div className="home-map-clip">
        <div className="home-map-surface"><HomeAccountMap /></div>
      </div>
    </div>
    <style jsx>{`
      .home-expandable-map { width: 100%; flex-shrink: 0; }
      .home-map-phone-title, .home-map-phone-note { display: none; }
      .home-map-toggle { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 76px; padding: 16px; background: white; border-bottom: 1px solid #e2e8f0; }
      .home-map-toggle:focus-visible { outline: 2px solid #2563eb; outline-offset: -3px; }
      .home-map-disclosure { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .4s cubic-bezier(.22, 1, .36, 1), visibility .4s; }
      .home-map-clip { min-height: 0; overflow: hidden; }
      .home-map-surface { height: clamp(280px, 65svh, 480px); }
      .home-map-chevron { transition: transform .3s ease; }
      [data-open="true"] .home-map-disclosure { grid-template-rows: 1fr; visibility: visible; }
      [data-open="true"] .home-map-chevron { transform: rotate(180deg); }
      @media (max-width: 1279px) {
        /* On exceptionally short windows keep access to the map reachable,
           without clipping content or shrinking the text below readable size. */
        .home-expandable-map[data-open="false"] { position: sticky; bottom: 0; z-index: 3; }
      }
      @media (max-width: 639px) {
        .home-map-toggle { min-height: 60px; padding: 10px 12px; }
        .home-map-surface { height: auto; }
        .home-map-disclosure, .home-map-chevron { transition: none; }
        .home-map-default-title, .home-map-default-note { display: none; }
        .home-map-phone-title, .home-map-phone-note { display: block; }
        .home-map-phone-note { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      }
      @media (min-width: 1280px) {
        .home-map-toggle { display: none; }
        /* Desktop entry slides the whole surface horizontally. Reserve its
           final height at once so the contacts below never jump vertically. */
        .home-map-disclosure { grid-template-rows: 1fr; visibility: visible; transition: none; }
        .home-map-surface { height: auto; aspect-ratio: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .home-map-disclosure, .home-map-chevron { transition: none; }
      }
    `}</style>
  </div>;
}
