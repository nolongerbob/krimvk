"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type PollResult = "pending" | "dashboard" | "login";

async function pollEmailVerified(): Promise<PollResult> {
  const res = await fetch("/api/auth/check-email-verified", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return "pending";

  const data = await res.json();
  if (!data.verified) return "pending";

  if (data.loginToken) {
    const loginRes = await fetch("/api/auth/auto-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginToken: data.loginToken }),
      credentials: "include",
    });
    return loginRes.ok ? "dashboard" : "login";
  }

  return "dashboard";
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const token = searchParams.get("token");
  const waiting = searchParams.get("waiting") === "true";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "waiting">("loading");
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const goDashboard = useCallback(() => {
    window.location.href = "/dashboard?emailVerified=true";
  }, []);

  const goLogin = useCallback(() => {
    window.location.href = "/login?verified=true";
  }, []);

  useEffect(() => {
    if (!waiting) return;

    setStatus("waiting");
    if (session?.user?.email) {
      setMessage(
        `Ожидаем подтверждения email. Проверьте вашу почту (${session.user.email}) и перейдите по ссылке в письме.`
      );
    } else {
      setMessage(
        "Ожидаем подтверждения email. Проверьте вашу почту и перейдите по ссылке в письме."
      );
    }

    const tick = async () => {
      const result = await pollEmailVerified();
      if (result === "dashboard") goDashboard();
      else if (result === "login") goLogin();
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [waiting, session, goDashboard, goLogin]);

  useEffect(() => {
    if (waiting) return;

    const verified = searchParams.get("verified");
    const fromOther = searchParams.get("from") === "other";

    if (verified === "true") {
      setStatus("success");
      if (fromOther) {
        setMessage(
          "Email успешно подтвержден! Войдите в личный кабинет, используя ваш email и пароль."
        );
        return;
      }
      setMessage("Email успешно подтвержден! Переходим в личный кабинет...");
      goDashboard();
      return;
    }

    const alreadyVerified = searchParams.get("already");
    if (alreadyVerified === "true") {
      setStatus("success");
      setMessage("Email уже был подтвержден ранее. Войдите в систему, используя ваш email и пароль.");
      return;
    }

    if (!token && status === "loading") {
      const tick = async () => {
        const result = await pollEmailVerified();
        if (result === "dashboard") goDashboard();
        else if (result === "login") goLogin();
      };
      tick();
      const id = setInterval(tick, 5000);
      return () => clearInterval(id);
    }

    if (isVerifying || status !== "loading") return;

    if (!token) {
      setStatus("error");
      setMessage("Токен подтверждения не предоставлен");
      return;
    }

    setIsVerifying(true);
    setMessage("Проверяем токен подтверждения...");
    window.location.href = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  }, [
    token,
    isVerifying,
    status,
    searchParams,
    waiting,
    goDashboard,
    goLogin,
  ]);

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {(status === "loading" || status === "waiting") && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Подтверждение email..."}
            {status === "waiting" && "Ожидаем подтверждения email"}
            {status === "success" && "Email подтвержден!"}
            {status === "error" && "Ошибка подтверждения"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Пожалуйста, подождите"}
            {status === "waiting" && "Проверьте вашу почту и перейдите по ссылке в письме"}
            {status === "success" && "Ваш email адрес успешно подтвержден"}
            {status === "error" && "Не удалось подтвердить email адрес"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-700">{message}</p>

          {status === "success" && (
            <div className="space-y-3">
              {searchParams.get("already") === "true" ||
              searchParams.get("from") === "other" ? (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Для входа в личный кабинет используйте ваш email и пароль.
                  </p>
                  <Button onClick={() => router.push("/login")} className="w-full">
                    Перейти к входу
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Ваш email адрес успешно подтвержден.
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Вы будете перенаправлены в личный кабинет через пару секунд...
                  </p>
                  <Button onClick={goDashboard} className="w-full">
                    Перейти в личный кабинет сейчас
                  </Button>
                </>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Не получили письмо?
                    </p>
                    <p className="text-sm text-blue-800">
                      Проверьте папку «Спам» или запросите повторную отправку на странице входа.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="flex-1"
                >
                  Перейти к входу
                </Button>
                <Button onClick={() => router.push("/register")} className="flex-1">
                  Регистрация
                </Button>
              </div>
            </div>
          )}

          {status === "waiting" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-blue-800 mb-2">
                  Мы отправили письмо с подтверждением на ваш email адрес.
                </p>
                <p className="text-sm text-blue-700">
                  Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации
                  аккаунта.
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center">
                После подтверждения вы будете автоматически перенаправлены в личный кабинет...
              </p>
            </div>
          )}

          {status === "loading" && (
            <div className="text-center">
              <p className="text-sm text-gray-600">Проверяем токен подтверждения...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
