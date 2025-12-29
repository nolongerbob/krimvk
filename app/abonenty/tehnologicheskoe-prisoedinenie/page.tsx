"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  MapPin,
  Building,
  Phone,
  Mail,
  User,
  FileCheck,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import Link from "next/link";
import { AddressInput } from "@/components/AddressInput";

export default function TehnologicheskoePrisoedineniePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    fullName: session?.user?.name || "",
    phone: "",
    email: session?.user?.email || "",
    address: "",
    objectType: "",
    objectPurpose: "",
    plannedLoad: "",
    floors: "",
    description: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (status !== "authenticated") {
      router.push("/login?callbackUrl=/abonenty/tehnologicheskoe-prisoedinenie");
      return;
    }

    try {
      // Сначала загружаем файлы, если есть
      let fileUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formDataFiles = new FormData();
          formDataFiles.append("file", file);

          const uploadResponse = await fetch("/api/applications/upload", {
            method: "POST",
            body: formDataFiles,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            if (uploadData.url) {
              fileUrls.push(uploadData.url);
            }
          }
        }
      }

      // Создаем заявку
      // Ищем услугу "Технологическое присоединение" или создаем заявку с описанием
      const description = `Заявка на технологическое присоединение

Личные данные:
- ФИО: ${formData.fullName}
- Телефон: ${formData.phone}
- Email: ${formData.email}

Данные объекта:
- Адрес: ${formData.address}
- Тип объекта: ${formData.objectType}
- Назначение: ${formData.objectPurpose}
- Этажность: ${formData.floors || "не указано"}
- Планируемая нагрузка: ${formData.plannedLoad || "не указано"} м³/сутки

Прикрепленные документы: ${fileUrls.length} файл(ов)
${fileUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}

Дополнительная информация:
${formData.description || "не указано"}`;

      // Сначала пытаемся найти услугу "Технологическое присоединение"
      const servicesResponse = await fetch("/api/services");
      let serviceId = null;
      
      if (servicesResponse.ok) {
        const services = await servicesResponse.json();
        const techService = services.find((s: any) => 
          s.title?.toLowerCase().includes("технологическое") || 
          s.title?.toLowerCase().includes("присоединение")
        );
        if (techService) {
          serviceId = techService.id;
        }
      }

      // Если услуга не найдена, используем специальный маркер
      const response = await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: serviceId || "tehnologicheskoe-prisoedinenie",
          address: formData.address,
          phone: formData.phone || session?.user?.email,
          description: description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/applications?created=true");
        }, 2000);
      } else {
        setError(data.error || "Ошибка при отправке заявки");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Произошла ошибка. Попробуйте позже.");
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="container py-12 px-4 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 max-w-6xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Технологическое присоединение
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Подайте заявку на подключение вашего объекта к системам водоснабжения и водоотведения
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Левая колонка - Описание процесса */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Процесс присоединения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Получение ТУ</p>
                    <p className="text-xs text-gray-600">Технические условия подключения</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Договор подключения</p>
                    <p className="text-xs text-gray-600">Заключение договора</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Проектирование</p>
                    <p className="text-xs text-gray-600">Разработка проекта</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Строительство</p>
                    <p className="text-xs text-gray-600">Прокладка сетей</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600">5</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Врезка и пуск</p>
                    <p className="text-xs text-gray-600">Подключение к сетям</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-cyan-600">6</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Абонентский договор</p>
                    <p className="text-xs text-gray-600">Заключение договора</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link href="/abonenty/platy-uslugi/podklyuchenie">
                  <Button variant="outline" className="w-full" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Подробная инструкция
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm mb-3">Необходимые документы:</h4>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-3 w-3 mt-0.5 text-blue-600" />
                    <span>Правоустанавливающие документы на участок</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-3 w-3 mt-0.5 text-blue-600" />
                    <span>Ситуационный план участка</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-3 w-3 mt-0.5 text-blue-600" />
                    <span>Расчет планируемой нагрузки</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-3 w-3 mt-0.5 text-blue-600" />
                    <span>Топографическая карта (М 1:500)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs text-blue-900 mb-1">Важно</p>
                      <p className="text-xs text-blue-800">
                        После подачи заявки с вами свяжется специалист для уточнения деталей
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка - Форма */}
        <div className="lg:col-span-2">
          {success ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Заявка успешно отправлена!
                </h2>
                <p className="text-green-700 mb-4">
                  Ваша заявка принята в обработку. С вами свяжутся в ближайшее время.
                </p>
                <Button asChild>
                  <Link href="/dashboard/applications">
                    Перейти к заявкам
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Заявка на технологическое присоединение</CardTitle>
                <CardDescription>
                  Заполните форму для подачи заявки на подключение к системам водоснабжения и водоотведения
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Личные данные */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Личные данные
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">
                          ФИО <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          placeholder="Иванов Иван Иванович"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Телефон <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+7 (978) 123-45-67"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="example@mail.ru"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Данные объекта */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      Данные объекта
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        Адрес объекта <span className="text-red-500">*</span>
                      </Label>
                      <AddressInput
                        value={formData.address}
                        onChange={(value) =>
                          setFormData({ ...formData, address: value })
                        }
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="objectType">
                          Тип объекта <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.objectType}
                          onValueChange={(value) =>
                            setFormData({ ...formData, objectType: value })
                          }
                          required
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип объекта" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">Жилой дом</SelectItem>
                            <SelectItem value="apartment">Квартира</SelectItem>
                            <SelectItem value="commercial">Коммерческий объект</SelectItem>
                            <SelectItem value="industrial">Промышленный объект</SelectItem>
                            <SelectItem value="other">Другое</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="floors">Этажность</Label>
                        <Input
                          id="floors"
                          type="number"
                          min="1"
                          value={formData.floors}
                          onChange={(e) =>
                            setFormData({ ...formData, floors: e.target.value })
                          }
                          placeholder="Например: 2"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="objectPurpose">
                        Назначение объекта <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.objectPurpose}
                        onValueChange={(value) =>
                          setFormData({ ...formData, objectPurpose: value })
                        }
                        required
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите назначение" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Жилое</SelectItem>
                          <SelectItem value="commercial">Коммерческое</SelectItem>
                          <SelectItem value="industrial">Промышленное</SelectItem>
                          <SelectItem value="public">Общественное</SelectItem>
                          <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plannedLoad">
                        Планируемая нагрузка (м³/сутки)
                      </Label>
                      <Input
                        id="plannedLoad"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.plannedLoad}
                        onChange={(e) =>
                          setFormData({ ...formData, plannedLoad: e.target.value })
                        }
                        placeholder="Например: 5.5"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500">
                        Если не знаете точное значение, оставьте пустым — специалист поможет рассчитать
                      </p>
                    </div>
                  </div>

                  {/* Документы */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Документы
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="documents">Прикрепить документы</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Перетащите файлы сюда или нажмите для выбора
                        </p>
                        <Input
                          id="documents"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("documents")?.click()}
                          disabled={isSubmitting}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Выбрать файлы
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          PDF, DOC, DOCX, JPG, PNG (макс. 10 МБ каждый)
                        </p>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="text-sm text-gray-700">
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} МБ)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                disabled={isSubmitting}
                              >
                                Удалить
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Дополнительная информация */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      Дополнительная информация
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="description">Комментарий</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Укажите любую дополнительную информацию, которая может быть полезна при рассмотрении заявки..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Кнопка отправки */}
                  <div className="pt-4 border-t">
                    {status !== "authenticated" ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Для подачи заявки необходимо{" "}
                          <Link href="/login" className="underline font-medium">
                            войти в систему
                          </Link>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Отправка...
                          </>
                        ) : (
                          <>
                            Отправить заявку
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

