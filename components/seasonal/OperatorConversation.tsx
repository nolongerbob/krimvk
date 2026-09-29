'use client';

import { useEffect, useRef, useState } from 'react';

export type SupportMessage = { id: string; text: string; isFromAdmin: boolean; imageUrl?: string | null };
export function OperatorConversation({ onCompleted }: { onCompleted: (messages: SupportMessage[], draft: string) => void }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [confirmReturn, setConfirmReturn] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/questions/list', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Не удалось загрузить ответы. Повторяем подключение…');
        const data = await response.json();
        if (!controller.signal.aborted) {
          setQuestionId(data.question?.id || null);
          setMessages(data.question?.messages || []);
          if (data.question?.status === 'COMPLETED') onCompleted(data.question.messages || [], draftRef.current);
        }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Нет связи'); }
      finally { pending = false; }
    }
    void refresh(); const interval = setInterval(refresh, 3000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [revision, onCompleted]);
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (busy || !draft.trim()) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/questions/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: draft.trim() }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Сообщение не отправлено'); }
      setDraft(''); setRevision(value => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка отправки'); }
    finally { setBusy(false); }
  }
  async function returnToAI() {
    if (busy || !questionId) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/assistant/return-to-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось вернуться к ИИ');
      onCompleted(data.question.messages || [], draftRef.current);
    } catch(e) { setError(e instanceof Error ? e.message : 'Ошибка соединения'); }
    finally { setBusy(false); }
  }
  return <div className="flex min-h-0 flex-1 flex-col">
    <p className="px-4 py-2 text-xs text-slate-500">Вы общаетесь со службой поддержки. Можно продолжать писать здесь — ответы появятся в этом чате.</p>
    <div className="px-4 pb-2">
      {confirmReturn ? <div className="rounded-md bg-slate-50 p-3 text-xs">
        <p>Завершить обращение к оператору и вернуться к ИИ? Переписка сохранится. Оператора можно будет позвать снова.</p>
        <div className="mt-2 flex gap-4">
          <button type="button" disabled={busy} onClick={()=>void returnToAI()} className="font-medium text-blue-700 disabled:opacity-50">Завершить и вернуться к ИИ</button>
          <button type="button" disabled={busy} onClick={()=>setConfirmReturn(false)}>Продолжить ждать</button>
        </div>
      </div> : <button type="button" disabled={busy || !questionId} onClick={()=>setConfirmReturn(true)} className="text-xs font-medium text-blue-700 disabled:opacity-50">Вернуться к ИИ</button>}
    </div>
    <div role="log" aria-label="Переписка с оператором" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto space-y-3 px-4 py-3">
      {messages.map(message => <div key={message.id} className={`whitespace-pre-wrap break-words rounded-md p-3 text-sm ${message.isFromAdmin ? 'mr-4 bg-slate-50 text-slate-900' : 'ml-4 bg-blue-600 text-white'}`}>
        <span className="mb-1 block text-xs opacity-70">{message.isFromAdmin ? 'Служба поддержки' : 'Вы'}</span>
        {message.text}
      </div>)}
    </div>
    {error && <p role="alert" className="px-4 text-sm text-red-700">{error}</p>}
    <form onSubmit={send} className="flex shrink-0 items-end gap-2 border-t p-3">
      <textarea aria-label="Сообщение оператору" value={draft} onChange={e=>setDraft(e.target.value)} disabled={busy} maxLength={2000} rows={2} placeholder="Напишите сообщение…" className="min-w-0 flex-1 resize-none rounded-md border p-2 text-sm" />
      <button type="submit" disabled={busy || !draft.trim()} className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-40">Отправить</button>
    </form>
  </div>;
}
