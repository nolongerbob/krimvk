"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const token = searchParams.get('token');
  const waiting = searchParams.get('waiting') === 'true';
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'waiting'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Режим ожидания подтверждения (после регистрации)
  useEffect(() => {
    if (!waiting) return;
    
    setStatus('waiting');
    
    // Получаем email из сессии, если пользователь авторизован
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      setMessage(`Ожидаем подтверждения email. Проверьте вашу почту (${session.user.email}) и перейдите по ссылке в письме.`);
    } else {
      setMessage('Ожидаем подтверждения email. Проверьте вашу почту и перейдите по ссылке в письме.');
    }
    
    // Опрашиваем статус подтверждения каждые 2 секунды
    const checkStatus = async () => {
      try {
        const userId = localStorage.getItem('registeredUserId');
        const url = userId 
          ? `/api/auth/check-email-verified?userId=${userId}`
          : '/api/auth/check-email-verified';
        const res = await fetch(url, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.verified) {
            // Email подтверждён — редиректим в ЛК
            localStorage.removeItem('registeredUserId');
            router.replace('/dashboard?emailVerified=true');
          }
        }
      } catch {
        // Игнорируем ошибки
      }
    };
    
    // Проверяем сразу и затем каждые 2 секунды
    checkStatus();
    const id = setInterval(checkStatus, 2000);
    return () => clearInterval(id);
  }, [waiting, router, session]);

  useEffect(() => {
    // Если в режиме ожидания, не обрабатываем токен
    if (waiting) return;
    
    const verified = searchParams.get('verified');
    const fromOther = searchParams.get('from') === 'other';

    if (verified === 'true') {
      setStatus('success');
      // Подтверждение с другого устройства: проверяем статус и редиректим в ЛК
      if (fromOther) {
        setMessage('Email успешно подтвержден! Проверяем статус и переходим в личный кабинет...');
        // Опрашиваем статус и при подтверждении создаём сессию и редиректим в ЛК
        const checkAndRedirect = async () => {
          try {
            // Пробуем получить userId из localStorage (если пользователь регистрировался на этом устройстве)
            const userId = localStorage.getItem('registeredUserId');
            const url = userId 
              ? `/api/auth/check-email-verified?userId=${userId}`
              : '/api/auth/check-email-verified';
            const res = await fetch(url, {
              credentials: 'include',
              cache: 'no-store',
            });
            if (res.ok) {
              const data = await res.json();
              if (data.verified && data.userId) {
                // Email подтверждён и есть userId — создаём сессию через auto-login
                localStorage.removeItem('registeredUserId'); // Очищаем после использования
                const loginRes = await fetch('/api/auth/auto-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: data.userId }),
                  credentials: 'include',
                });
                if (loginRes.ok) {
                  window.location.href = '/dashboard?emailVerified=true';
                  return;
                }
              } else if (data.verified) {
                // Email подтверждён, но нет userId (нет pending_verify на этом устройстве)
                // Редиректим на логин — пользователь войдёт и попадёт в ЛК
                window.location.href = '/login?verified=true';
                return;
              }
            }
          } catch {
            // При ошибке редиректим на логин
            window.location.href = '/login?verified=true';
          }
        };
        // Проверяем сразу и затем каждые 2 секунды
        checkAndRedirect();
        const id = setInterval(checkAndRedirect, 2000);
        return () => clearInterval(id);
      }
      // Устройство, где регистрировались (или тот же браузер с сессией) — редирект в ЛК
      setMessage('Email успешно подтвержден! Переходим в личный кабинет...');
      const timer = setTimeout(() => {
        window.location.href = '/dashboard?emailVerified=true';
      }, 2000);
      return () => clearTimeout(timer);
    }

    const alreadyVerified = searchParams.get('already');
    if (alreadyVerified === 'true') {
      setStatus('success');
      setMessage('Email уже был подтвержден ранее. Войдите в систему, используя ваш email и пароль.');
      return;
    }

    // Если нет токена, но страница открыта — проверяем статус (например, пользователь подтвердил с другого устройства)
    if (!token && status === 'loading') {
      // Опрашиваем статус подтверждения
      const checkStatus = async () => {
        try {
          // Пробуем получить userId из localStorage
          const userId = localStorage.getItem('registeredUserId');
          const url = userId 
            ? `/api/auth/check-email-verified?userId=${userId}`
            : '/api/auth/check-email-verified';
          const res = await fetch(url, {
            credentials: 'include',
            cache: 'no-store',
          });
          if (res.ok) {
            const data = await res.json();
            if (data.verified && data.userId) {
              // Email подтверждён — создаём сессию и редиректим в ЛК
              localStorage.removeItem('registeredUserId'); // Очищаем после использования
              const loginRes = await fetch('/api/auth/auto-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.userId }),
                credentials: 'include',
              });
              if (loginRes.ok) {
                window.location.href = '/dashboard?emailVerified=true';
                return;
              }
            } else if (data.verified) {
              // Email подтверждён, но нет userId — редирект на логин
              window.location.href = '/login?verified=true';
              return;
            }
          }
        } catch {
          // Игнорируем ошибки
        }
      };
      checkStatus();
      const id = setInterval(checkStatus, 3000);
      return () => clearInterval(id);
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
            {(status === 'loading' || status === 'waiting') && (
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
            {status === 'waiting' && 'Ожидаем подтверждения email'}
            {status === 'success' && 'Email подтвержден!'}
            {status === 'error' && 'Ошибка подтверждения'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Пожалуйста, подождите'}
            {status === 'waiting' && 'Проверьте вашу почту и перейдите по ссылке в письме'}
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
                    Вы будете перенаправлены в личный кабинет через пару секунд...
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

          {status === 'waiting' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-blue-800 mb-2">
                  Мы отправили письмо с подтверждением на ваш email адрес.
                </p>
                <p className="text-sm text-blue-700">
                  Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации аккаунта.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  Не получили письмо?
                </p>
                <ul className="text-xs text-gray-600 space-y-1 text-left">
                  <li>• Проверьте папку "Спам"</li>
                  <li>• Убедитесь, что email адрес указан правильно</li>
                  <li>• Письмо может прийти с задержкой до 5 минут</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500 text-center">
                После подтверждения вы будете автоматически перенаправлены в личный кабинет...
              </p>
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

