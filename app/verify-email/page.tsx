"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен подтверждения не предоставлен');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email успешно подтвержден! Теперь вы можете войти в систему.');
        
        // Автоматически авторизуем пользователя через 2 секунды
        setTimeout(() => {
          // Попробуем найти email пользователя из ответа или запросить его
          // Пока просто редиректим на логин
          router.push('/login?verified=true');
        }, 2000);
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
              <p className="text-sm text-gray-600 text-center">
                Вы будете перенаправлены на страницу входа...
              </p>
              <Button 
                onClick={() => router.push('/login?verified=true')} 
                className="w-full"
              >
                Перейти к входу
              </Button>
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

