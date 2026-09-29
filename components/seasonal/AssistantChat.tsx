'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ChevronDown, RotateCcw } from 'lucide-react';
import { ChatMascot } from './ChatMascot';
import { OperatorConversation, type SupportMessage } from './OperatorConversation';
import { assistantTextParts, type AssistantMessage } from '@/lib/visitor-assistant';

export type PetOrigin = { x: number; y: number; width: number; height: number; image?: string };

export function EmbeddedAssistantChat({ initialOperator }: { initialOperator: boolean }) {
  return <AssistantChat open embedded initialOperator={initialOperator} onOpenChange={()=>{}} />;
}

export function AssistantChat({ open, onOpenChange, origin, embedded = false, initialOperator = false }: { open: boolean; onOpenChange: (open: boolean) => void; origin?: PetOrigin; embedded?: boolean; initialOperator?: boolean }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [login, setLogin] = useState(false);
  const [handedOff, setHandedOff] = useState(initialOperator);
  const [checkingOperator, setCheckingOperator] = useState(true);
  const [completedHistory, setCompletedHistory] = useState<SupportMessage[]>([]);
  const completed = useCallback((history: SupportMessage[], pendingDraft: string) => {
    setCompletedHistory(history); setHandedOff(false); setMessages([]); setDraft(pendingDraft); setError('');
  }, []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setCheckingOperator(true);
    void fetch('/api/questions/list', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (response.status === 401) {
        if (!controller.signal.aborted) setLogin(true);
        return null;
      }
      if (!response.ok) throw new Error('Не удалось проверить состояние поддержки. Откройте чат повторно.');
      if (!controller.signal.aborted) setLogin(false);
      return response.json();
    }).then(data => {
      if (!controller.signal.aborted) {
        if (data?.question?.status === 'COMPLETED') setCompletedHistory(data.question.messages || []);
        if (!data) { setCompletedHistory([]); setMessages([]); }
        setHandedOff(!!data?.question && data.question.status !== 'COMPLETED' && data.question.messages?.some((m: {isFromAdmin:boolean})=>!m.isFromAdmin));
        setCheckingOperator(false);
      }
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Ошибка соединения'); });
    return () => controller.abort();
  }, [open]);
  const request = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || embedded) return;
    const viewport = window.visualViewport;
    const sync = () => {
      panel.current?.style.setProperty('--chat-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      panel.current?.style.setProperty('--chat-viewport-top', `${viewport?.offsetTop ?? 0}px`);
    };
    sync(); viewport?.addEventListener('resize', sync); viewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => { viewport?.removeEventListener('resize', sync); viewport?.removeEventListener('scroll', sync); window.removeEventListener('resize', sync); };
  }, [open, embedded]);
  const content = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLImageElement>(null);
  const [closing, setClosing] = useState(false);
  const animations = useRef<Animation[]>([]);
  const fromTransform = () => {
    const box = panel.current!.getBoundingClientRect();
    const from = origin || { x: window.innerWidth-124, y: window.innerHeight-124, width:112, height:112 };
    return `translate(${from.x+from.width/2-box.left-box.width/2}px, ${from.y+from.height/2-box.top-box.height/2}px) scale(${24/box.width}, ${24/box.height})`;
  };
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    setClosing(false);
    if (!open || !panel.current || embedded) return;
    if (!reduced() && panel.current.animate) {
      const expansion = panel.current.animate([
        { transform: fromTransform(), borderRadius:'50%', background:'#78d9f3', opacity:0 },
        { opacity:1, offset:.15, borderRadius:'45% 55% 35% 65%' },
        { transform:'none', borderRadius:'12px', background:'#ffffff', opacity:1 },
      ],{ duration:440, delay:140, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards' });
      const reveal = content.current!.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:240,delay:270,fill:'backwards'});
      animations.current=[expansion,reveal];
      if (ghost.current) animations.current.push(ghost.current.animate([{opacity:1,transform:'scale(1)'},{opacity:1,transform:'scale(.22)',offset:.7},{opacity:0,transform:'scale(.22)'}],{duration:220,easing:'ease-in-out',fill:'forwards'}));
    }
    panel.current.focus({preventScroll:true});
    return () => { animations.current.forEach(a=>a.cancel()); animations.current=[]; };
  }, [open, origin]);
  function close() {
    if (closing) return;
    setClosing(true);
    const finish = () => {
      onOpenChange(false);
      requestAnimationFrame(()=>(document.querySelector<HTMLButtonElement>('[data-seasonal-corner-pet]') ?? document.querySelector<HTMLButtonElement>('[aria-label="Открыть помощника Капельку"]'))?.focus({preventScroll:true}));
    };
    if (!panel.current?.animate || reduced()) { finish(); return; }
    animations.current.forEach(a=>a.cancel());
    const collapse=panel.current.animate([{transform:'none',borderRadius:'12px',opacity:1},{transform:fromTransform(),borderRadius:'50%',opacity:0}],{duration:300,easing:'cubic-bezier(.6,0,.8,.3)',fill:'forwards'});
    const fade=content.current!.animate([{opacity:1},{opacity:0}],{duration:120,fill:'forwards'});
    animations.current=[collapse,fade];
    if(ghost.current) {
      const restore = ghost.current.animate([{opacity:0,transform:'scale(.22)'},{opacity:1,transform:'scale(.22)',offset:.2},{opacity:1,transform:'scale(1)'}],{duration:240,delay:240,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
      animations.current.push(restore);
      restore.onfinish=finish;
    } else collapse.onfinish=finish;
  }
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }); }, [messages, busy, open]);
  async function run(handoff: boolean) {
    if (request.current || handedOff || checkingOperator || login) return;
    const text = draft.trim();
    if (!handoff && !text) return;
    const next: AssistantMessage[] = text ? [...messages, { role: 'user', content: text }] : messages;
    if (!next.some(m => m.role === 'user')) { setError('Сначала напишите, с чем нужна помощь.'); return; }
    if (next.length > 10 || next.reduce((n,m) => n+m.content.length,0) > 8000) {
      setError('Диалог достиг лимита. Передайте существующую историю оператору без нового текста или начните новый разговор.'); return;
    }
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setLogin(false);
    try {
      const response = await fetch(handoff ? '/api/assistant/handoff' : '/api/assistant/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.operatorActive) setHandedOff(true);
        if (response.status === 401) setLogin(true);
        throw new Error(data.error || 'Не удалось отправить сообщение');
      }
      if (handoff) { setMessages(next); setHandedOff(true); }
      else {
        if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Помощник не вернул ответ');
        setMessages([...next, { role: 'assistant', content: data.answer }]);
      }
      setDraft('');
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Ошибка соединения');
    } finally {
      if (request.current === controller) request.current = null;
      setBusy(false);
    }
  }
  if (!open) return null;
  return <>
    {origin?.image && <img ref={ghost} src={origin.image} alt="" aria-hidden="true" className="pointer-events-none fixed z-[81] [image-rendering:pixelated]" style={{left:origin.x,top:origin.y,width:origin.width,height:origin.height,opacity:0}} />}
    <div ref={panel} data-floating-assistant={!embedded ? '' : undefined} role="dialog" aria-modal="false" aria-labelledby="kapelka-chat-title" tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}}}
      className={`${embedded ? 'relative w-full min-h-0 flex-1' : 'fixed bottom-4 right-4 z-[80] w-[min(380px,calc(100vw-32px))]'} overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_16px_60px_-16px_rgba(15,23,42,0.28)] outline-none`}
      style={{maxHeight:'calc(100dvh - 32px)'}}>
    <div ref={content} className={`flex max-h-[calc(100dvh-32px)] flex-col ${embedded ? 'h-full' : handedOff ? 'h-[min(520px,calc(100dvh-32px))]' : ''}`}>
    <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2">
      <div className="flex items-center gap-2"><ChatMascot thinking={busy} /><div>
        <h2 id="kapelka-chat-title" className="flex items-center gap-2 text-base font-semibold tracking-tight">Чат <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-500">{handedOff ? 'Оператор' : 'ИИ'}</span></h2>
        <p className="mt-1 text-xs text-slate-500">{handedOff ? 'Служба поддержки КрымВК' : busy?'Отправляем…':'Помощник КрымВК'}</p>
      </div></div>
      <div className="flex items-center">
        {!handedOff && <button type="button" disabled={busy || checkingOperator} aria-label="Новый разговор" title="Новый разговор" onClick={()=>{setMessages([]);setDraft('');setError('');setLogin(false);}} className="flex h-11 w-9 items-center justify-center text-slate-400 hover:text-slate-800 disabled:opacity-40"><RotateCcw size={15} /></button>}
        {!embedded && <button type="button" onClick={close} aria-label="Свернуть в капельку" className="flex h-11 w-9 items-center justify-center text-slate-500 hover:text-slate-900"><ChevronDown size={19} /></button>}
      </div>
    </header>
    {login ? <div className="space-y-4 px-5 py-6">
      <p className="text-lg font-semibold">Давайте познакомимся!</p>
      <p className="text-sm leading-relaxed text-slate-600">Войдите или зарегистрируйтесь, чтобы написать мне или позвать оператора. Так ваша переписка будет связана с личным кабинетом.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/login?callbackUrl=%2Fdashboard%2Fquestions" className="rounded bg-blue-600 px-4 py-2 text-sm text-white">Войти</Link>
        <Link href="/register" className="rounded border border-slate-200 px-4 py-2 text-sm">Зарегистрироваться</Link>
      </div>
    </div> : handedOff ? <OperatorConversation onCompleted={completed} /> : <>
    <div role="log" aria-label="Переписка с Капелькой" aria-live="polite" className="min-h-0 max-h-[35dvh] overflow-y-auto space-y-3 px-4 py-3">
      {completedHistory.map(message => <div key={message.id} className={`rounded-md p-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${message.isFromAdmin ? 'mr-3 bg-slate-50 text-slate-900' : 'ml-6 bg-blue-600 text-white'}`}>
        <span className="mb-2 block text-xs opacity-70">{message.isFromAdmin ? 'Служба поддержки' : 'Вы'}</span>
        {message.text}
      </div>)}
      {!!completedHistory.length && <p role="status" className="rounded-md bg-slate-100 p-3 text-xs text-slate-600">Диалог с оператором завершён. История сохранена. Теперь вам снова отвечает Капелька — при необходимости можно позвать оператора ещё раз.</p>}
      {!messages.length && !completedHistory.length && <div className="py-5"><p className="text-lg font-semibold tracking-tight">Чем помочь?</p><p className="mt-2 text-sm leading-relaxed text-slate-500">Разберёмся с показаниями, квитанцией или подключением.</p>
        <div className="mt-4 flex flex-wrap gap-2">{['Передать показания','Пароль 1С','Найти квитанцию'].map(text=><button key={text} type="button" disabled={busy||handedOff} onClick={()=>setDraft(text)} className="rounded border border-slate-200 px-2.5 py-2 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-700">{text}</button>)}</div>
      </div>}
      {messages.map((m,i) => <div key={i} className={`rounded-md p-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${m.role==='user'?'ml-6 bg-blue-600 text-white':'mr-3 bg-slate-50 text-slate-900'}`}>
        <span className="mb-2 block text-xs opacity-70">{m.role==='user'?'Вы':'Капелька · ИИ'}</span>
        {m.role==='user' ? m.content : assistantTextParts(m.content).map((part,n)=>part.href
          ? <Link key={n} href={part.href} className="font-medium text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-600">{part.text}</Link>
          : <span key={n}>{part.text}</span>)}
      </div>)}
      {busy && <p role="status" className="text-sm">Отправляю…</p>}
      <div ref={end} />
    </div>
    {error && <p role="alert" className="px-4 text-sm text-red-700">{error}</p>}
    {login && <Link href="/login" className="px-4 text-sm underline">Войдите, чтобы связать обращение с вашим кабинетом</Link>}
    <form onSubmit={event=>{event.preventDefault();void run(false);}} className="shrink-0 space-y-3 border-t border-slate-100 bg-white p-4">
      <label htmlFor="kapelka-question" className="sr-only">Ваш вопрос</label>
      <div className="relative rounded-md border border-slate-200 bg-slate-50 focus-within:border-blue-400">
        <textarea id="kapelka-question" maxLength={2000} rows={2} value={draft} disabled={busy||handedOff} onChange={e=>setDraft(e.target.value)} placeholder="Напишите вопрос…" className="block w-full resize-none rounded-md bg-transparent py-3 pl-3 pr-14 text-sm outline-none" />
        <button type="submit" aria-label="Отправить" disabled={busy||checkingOperator||!draft.trim()} className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"><ArrowUp size={19} /></button>
      </div>
      <button type="button" disabled={busy||checkingOperator} onClick={()=>void run(true)} className="text-xs font-medium text-slate-600 hover:text-blue-600 disabled:opacity-50">Позвать оператора <span aria-hidden="true">→</span></button>
      <p className="text-[10px] leading-relaxed text-slate-500">ИИ может ошибаться. Вопросы обрабатывает DeepSeek — не отправляйте пароли и коды. При вызове оператора история передаётся ему, переписка продолжается здесь.</p>
    </form>
    </>}
    </div></div>
    <style jsx global>{`
      @media (max-width: 639px) {
        [data-floating-assistant] { left: 8px; right: 8px; top: calc(var(--chat-viewport-top, 0px) + 8px + env(safe-area-inset-top)); bottom: auto; width: auto; height: calc(var(--chat-viewport-height, 100dvh) - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); max-height: none !important; }
        [data-floating-assistant] > div { height: 100%; max-height: 100%; }
        [data-floating-assistant] [role="log"] { flex: 1; max-height: none; overscroll-behavior: contain; }
        [data-floating-assistant] textarea { font-size: 16px; }
        [data-floating-assistant] form { padding: 12px; }
      }
    `}</style>
  </>;
}
