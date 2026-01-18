"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPassword, setRegisteredPassword] = useState(""); // Для обновления сессии после подтверждения
  const router = useRouter();
  const { data: session } = useSession();

  // Предотвращаем автоматический редирект сразу после регистрации
  // Если пользователь только что зарегистрировался (флаг в sessionStorage),
  // не редиректим, даже если есть сессия - пользователь должен увидеть страницу "Регистрация успешна"
  useEffect(() => {
    const justRegistered = sessionStorage.getItem('justRegistered');
    if (justRegistered === 'true' && session && !success) {
      // Пользователь только что зарегистрировался, но страница успеха ещё не показана
      // Не редиректим - покажем страницу успеха
      return;
    }
  }, [session, success]);

  // Проверяем статус подтверждения email и редиректим в ЛК после подтверждения
  useEffect(() => {
    if (!success) return;
    const check = async () => {
      try {
        // Получаем userId из localStorage (сохранён при регистрации)
        const userId = localStorage.getItem('registeredUserId');
        const url = userId 
          ? `/api/auth/check-email-verified?userId=${userId}`
          : '/api/auth/check-email-verified';
        const res = await fetch(url, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.verified) {
            // Email подтверждён — обновляем сессию на клиенте и редиректим в ЛК
            localStorage.removeItem('registeredUserId'); // Очищаем после использования
            sessionStorage.removeItem('justRegistered'); // Убираем флаг
            
            // Обновляем сессию NextAuth на клиенте (cookie уже установлена на сервере)
            // Используем signIn для обновления сессии без перезагрузки
            if (registeredEmail && registeredPassword) {
              try {
                await signIn('credentials', {
                  email: registeredEmail,
                  password: registeredPassword,
                  redirect: false,
                });
              } catch {
                // Игнорируем ошибки - cookie уже установлена
              }
            }
            
            router.replace("/dashboard?emailVerified=true");
          }
        }
      } catch { /* ignore */ }
    };
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Сохраняем userId в localStorage для использования после подтверждения
        if (data.userId) {
          localStorage.setItem('registeredUserId', data.userId);
        }
        
        // Показываем сообщение о необходимости подтверждения email СРАЗУ
        // Сессия уже создана на сервере (cookie установлена)
        // Обновим сессию на клиенте только после подтверждения email
        // Устанавливаем флаг, чтобы предотвратить автоматический редирект
        sessionStorage.setItem('justRegistered', 'true');
        setSuccess(true);
        setRegisteredEmail(formData.email);
        setRegisteredPassword(formData.password); // Сохраняем для обновления сессии после подтверждения
        setError("");
      } else {
        setError(data.error || "Ошибка регистрации");
        console.error("Registration error:", data);
      }
    } catch (err) {
      console.error("Registration request error:", err);
      setError("Произошла ошибка. Попробуйте позже.");
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт для доступа к услугам водоканала
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Регистрация успешна!
                </h3>
                <p className="text-green-800 mb-4">
                  Мы отправили письмо с подтверждением на адрес:
                </p>
                <p className="font-medium text-green-900 mb-4">
                  {registeredEmail}
                </p>
                <p className="text-sm text-green-700 mb-6">
                  Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации аккаунта. После подтверждения вы будете перенаправлены в личный кабинет.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-gray-600 mb-2">
                    Не получили письмо?
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 text-left">
                    <li>• Проверьте папку "Спам"</li>
                    <li>• Убедитесь, что email адрес указан правильно</li>
                    <li>• Письмо может прийти с задержкой до 5 минут</li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setRegisteredEmail("");
                  setRegisteredPassword("");
                  setFormData({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    name: "",
                    phone: "",
                  });
                }}
                variant="outline"
                className="w-full"
              >
                Зарегистрировать другой email
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Уже подтвердили? Войти
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                ФИО
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Зарегистрироваться
            </Button>
            
            {/* Разделитель */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">или</span>
              </div>
            </div>

            {/* Кнопка регистрации через Госуслуги */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              size="lg"
              onClick={() => signIn("gosuslugi", { callbackUrl: "/dashboard" })}
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 16.09V7.91L17.59 12l-7 4.09z"
                  fill="currentColor"
                />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              Зарегистрироваться через Госуслуги
            </Button>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Уже есть аккаунт? </span>
              <Link href="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


