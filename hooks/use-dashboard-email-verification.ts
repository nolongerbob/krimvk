'use client';

import { useCallback, useEffect, useState } from 'react';

type Options = {
  enabled: boolean;
  emailVerifiedFromOverview: boolean | null;
  overviewEmail: string;
};

export function useDashboardEmailVerification({
  enabled,
  emailVerifiedFromOverview,
  overviewEmail,
}: Options) {
  const [emailVerified, setEmailVerified] = useState<boolean | null>(
    emailVerifiedFromOverview
  );
  const [userEmail, setUserEmail] = useState(overviewEmail);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (emailVerifiedFromOverview !== null && emailVerifiedFromOverview !== undefined) {
      setEmailVerified(emailVerifiedFromOverview);
    }
  }, [emailVerifiedFromOverview]);

  useEffect(() => {
    if (overviewEmail) {
      setUserEmail(overviewEmail);
    }
  }, [overviewEmail]);

  const fetchUserEmailStatus = useCallback(async (force = false) => {
    try {
      const cacheBuster = force ? `?t=${Date.now()}` : '';
      const response = await fetch(`/api/user/profile${cacheBuster}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const verified = Boolean(data.user?.emailVerified);
        setEmailVerified(verified);
        setUserEmail(data.user?.email || '');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled || emailVerified !== false) return;
    const check = async () => {
      try {
        const res = await fetch(`/api/user/profile?t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.emailVerified) {
            setEmailVerified(true);
          }
        }
      } catch {
        // ignore
      }
    };
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [enabled, emailVerified]);

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setEmailMessage('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setEmailMessage('Письмо отправлено! Проверьте вашу почту.');
      } else {
        setEmailMessage(data.error || data.details || 'Ошибка при отправке письма');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Попробуйте позже';
      setEmailMessage(`Произошла ошибка: ${message}`);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailMessage('Введите корректный email адрес');
      return;
    }

    setChangingEmail(true);
    setEmailMessage('');
    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setEmailMessage(
          'Email изменен! Письмо с подтверждением отправлено на новый адрес.'
        );
        setUserEmail(data.newEmail);
        setNewEmail('');
        setTimeout(() => fetchUserEmailStatus(), 1000);
      } else {
        setEmailMessage(data.error || 'Ошибка при изменении email');
      }
    } catch {
      setEmailMessage('Произошла ошибка. Попробуйте позже.');
    } finally {
      setChangingEmail(false);
    }
  };

  return {
    emailVerified,
    setEmailVerified,
    userEmail,
    newEmail,
    setNewEmail,
    emailMessage,
    resendingEmail,
    changingEmail,
    handleResendVerification,
    handleChangeEmail,
    fetchUserEmailStatus,
  };
}
