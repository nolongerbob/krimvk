"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Редирект после успешного подтверждения
    const verified = searchParams.get('verified');
    const fromOther = searchParams.get('from') === 'other';

    if (verified === 'true') {
      setStatus('success');
      // С другого устройства (нет сессии): не делаем автовход, не редиректим в ЛК
      if (fromOther) {
        setMessage('Email успешно подтвержден. Войдите в личный кабинет, используя ваш email и пароль.');
        return;
      }
      // То же устройство (сессия есть): автовход, редирект в ЛК
      setMessage('Email успешно подтвержден! Переходим в личный кабинет...');
      const timer = setTimeout(() => {
        window.location.href = '/dashboard?emailVerified=true';
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Редирект с параметром already=true (email уже подтвержден)
    const alreadyVerified = searchParams.get('already');
    if (alreadyVerified === 'true') {
      setStatus('success');
      setMessage('Email уже был подтвержден ранее. Войдите в систему, используя ваш email и пароль.');
      return;
    }

    // Предотвращаем повторные вызовы
    if (isVerifying || status !== 'loading') {
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Токен подтверждения не предоставлен');
      return;
    }

    // Обрабатываем токен только один раз
    setIsVerifying(true);
    verifyEmail(token);
  }, [token, isVerifying, status, searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      // Убеждаемся, что статус loading
      setStatus('loading');
      setMessage('Проверяем токен подтверждения...');
      
      // Используем прямой переход на серверный endpoint
      // Сервер установит cookie и сделает редирект в том же запросе
      // Это гарантирует, что cookie будет установлена в том же браузере/вкладке, где открыта ссылка
      // Если токен уже использован, сервер редиректит на /verify-email?already=true
      window.location.href = `/api/auth/verify-email?token=${token}`;
      return;
      
      // Код ниже не выполнится из-за редиректа, но оставлен для fallback
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        cache: 'no-store',
        redirect: 'manual',
      });

      const data = await response.json();

      if (response.ok) {
        // Успешное подтверждение или email уже был подтвержден
        if (data.alreadyVerified) {
          setStatus('success');
          setMessage('Email уже был подтвержден ранее. Выполняется вход...');
        } else {
          setStatus('success');
          setMessage('Email успешно подтвержден! Выполняется автоматический вход...');
        }
        
        // Автоматически входим в аккаунт через отдельный API
        if (data.userId && data.userEmail) {
          try {
            // Вызываем API для автоматического входа
            const loginResponse = await fetch('/api/auth/auto-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.userId }),
              credentials: 'include', // Важно для установки cookies
            });

            if (loginResponse.ok) {
              // Редиректим в dashboard с полной перезагрузкой страницы для применения cookies
              setTimeout(() => {
                window.location.href = '/dashboard?emailVerified=true';
              }, 500);
            } else {
              // Если автоматический вход не сработал, просто редиректим на логин
              setTimeout(() => {
                router.push('/login?verified=true');
              }, 1000);
            }
          } catch (loginError) {
            console.error('Auto-login error:', loginError);
            // В случае ошибки редиректим на логин
            setTimeout(() => {
              router.push('/login?verified=true');
            }, 1000);
          }
        } else {
          // Если userId не получен, редиректим на логин
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 1000);
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Ошибка при подтверждении email');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('Произошла ошибка при подтверждении email. Попробуйте позже.');
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Подтверждение email...'}
            {status === 'success' && 'Email подтвержден!'}
            {status === 'error' && 'Ошибка подтверждения'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Пожалуйста, подождите'}
            {status === 'success' && 'Ваш email адрес успешно подтвержден'}
            {status === 'error' && 'Не удалось подтвердить email адрес'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-700">
            {message}
          </p>

          {status === 'success' && (
            <div className="space-y-3">
              {searchParams.get('already') === 'true' ? (
                // Email уже был подтвержден ранее
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Для входа в личный кабинет используйте ваш email и пароль.
                  </p>
                  <Button onClick={() => router.push('/login')} className="w-full">
                    Перейти к входу
                  </Button>
                </>
              ) : searchParams.get('from') === 'other' ? (
                // Подтвердили с другого устройства — без автовхода, только кнопка «Войти»
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Войдите в личный кабинет, используя ваш email и пароль.
                  </p>
                  <Button onClick={() => router.push('/login')} className="w-full">
                    Войти
                  </Button>
                </>
              ) : (
                // То же устройство, сессия есть — автопереход в ЛК
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Ваш email адрес успешно подтвержден.
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Вы будете перенаправлены в личный кабинет через несколько секунд...
                  </p>
                  <Button 
                    onClick={() => { window.location.href = '/dashboard?emailVerified=true'; }} 
                    className="w-full"
                  >
                    Перейти в личный кабинет сейчас
                  </Button>
                </>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Не получили письмо?
                    </p>
                    <p className="text-sm text-blue-800">
                      Проверьте папку "Спам" или запросите повторную отправку письма на странице входа.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/login')} 
                  className="flex-1"
                >
                  Перейти к входу
                </Button>
                <Button 
                  onClick={() => router.push('/register')} 
                  className="flex-1"
                >
                  Регистрация
                </Button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Проверяем токен подтверждения...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

