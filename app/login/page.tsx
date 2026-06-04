"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthBrandPanel, AuthSplitLayout } from "@/components/auth/AuthBrandPanel";
import { authButtonClass, authFieldClass } from "@/components/auth/auth-styles";

export const dynamic = "force-dynamic";

function LoginStatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2">
      <AuthBrandPanel className="min-h-[220px] lg:min-h-0" />
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 md:px-10">
        <p className="text-gray-600">{children}</p>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const verified = searchParams.get("verified");

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    let cancelled = false;

    const resolveTarget = () => {
      let target = "/dashboard";
      const raw = callbackUrl || "/dashboard";
      if (raw.startsWith("/") && !raw.startsWith("//")) {
        target = raw;
      } else if (raw.startsWith("http")) {
        try {
          const u = new URL(raw);
          const site = process.env.NEXT_PUBLIC_SITE_URL || "https://krimvk.ru";
          if (
            raw.startsWith(site) ||
            u.hostname === "krimvk.ru" ||
            u.hostname === "www.krimvk.ru"
          ) {
            target = `${u.pathname}${u.search}`;
          }
        } catch {
          /* keep /dashboard */
        }
      }
      return target;
    };

    (async () => {
      try {
        const res = await fetch("/api/auth/check", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;

        if (!data.authenticated) {
          // Клиент ещё «authenticated» после выхода — сбрасываем без редиректа
          await signOut({ redirect: false });
          return;
        }

        window.location.replace(resolveTarget());
      } catch {
        if (!cancelled) {
          window.location.replace(resolveTarget());
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session, callbackUrl]);

  if (status === "loading") {
    return <LoginStatusMessage>Проверка авторизации...</LoginStatusMessage>;
  }

  if (status === "authenticated" && session) {
    return <LoginStatusMessage>Перенаправление...</LoginStatusMessage>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "EMAIL_NOT_VERIFIED" || result.error.includes("EMAIL_NOT_VERIFIED")) {
          setError(
            "Email не подтвержден. Пожалуйста, проверьте вашу почту и перейдите по ссылке подтверждения."
          );
        } else {
          setError("Неверный email или пароль");
        }
        setIsLoading(false);
      } else if (result?.ok) {
        let targetUrl = "/dashboard";
        const raw = callbackUrl || "/dashboard";
        if (raw.startsWith("/") && !raw.startsWith("//")) {
          targetUrl = raw;
        }
        window.location.replace(targetUrl);
        return;
      } else {
        setIsLoading(false);
      }
    } catch {
      setError("Произошла ошибка. Попробуйте позже.");
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            Вход в личный кабинет
          </h1>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Войдите в аккаунт для доступа к услугам
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {verified === "true" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Email успешно подтвержден! Теперь вы можете войти.
            </div>
          )}
          {searchParams.get("passwordReset") === "true" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Пароль успешно изменён! Теперь вы можете войти с новым паролем.
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authFieldClass}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password" className="text-sm font-medium">
                Пароль
              </Label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Забыли пароль?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authFieldClass}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className={cn(authButtonClass, "bg-blue-600 hover:bg-blue-700")}
            disabled={isLoading}
          >
            {isLoading ? "Вход..." : "Войти"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm lg:text-left">
          <span className="text-gray-600">Нет аккаунта? </span>
          <Link href="/register" className="text-blue-600 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginStatusMessage>Загрузка...</LoginStatusMessage>}>
      <LoginForm />
    </Suspense>
  );
}
