'use client';
import { useEffect, useRef, useState } from 'react';

export function VkLoginStart({ service }: { service: string }) {
  const started = useRef(false);
  const [error, setError] = useState('');
  async function start() {
    setError('');
    try {
      const response = await fetch('/api/auth/vk-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service, mode: 'login' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось начать вход');
      const url = new URL(data.url);
      if (url.origin !== 'https://id.vk.ru') throw new Error('Неверный адрес входа');
      window.location.assign(url.toString());
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось начать вход'); }
  }
  useEffect(() => { if (!started.current) { started.current = true; void start(); } }, []);
  return <div className="mx-auto max-w-md px-6 py-16 text-center">
    <p role="status">{error || 'Переходим к входу через VK ID…'}</p>
    {error && <button className="mt-4 bg-blue-600 px-4 py-2 text-white" onClick={() => void start()}>Повторить</button>}
  </div>;
}
