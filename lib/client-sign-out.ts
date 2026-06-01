import { signOut } from 'next-auth/react';

/** Выход с редиректом на канонический домен (не IP из адресной строки). */
export async function signOutToHome(): Promise<void> {
  const fromBuild = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  let callbackUrl = fromBuild ? `${fromBuild}/` : '/';

  try {
    const res = await fetch('/api/site-config', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { signOutCallbackUrl?: string };
      if (data.signOutCallbackUrl) {
        callbackUrl = data.signOutCallbackUrl;
      }
    }
  } catch {
    // fallback: относительный /
  }

  await signOut({ callbackUrl, redirect: true });
}
