"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function EmergencyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    phone: session?.user?.phone || "",
    email: session?.user?.email || "",
    address: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!formData.phone.trim()) {
      setError("Укажите номер телефона");
      setIsSubmitting(false);
      return;
    }

    if (!formData.address.trim()) {
      setError("Укажите адрес аварии");
      setIsSubmitting(false);
      return;
    }

    if (!formData.description.trim()) {
      setError("Опишите проблему");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: session?.user?.id || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(data.error || "Ошибка при отправке сообщения");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error submitting emergency report:", err);
      setError("Произошла ошибка. Попробуйте позже.");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container py-12 px-4 max-w-2xl">
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <CardTitle className="text-2xl">Сообщение отправлено</CardTitle>
            </div>
            <CardDescription>
              Ваше сообщение об аварии успешно отправлено. Наши специалисты свяжутся с вами в ближайшее время.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Если ситуация критическая, звоните в аварийно-диспетчерскую службу:{" "}
                  <a href="tel:+79787013050" className="font-medium text-red-600 hover:underline">
                    +7 (978) 701-30-50
                  </a>{" "}
                  или{" "}
                  <a href="tel:+79787460990" className="font-medium text-red-600 hover:underline">
                    +7 (978) 746-09-90
                  </a>
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/">Вернуться на главную</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 max-w-2xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Сообщение об аварии</h1>
        <p className="text-gray-600">
          Заполните форму для сообщения об аварийной ситуации. Мы обработаем ваше сообщение в кратчайшие сроки.
        </p>
      </div>

      <Card className="animate-fade-in animate-delay-100">
        <CardHeader>
          <CardTitle>Информация об аварии</CardTitle>
          <CardDescription>Укажите контактные данные и опишите проблему</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Имя (необязательно)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <Label htmlFor="phone">
                  Телефон <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (978) 123-45-67"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email (необязательно)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="address">
                Адрес аварии <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                required
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Укажите точный адрес, где произошла авария"
              />
            </div>

            <div>
              <Label htmlFor="description">
                Описание проблемы <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Опишите подробно, что произошло..."
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Внимание!</strong> Если ситуация критическая и требует немедленного вмешательства, звоните в
                аварийно-диспетчерскую службу:{" "}
                <a href="tel:+79787013050" className="font-medium text-red-600 hover:underline">
                  +7 (978) 701-30-50
                </a>{" "}
                или{" "}
                <a href="tel:+79787460990" className="font-medium text-red-600 hover:underline">
                  +7 (978) 746-09-90
                </a>
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Отправка..." : "Отправить сообщение"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


