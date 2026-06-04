"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Lock,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  dashboardButtonClass,
  dashboardPageClass,
} from "@/components/dashboard/dashboard-styles";

const settingsInputClass =
  "h-10 w-full rounded-none border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";

const settingsLabelClass = "text-sm font-medium text-slate-700";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/settings");
      return;
    }
    if (status === "authenticated" && session?.user) {
      fetchProfile();
    }
  }, [status, session, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Профиль успешно обновлён");
        await update();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Ошибка при обновлении профиля");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Новые пароли не совпадают");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Пароль успешно изменён");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Ошибка при изменении пароля");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={cn(dashboardPageClass, "container px-4 py-12")}>
        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm">Загрузка…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div
      className={cn(
        dashboardPageClass,
        "container max-w-3xl px-4 py-8 [&_button]:!rounded-none [&_input]:!rounded-none"
      )}
    >
      <div className="mb-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(dashboardButtonClass, "h-9 border-slate-200")}
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Настройки
        </h1>
        <p className="text-sm text-slate-600">
          Управление данными вашего аккаунта
        </p>
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-none border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 flex items-start gap-3 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-800">{success}</p>
        </div>
      ) : null}

      <section className="pb-10">
        <div className="mb-6 flex items-start gap-3">
          <User className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.75} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Личные данные</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Обновите информацию о себе
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className={settingsLabelClass}>
              ФИО
            </Label>
            <Input
              id="name"
              type="text"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              placeholder="Иванов Иван Иванович"
              className={settingsInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className={settingsLabelClass}>
              Email
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.75}
              />
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className={cn(
                  settingsInputClass,
                  "border-slate-200 bg-slate-50 pl-9 text-slate-500 shadow-none focus-visible:ring-0"
                )}
              />
            </div>
            <p className="text-xs text-slate-500">Email нельзя изменить</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className={settingsLabelClass}>
              Телефон
            </Label>
            <Input
              id="phone"
              type="tel"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
              placeholder="+7 (999) 123-45-67"
              className={settingsInputClass}
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className={cn(
              dashboardButtonClass,
              "mt-2 h-auto w-fit rounded-none bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить изменения
              </>
            )}
          </Button>
        </form>
      </section>

      <div className="border-t border-slate-100" aria-hidden />

      <section className="pt-10">
        <div className="mb-6 flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.75} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Смена пароля</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Измените пароль для входа в систему
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className={settingsLabelClass}>
              Текущий пароль
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              placeholder="Введите текущий пароль"
              required
              className={settingsInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className={settingsLabelClass}>
              Новый пароль
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              placeholder="Минимум 6 символов"
              required
              minLength={6}
              className={settingsInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className={settingsLabelClass}>
              Подтвердите новый пароль
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="Повторите новый пароль"
              required
              minLength={6}
              className={settingsInputClass}
            />
          </div>

          <Button
            type="submit"
            disabled={changingPassword}
            variant="outline"
            className={cn(
              dashboardButtonClass,
              "mt-2 h-auto w-fit rounded-none border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
            )}
          >
            {changingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Изменение…
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Изменить пароль
              </>
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
