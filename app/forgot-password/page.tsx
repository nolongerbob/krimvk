"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { siteFieldClass, sitePrimaryBtnClass, siteOutlineBtnClass } from "@/components/site/site-styles";
import { SitePageShell } from "@/components/site/SitePageShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Если указанный email существует в системе, на него будет отправлено письмо с инструкциями по восстановлению пароля.");
      } else {
        setError(data.error || "Ошибка при отправке запроса");
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SitePageShell className="flex min-h-[calc(100vh-8rem)] items-center justify-center" containerClassName="flex justify-center">
      <DashboardCard className="w-full max-w-md">
        <DashboardCardBody className="text-center">
          <div className="mb-4 flex justify-center">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">Восстановление пароля</h2>
          <p className="mb-6 text-sm text-slate-600">
            Введите ваш email адрес, и мы отправим вам инструкции по восстановлению пароля
          </p>
          {message ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-none p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className={`w-full ${siteOutlineBtnClass}`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться к входу
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-none">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email адрес</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className={siteFieldClass}
                />
              </div>

              <Button type="submit" className={`w-full ${sitePrimaryBtnClass}`} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Отправить инструкции
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Вернуться к входу
                </Link>
              </div>
            </form>
          )}
        </DashboardCardBody>
      </DashboardCard>
    </SitePageShell>
  );
}
