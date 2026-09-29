import Link from 'next/link';
import { ArrowUpRight, Phone, Droplet, AlertTriangle } from 'lucide-react';

const services = [
  { title: 'Приём показаний ХВС', icon: Droplet, emergency: false,
    hours: 'Пн–Чт: 8:00–17:00 · Пт: 8:00–16:00',
    phones: [{ href: 'tel:+79780800366', label: '+7 (978) 080-03-66' }, { href: 'tel:+79884648724', label: '+7 (988) 464-87-24' }] },
  { title: 'Аварийно-диспетчерская служба', icon: AlertTriangle, emergency: true,
    hours: 'Круглосуточно, без выходных',
    phones: [{ href: 'tel:+79787013050', label: '+7 (978) 701-30-50' }, { href: 'tel:+79787460990', label: '+7 (978) 746-09-90' }] },
];

export function HomeEmergencyContacts() {
  return <section aria-label="Контакты служб" className="flex min-h-[160px] flex-1 flex-col border border-slate-300 bg-white">
    <div className="grid flex-1 grid-cols-1 min-[480px]:grid-cols-2">
      {services.map(({ title, icon: Icon, emergency, hours, phones }) => <div key={title} className={`flex min-w-0 flex-col items-center justify-center px-3 py-5 text-center ${emergency ? 'border-t border-red-200 bg-red-50 min-[480px]:border-l min-[480px]:border-t-0' : ''}`}>
        <span className={`mb-2 flex h-9 w-9 items-center justify-center ${emergency ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-600'}`}><Icon aria-hidden className="h-5 w-5" /></span>
        <h2 className="mb-3 flex min-h-10 items-center justify-center text-sm font-semibold leading-5 text-slate-900">{title}</h2>
        <div className="flex w-full flex-col gap-1">
          {phones.map(phone => <a key={phone.href} href={phone.href} aria-label={`${title}: ${phone.label}`} className={`inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap text-[13px] font-semibold tabular-nums focus-visible:outline focus-visible:outline-2 ${emergency ? 'text-red-700 hover:text-red-900 focus-visible:outline-red-600' : 'text-slate-900 hover:text-blue-700 focus-visible:outline-blue-600'}`}><Phone aria-hidden className="h-3.5 w-3.5 shrink-0" />{phone.label}</a>)}
        </div>
        <p className="mt-3 text-[11px] leading-4 text-slate-500">{hours}</p>
        {emergency && <Link href="/emergency" className="mt-3 inline-flex min-h-9 items-center justify-center gap-1.5 border border-red-200 bg-white/70 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600">Сообщить об аварии<ArrowUpRight aria-hidden className="h-3.5 w-3.5 shrink-0" /></Link>}
      </div>)}
    </div>
    <Link href="/contact" className="flex min-h-10 items-center justify-center gap-1 border-t border-slate-200 text-xs font-medium text-blue-700 hover:bg-blue-50">Все контакты<ArrowUpRight aria-hidden className="h-3.5 w-3.5" /></Link>
  </section>;
}
