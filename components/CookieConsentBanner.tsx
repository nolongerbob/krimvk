"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "krimvk_cookie_consent_v1";
const COOKIE_NAME = "krimvk_cookie_consent";
const POLICY_VERSION = "2026-05-27";

type ConsentState = "accepted" | "declined" | null;

function persistConsent(value: Exclude<ConsentState, null>) {
  const payload = {
    value,
    version: POLICY_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(payload)
  )}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setConsent(null);
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as { value?: string; version?: string };
      const value = parsed?.value;
      if (
        parsed?.version === POLICY_VERSION &&
        (value === "accepted" || value === "declined")
      ) {
        setConsent(value);
      } else {
        // Сбрасываем старый/невалидный формат, чтобы показать баннер повторно.
        localStorage.removeItem(STORAGE_KEY);
        setConsent(null);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setConsent(null);
    }

    setReady(true);
  }, []);

  if (!ready || consent !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border bg-white p-4 shadow-lg md:left-auto md:max-w-xl">
      <p className="text-sm text-gray-700">
        Мы используем cookie для корректной работы сайта и повышения удобства.
        Продолжая пользоваться сайтом, вы можете дать согласие на использование
        cookie согласно{" "}
        <Link className="text-primary underline" href="/legal/cookies">
          Политике cookie
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded bg-primary px-3 py-2 text-sm text-white hover:opacity-90"
          onClick={() => {
            persistConsent("accepted");
            setConsent("accepted");
          }}
        >
          Принять
        </button>
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            persistConsent("declined");
            setConsent("declined");
          }}
        >
          Только обязательные
        </button>
      </div>
    </div>
  );
}
