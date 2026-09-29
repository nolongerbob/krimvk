"use client";
import { useId, useState } from 'react';
import type { MonthPoint } from '@/lib/half-year-metrics';

export function MetricStepChart({ points, label, unit, color = 'text-blue-500' }: { points: MonthPoint[]; label: string; unit: string; color?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const tooltipId = useId();
  const values = points.flatMap(p => p.value == null ? [] : [p.value]);
  if (!values.length) return <p className="mt-2 text-xs text-slate-500">Нет истории за последние 6 месяцев</p>;
  const min = Math.min(0, ...values), max = Math.max(1, ...values);
  const y = (v: number) => (max - v) / (max - min) * 100;
  const month = (p: MonthPoint, short = false) => new Date(`${p.month}-15T12:00:00Z`).toLocaleDateString('ru-RU', { month: short ? 'short' : 'long', ...(short ? {} : { year: 'numeric' as const }) }).replace('.', '');
  const text = (p: MonthPoint) => `${month(p)}: ${p.value == null ? 'нет данных' : `${p.value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${unit}`}`;
  return <div className={`metric-bar-chart ${color}`} role="group" aria-label={`${label}, последние 6 завершённых месяцев`} onMouseLeave={() => setActive(null)}>
    {active !== null && points[active] && <div id={tooltipId} role="tooltip" className="bar-tooltip">{text(points[active])}</div>}
    <div className="bars" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
      {points.map((p, i) => <button key={p.month} type="button" className="bar-button" aria-label={text(p)} aria-describedby={active === i ? tooltipId : undefined}
        onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} onClick={() => setActive(i)} onKeyDown={e => { if (e.key === 'Escape') setActive(null); }}>
        <span className="bar-track"><span className="bar-zero" style={{ top: `${y(0)}%` }} />
          {p.value !== null ? <span className="bar-fill" style={{ top: `${Math.min(y(p.value), y(0))}%`, height: `${Math.max(2, Math.abs(y(p.value) - y(0)))}%`, opacity: active === i ? 1 : .65 }} /> : <span className="bar-missing">—</span>}
        </span><span className="bar-month"><span className="bar-month-name">{month(p, true)}</span><span className="bar-month-number" aria-hidden="true">{p.month.slice(5, 7)}</span></span>
      </button>)}
    </div>
    <style jsx>{`
      .metric-bar-chart { position: relative; margin-top: 6px; }
      .bars { display: grid; gap: 8px; }
      .bar-button { display: flex; min-width: 0; flex-direction: column; gap: 4px; padding: 0; cursor: pointer; }
      .bar-button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 3px; }
      .bar-track { display: block; position: relative; height: 42px; margin: 0 8%; }
      .bar-fill { position: absolute; left: 0; right: 0; border-radius: 3px 3px 0 0; background: currentColor; transition: opacity .15s; }
      .bar-zero { position: absolute; left: -10%; right: -10%; height: 1px; background: currentColor; opacity: .12; }
      .bar-month { color: #94a3b8; font-size: 10px; line-height: 12px; text-align: center; }
      .bar-month-number { display: none; }
      .bar-missing { position: absolute; bottom: 0; left: 0; right: 0; text-align: center; color: #cbd5e1; font-size: 12px; }
      .bar-tooltip { position: absolute; bottom: calc(100% + 5px); left: 0; right: 0; z-index: 5; width: fit-content; max-width: 100%; margin: auto; padding: 5px 9px; border-radius: 5px; background: #0f172a; color: white; font-size: 11px; line-height: 16px; box-shadow: 0 3px 10px #0f172a20; pointer-events: none; }
      @media (prefers-reduced-motion: reduce) { .bar-fill { transition: none; } }
      @media (max-width: 639px) {
        .bars { gap: 4px; }
        .bar-track { height: 30px; margin: 0 5%; }
        .bar-month { font-size: 8px; line-height: 10px; }
        .bar-tooltip { font-size: 10px; line-height: 13px; padding: 4px 6px; }
      }
    `}</style>
  </div>;
}
