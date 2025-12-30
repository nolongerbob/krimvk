"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  Settings,
  FileText,
  Upload,
  Download,
  Printer,
} from "lucide-react";
import { AddressInput } from "@/components/AddressInput";

type PersonType = "individual" | "legal" | null;
type Step = "type" | "abonent" | "object" | "params" | "documents";

export default function BecomeSubscriberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("type");
  const [personType, setPersonType] = useState<PersonType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const applicationRef = useRef<HTMLDivElement>(null);

  // Данные формы
  const [formData, setFormData] = useState({
    // Информация об абоненте (физическое лицо)
    lastName: "",
    firstName: "",
    middleName: "",
    birthDate: "",
    registrationAddress: "",
    passportSeries: "",
    passportNumber: "",
    passportIssuedBy: "",
    passportIssueDate: "",
    passportDivisionCode: "",
    phone: "",
    // Информация об объекте
    objectType: "",
    objectPurpose: "",
    cadastralNumber: "",
    objectAddress: "",
    area: "",
    // Параметры присоединения
    connectionTypeWater: false,
    connectionTypeSewerage: false,
    connectionMethod: "",
    requestedLoad: "",
    waterSupplyRestriction: false,
    privateNetworkPermission: false,
    wellType: "",
    connectionPointLocation: "",
    pipeDiameter: "",
    pipeMaterial: "",
    // Дополнительные поля для официального заявления
    inn: "",
    snils: "",
    constructionType: "", // новое строительство, реконструкция, модернизация
    resourceType: "", // получение питьевой или технической воды, сброс хозяйственно-бытовых, сточных вод
    objectHeight: "",
    objectFloors: "",
    networkLength: "",
    plannedCommissioningDate: "",
    maxWaterConsumptionLps: "",
    maxWaterConsumptionM3h: "",
    maxWaterConsumptionM3day: "",
    fireExtinguishingExternal: "",
    fireExtinguishingInternal: "",
    fireHydrantsCount: "",
    fireExtinguishingAutomatic: "",
    wastewaterLps: "",
    wastewaterM3h: "",
    wastewaterM3day: "",
    notificationMethod: "", // email, почта, иной способ
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/stat-abonentom");
      return;
    }

    if (status === "authenticated" && session?.user) {
      loadUserProfile();
    }
  }, [status, session, router]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        // Автозаполнение ФИО из профиля
        if (user?.name) {
          const nameParts = user.name.trim().split(/\s+/);
          setFormData((prev) => ({
            ...prev,
            lastName: nameParts[0] || "",
            firstName: nameParts[1] || "",
            middleName: nameParts[2] || "",
            phone: user.phone || "",
          }));
        }
        
        // Автозаполнение телефона
        if (user?.phone && !formData.phone) {
          setFormData((prev) => ({
            ...prev,
            phone: user.phone,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const steps = [
    { id: "type", label: "Тип лица", icon: User },
    { id: "abonent", label: "Личные данные", icon: User },
    { id: "object", label: "Объект", icon: Building },
    { id: "params", label: "Параметры", icon: Settings },
    { id: "documents", label: "Документы", icon: FileText },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex((s) => s.id === currentStep);
  };

  const canGoNext = () => {
    if (currentStep === "type") return personType !== null;
    if (currentStep === "abonent" && personType === "individual") {
      return (
        formData.lastName &&
        formData.firstName &&
        formData.phone &&
        formData.passportSeries &&
        formData.passportNumber &&
        formData.passportIssuedBy &&
        formData.passportIssueDate
      );
    }
    if (currentStep === "object") {
      return formData.objectType && formData.objectAddress;
    }
    if (currentStep === "params") {
      return (
        (formData.connectionTypeWater || formData.connectionTypeSewerage) &&
        formData.connectionMethod &&
        (formData.connectionMethod !== "with-well" || formData.wellType)
      );
    }
    if (currentStep === "documents") {
      // На последнем шаге можно отправить даже без документов, но лучше проверить наличие подписанного заявления
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      setError("Заполните все обязательные поля");
      return;
    }
    setError(null);
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as Step);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as Step);
    }
  };

  const handleDownloadApplication = async () => {
    if (!applicationRef.current) {
      setError("Ошибка: элемент заявления не найден");
      return;
    }

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Показываем заявление для генерации
      const hiddenElement = applicationRef.current;
      const originalClasses = hiddenElement.className;
      const originalStyle = hiddenElement.style.cssText;
      
      // Устанавливаем стили для правильной генерации
      hiddenElement.className = "block bg-white";
      hiddenElement.style.width = "210mm";
      hiddenElement.style.minHeight = "297mm";
      hiddenElement.style.padding = "20mm";
      hiddenElement.style.fontFamily = "Times New Roman, serif";
      hiddenElement.style.fontSize = "11pt";
      hiddenElement.style.lineHeight = "1.5";
      hiddenElement.style.color = "#000000";

      // Ждем немного, чтобы стили применились
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(hiddenElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: hiddenElement.scrollWidth,
        height: hiddenElement.scrollHeight,
        windowWidth: hiddenElement.scrollWidth,
        windowHeight: hiddenElement.scrollHeight,
      });

      // Восстанавливаем оригинальные стили
      hiddenElement.className = originalClasses;
      hiddenElement.style.cssText = originalStyle;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png", 1.0);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Вычисляем соотношение для масштабирования
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      
      // Центрируем изображение
      const xOffset = (pdfWidth - imgScaledWidth) / 2;
      const yOffset = (pdfHeight - imgScaledHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgScaledWidth, imgScaledHeight);
      
      const fileName = `zayavlenie_TU_${formData.lastName}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(error instanceof Error ? error.message : "Ошибка при генерации PDF. Попробуйте использовать кнопку 'Печать'.");
    }
  };

  const handlePrintApplication = () => {
    window.print();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Загружаем файлы, если есть
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

      const description = `Заявка на подключение к водоснабжению/водоотведению

Тип лица: ${personType === "individual" ? "Физическое лицо" : "Юридическое лицо"}

Информация об абоненте:
- ФИО: ${formData.lastName} ${formData.firstName} ${formData.middleName}
- Дата рождения: ${formData.birthDate || "не указано"}
- Адрес регистрации: ${formData.registrationAddress}
- Паспорт: ${formData.passportSeries} ${formData.passportNumber}
- Выдан: ${formData.passportIssuedBy}
- Дата выдачи: ${formData.passportIssueDate || "не указано"}
- Код подразделения: ${formData.passportDivisionCode}
- Телефон: ${formData.phone}

Информация об объекте:
- Тип объекта: ${formData.objectType}
- Назначение: ${formData.objectPurpose}
- Кадастровый номер: ${formData.cadastralNumber}
- Адрес: ${formData.objectAddress}
- Площадь: ${formData.area} кв.м

Параметры присоединения:
- Водопровод: ${formData.connectionTypeWater ? "Да" : "Нет"}
- Канализация: ${formData.connectionTypeSewerage ? "Да" : "Нет"}
- Тип подключения: ${formData.connectionMethod === "with-well" ? "с колодцем" : "по протяженности"}
${formData.connectionMethod === "with-well" ? `- Тип колодца: ${formData.wellType === "existing" ? "Существующий" : "Проектируемый"}` : ""}
- Запрошенная нагрузка: ${formData.requestedLoad || "не указано"} м³
- Ограничение водоснабжения: ${formData.waterSupplyRestriction ? "Да" : "Нет"}
- Разрешение на подключение к частным сетям: ${formData.privateNetworkPermission ? "Да" : "Нет"}
- Расположение точки подключения: ${formData.connectionPointLocation || "не указано"}
- Диаметр водопровода: ${formData.pipeDiameter || "не указано"} мм
- Материал труб: ${formData.pipeMaterial || "не указано"}

Прикрепленные документы: ${fileUrls.length} файл(ов)
${fileUrls.map((url: string, i: number) => `${i + 1}. ${url}`).join("\n")}
`;

      const response = await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: "tehnologicheskoe-prisoedinenie",
          address: formData.objectAddress,
          phone: formData.phone,
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

  if (status === "loading" || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
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
              <a href="/dashboard/applications">
                Перейти к заявкам
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Стать абонентом
        </h1>
        <p className="text-xl text-gray-600">
          Заполните форму для подключения к системам водоснабжения и водоотведения
        </p>
      </div>

      {/* Прогресс-бар */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              const isAccessible = index === 0 || getCurrentStepIndex() >= index - 1;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <button
                      onClick={() => {
                        if (isAccessible) {
                          setCurrentStep(step.id as Step);
                          setError(null);
                        }
                      }}
                      disabled={!isAccessible}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                        isActive
                          ? "bg-blue-600 text-white scale-110"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : isAccessible
                          ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </button>
                    <span
                      className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                        isActive ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Форма */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {steps.find((s) => s.id === currentStep)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Шаг 1: Выбор типа лица */}
          {currentStep === "type" && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-6">
                Выберите тип лица для подключения
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => {
                    setPersonType("individual");
                    setError(null);
                  }}
                  className={`p-8 border-2 rounded-lg text-left transition-all ${
                    personType === "individual"
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <User className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Физическое лицо</h3>
                  <p className="text-gray-600">
                    Для частных лиц, владельцев жилых домов и квартир
                  </p>
                </button>
                <button
                  onClick={() => {
                    setPersonType("legal");
                    setError(null);
                  }}
                  className={`p-8 border-2 rounded-lg text-left transition-all ${
                    personType === "legal"
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Building className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Юридическое лицо</h3>
                  <p className="text-gray-600">
                    Для организаций, предприятий и коммерческих объектов
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Шаг 2: Личные данные (физическое лицо) */}
          {currentStep === "abonent" && personType === "individual" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Фамилия <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                    placeholder="Иванов"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Имя <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    placeholder="Иван"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Отчество</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({ ...formData, middleName: e.target.value })
                    }
                    placeholder="Иванович"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Дата рождения</Label>
                <Input
                  id="birthDate"
                  type="text"
                  value={formData.birthDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9.]/g, ''); // Только цифры и точки
                    // Автоматически добавляем точки
                    if (value.length === 2 && !value.includes('.')) {
                      value = value + '.';
                    } else if (value.length === 5 && value.split('.').length === 2) {
                      value = value + '.';
                    }
                    setFormData({ ...formData, birthDate: value });
                  }}
                  placeholder="16.04.2006"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500">Формат: дд.мм.гггг (например: 16.04.2006)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationAddress">
                  Адрес регистрации <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="registrationAddress"
                  type="text"
                  value={formData.registrationAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationAddress: e.target.value })
                  }
                  placeholder="Введите адрес регистрации как указано в паспорте"
                  required
                />
                <p className="text-xs text-gray-500">Укажите адрес регистрации точно как в паспорте</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-4">Паспортные данные</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passportSeries">
                      Серия <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="passportSeries"
                      value={formData.passportSeries}
                      onChange={(e) =>
                        setFormData({ ...formData, passportSeries: e.target.value })
                      }
                      required
                      maxLength={4}
                      placeholder="1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">
                      Номер <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="passportNumber"
                      value={formData.passportNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, passportNumber: e.target.value })
                      }
                      required
                      maxLength={6}
                      placeholder="123456"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="passportIssuedBy">
                    Выдан <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="passportIssuedBy"
                    value={formData.passportIssuedBy}
                    onChange={(e) =>
                      setFormData({ ...formData, passportIssuedBy: e.target.value })
                    }
                    rows={2}
                    required
                    placeholder="Например: УФМС России по Республике Крым"
                  />
                </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="passportIssueDate">
                              Дата выдачи <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="passportIssueDate"
                              type="text"
                              value={formData.passportIssueDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9.]/g, ''); // Только цифры и точки
                                // Автоматически добавляем точки
                                if (value.length === 2 && !value.includes('.')) {
                                  value = value + '.';
                                } else if (value.length === 5 && value.split('.').length === 2) {
                                  value = value + '.';
                                }
                                setFormData({ ...formData, passportIssueDate: value });
                              }}
                              placeholder="20.03.2015"
                              maxLength={10}
                              required
                            />
                            <p className="text-xs text-gray-500">Формат: дд.мм.гггг (например: 20.03.2015)</p>
                          </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportDivisionCode">Код подразделения</Label>
                    <Input
                      id="passportDivisionCode"
                      value={formData.passportDivisionCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passportDivisionCode: e.target.value,
                        })
                      }
                      maxLength={6}
                      placeholder="123-456"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="phone">
                  Телефон для связи <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  placeholder="+7 (978) 123-45-67"
                />
                <p className="text-xs text-gray-500">
                  Автозаполнено из профиля
                </p>
              </div>
            </div>
          )}

          {/* Шаг 3: Информация об объекте */}
          {currentStep === "object" && personType === "individual" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="objectType">
                    Объект <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="objectType"
                    value={formData.objectType}
                    onChange={(e) =>
                      setFormData({ ...formData, objectType: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите тип объекта</option>
                    <option value="residential">Жилой дом</option>
                    <option value="apartment">Квартира</option>
                    <option value="commercial">Коммерческий объект</option>
                    <option value="industrial">Промышленный объект</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectPurpose">Назначение объекта</Label>
                  <select
                    id="objectPurpose"
                    value={formData.objectPurpose}
                    onChange={(e) =>
                      setFormData({ ...formData, objectPurpose: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите назначение</option>
                    <option value="residential">Жилое</option>
                    <option value="commercial">Коммерческое</option>
                    <option value="industrial">Промышленное</option>
                    <option value="public">Общественное</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cadastralNumber">Кадастровый номер</Label>
                <Input
                  id="cadastralNumber"
                  value={formData.cadastralNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, cadastralNumber: e.target.value })
                  }
                  placeholder="XX:XX:XXXXXXXX:XX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectAddress">
                  Адрес объекта <span className="text-red-500">*</span>
                </Label>
                <AddressInput
                  value={formData.objectAddress}
                  onChange={(value: string) =>
                    setFormData({ ...formData, objectAddress: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Площадь объекта (кв. метров)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Шаг 4: Параметры присоединения */}
          {currentStep === "params" && personType === "individual" && (
            <div className="space-y-6">
              <div>
                <Label className="mb-4 block">
                  Вид подключения <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.connectionTypeWater}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          connectionTypeWater: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <span>Водопровод</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.connectionTypeSewerage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          connectionTypeSewerage: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <span>Канализация</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Тип подключения <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="connectionMethod"
                      value="by-length"
                      checked={formData.connectionMethod === "by-length"}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          connectionMethod: e.target.value,
                          wellType: "", // Сбрасываем тип колодца при выборе "по протяженности"
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <span>по протяженности</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="connectionMethod"
                      value="with-well"
                      checked={formData.connectionMethod === "with-well"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          connectionMethod: e.target.value,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>с колодцем</span>
                  </label>
                </div>
              </div>

              {formData.connectionMethod === "with-well" && (
                <div className="space-y-2">
                  <Label>
                    Колодец <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="wellType"
                        value="existing"
                        checked={formData.wellType === "existing"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            wellType: e.target.value,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>Существующий</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="wellType"
                        value="planned"
                        checked={formData.wellType === "planned"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            wellType: e.target.value,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>Проектируемый</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="requestedLoad">Запрошенная нагрузка (м³)</Label>
                <Input
                  id="requestedLoad"
                  type="number"
                  step="0.1"
                  value={formData.requestedLoad}
                  onChange={(e) =>
                    setFormData({ ...formData, requestedLoad: e.target.value })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.waterSupplyRestriction}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waterSupplyRestriction: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                  <span>Ограничение водоснабжения</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.privateNetworkPermission}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        privateNetworkPermission: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                  <span>Требуется разрешение на подключение к частным сетям</span>
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connectionPointLocation">
                  Расположение точки подключения
                </Label>
                <Textarea
                  id="connectionPointLocation"
                  value={formData.connectionPointLocation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      connectionPointLocation: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Опишите расположение точки подключения..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pipeDiameter">Диаметр водопровода (мм)</Label>
                  <Input
                    id="pipeDiameter"
                    type="number"
                    value={formData.pipeDiameter}
                    onChange={(e) =>
                      setFormData({ ...formData, pipeDiameter: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pipeMaterial">Материал труб</Label>
                  <select
                    id="pipeMaterial"
                    value={formData.pipeMaterial}
                    onChange={(e) =>
                      setFormData({ ...formData, pipeMaterial: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите материал</option>
                    <option value="PE">ПЭ (Полиэтилен)</option>
                    <option value="steel">Сталь</option>
                    <option value="asbestos">Асбестоцемент</option>
                    <option value="cast-iron">Чугун</option>
                    <option value="ceramic">Керамика</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Шаг 5: Документы */}
          {currentStep === "documents" && personType === "individual" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Инструкция</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Скачайте заявление на выдачу технических условий</li>
                      <li>Распечатайте заявление</li>
                      <li>Подпишите заявление</li>
                      <li>Отсканируйте подписанное заявление</li>
                      <li>Отсканируйте копии паспорта (страницы с фото и пропиской)</li>
                      <li>Загрузите все документы ниже</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Заявление на выдачу ТУ */}
              <Card className="border-2 border-dashed border-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Заявление на выдачу технических условий
                  </CardTitle>
                  <CardDescription>
                    Заявление автоматически заполнено вашими данными
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Предпросмотр заявления */}
                  <div className="border rounded-lg p-6 bg-white mb-4 max-h-[600px] overflow-y-auto">
                    <div className="space-y-3 text-xs" style={{ fontFamily: "Times New Roman, serif", lineHeight: "1.5" }}>
                      <div className="text-right mb-2">
                        <p className="text-xs">Приложение №1</p>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-xs mb-2 leading-relaxed">к Правилам подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения</p>
                        <h3 className="text-base font-bold mb-1 mt-3">ЗАПРОС</h3>
                        <p className="text-sm">о выдаче технических условий на подключение</p>
                        <p className="text-sm">(технологическое присоединение) к централизованным системам</p>
                        <p className="text-sm">холодного водоснабжения и (или) водоотведения</p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="mb-1"><strong>1. Наименование исполнителя, которому направлен запрос</strong></p>
                          <p className="ml-4">ООО «Крымская Водная Компания»</p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>2. Сведения о лице, обратившемся с запросом</strong></p>
                          <p className="ml-4 border-b border-black min-h-[60px]">
                            {formData.lastName} {formData.firstName} {formData.middleName}
                            {formData.birthDate && `, дата рождения: ${formData.birthDate}`}
                            {formData.passportSeries && formData.passportNumber && `, паспорт серия ${formData.passportSeries} № ${formData.passportNumber}`}
                            {formData.passportIssuedBy && `, выдан ${formData.passportIssuedBy}`}
                            {formData.passportIssueDate && `, дата выдачи ${formData.passportIssueDate}`}
                            {formData.passportDivisionCode && `, код подразделения ${formData.passportDivisionCode}`}
                            {formData.inn && `, ИНН ${formData.inn}`}
                            {formData.snils && `, СНИЛС ${formData.snils}`}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>3. Контактные данные лица, обратившегося за выдачей технических условий</strong></p>
                          <p className="ml-4 border-b border-black min-h-[40px]">
                            Адрес регистрации: {formData.registrationAddress || "_________________"}
                            {formData.phone && `, телефон: ${formData.phone}`}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>4. Основания обращения с запросом о выдаче технических условий:</strong></p>
                          <p className="ml-4 border-b border-black min-h-[40px]">
                            Правообладатель земельного участка
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>5. В связи с</strong> {formData.constructionType || "_________________"} <strong>прошу выдать технические условия на подключение (технологическое присоединение)</strong></p>
                          <p className="ml-4 mb-1">объекта капитального строительства, водопроводных и (или) канализационных сетей, иного объекта, не относящегося к объектам капитального строительства (указать нужное):</p>
                          <p className="ml-4 border-b border-black min-h-[30px]">
                            {formData.objectType === "residential" ? "Жилой дом" : formData.objectType === "apartment" ? "Квартира" : formData.objectType === "commercial" ? "Коммерческий объект" : formData.objectType === "industrial" ? "Промышленный объект" : "_________________"}
                          </p>
                          <p className="ml-4 mt-1">расположенного (проектируемого) по адресу:</p>
                          <p className="ml-4 border-b border-black min-h-[30px]">
                            {formData.objectAddress || "_________________"}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>6. Требуется подключение к централизованной системе</strong></p>
                          <p className="ml-4 border-b border-black min-h-[30px]">
                            {formData.connectionTypeWater && "холодного водоснабжения"} {formData.connectionTypeWater && formData.connectionTypeSewerage && ", "} {formData.connectionTypeSewerage && "водоотведения"}
                            {!formData.connectionTypeWater && !formData.connectionTypeSewerage && "_________________"}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>7. Необходимые виды ресурсов или услуг, планируемых к получению через централизованную систему</strong></p>
                          <p className="ml-4 border-b border-black min-h-[30px]">
                            {formData.resourceType || "получение питьевой воды, сброс хозяйственно-бытовых сточных вод"}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>8. Информация о предельных параметрах разрешенного строительства (реконструкции) подключаемых объектов, соответствующих указанному земельному участку</strong></p>
                          <p className="ml-4 border-b border-black min-h-[30px]">
                            {formData.objectHeight && `Высота: ${formData.objectHeight} м, `}
                            {formData.objectFloors && `Этажность: ${formData.objectFloors}, `}
                            {formData.networkLength && `Протяженность сети: ${formData.networkLength} м, `}
                            {formData.pipeDiameter && `Диаметр: ${formData.pipeDiameter} мм`}
                            {!formData.objectHeight && !formData.objectFloors && !formData.networkLength && !formData.pipeDiameter && "_________________"}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>9. Планируемый срок ввода в эксплуатацию подключаемого объекта</strong></p>
                          <p className="ml-4 border-b border-black min-h-[30px]">
                            {formData.plannedCommissioningDate || "_________________"}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>10. Планируемая величина максимальной необходимой мощности (нагрузки) составляет для:</strong></p>
                          <p className="ml-4">
                            потребления холодной воды {formData.maxWaterConsumptionLps || "____"} л/с, {formData.maxWaterConsumptionM3h || "____"} куб.м/час, {formData.maxWaterConsumptionM3day || "____"} куб. м./сутки,
                          </p>
                          <p className="ml-4">
                            в том числе на нужды пожаротушения - наружного {formData.fireExtinguishingExternal || "____"} л/сек, внутреннего {formData.fireExtinguishingInternal || "____"} л/сек. (количество пожарных кранов {formData.fireHydrantsCount || "____"} штук), автоматическое {formData.fireExtinguishingAutomatic || "____"} л/сек.
                          </p>
                          <p className="ml-4">
                            водоотведения {formData.wastewaterLps || "____"} л/с {formData.wastewaterM3h || "____"} куб. м/час, {formData.wastewaterM3day || "____"} куб. м/сутки
                          </p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>11. Результаты рассмотрения запроса прошу направить (выбрать один из способов уведомления)</strong></p>
                          <p className="ml-4 border-b border-black min-h-[30px]">
                            {formData.notificationMethod || "на адрес электронной почты"}
                          </p>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs">Заявитель дает согласие на обработку персональных данных для оформления процедуры выдачи ТУ и заключения ДТП.</p>
                        </div>

                        <div className="mt-6 flex justify-between items-end">
                          <div>
                            <p className="text-xs">«____»_____________20__ г.</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs mb-8">______________</p>
                            <p className="text-xs">(М.П., подпись)</p>
                            <p className="text-xs mt-2">{formData.lastName} {formData.firstName} {formData.middleName}</p>
                            <p className="text-xs">(Ф.И.О.)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Скрытое заявление для генерации PDF */}
                  <div ref={applicationRef} className="hidden print:block print:visible">
                    <div className="p-8 space-y-3 print:p-4" style={{ fontFamily: "Times New Roman, serif", fontSize: "11pt", lineHeight: "1.5" }}>
                      <div className="text-right mb-2">
                        <p className="text-xs">Приложение №1</p>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-xs mb-2">к Правилам подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения</p>
                        <h2 className="text-base font-bold mb-1 mt-3">ЗАПРОС</h2>
                        <p className="text-sm">о выдаче технических условий на подключение</p>
                        <p className="text-sm">(технологическое присоединение) к централизованным системам</p>
                        <p className="text-sm">холодного водоснабжения и (или) водоотведения</p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="mb-1"><strong>1. Наименование исполнителя, которому направлен запрос</strong></p>
                          <p className="ml-4">ООО «Крымская Водная Компания»</p>
                        </div>

                        <div>
                          <p className="mb-1"><strong>2. Сведения о лице, обратившемся с запросом</strong></p>
                          <div className="ml-4 space-y-1 mb-2">
                            <div className="border-b border-black min-h-[20px]"></div>
                            <div className="border-b border-black min-h-[20px]"></div>
                            <div className="border-b border-black min-h-[20px]"></div>
                            <div className="border-b border-black min-h-[20px]"></div>
                          </div>
                          <p className="ml-4 text-[10px] leading-tight mb-2">
                            (для органов государственной власти и местного самоуправления - полное и сокращенное наименование органа, реквизиты нормативного правового акта, в соответствии с которым осуществляется деятельность этого органа;<br/>
                            для юридических лиц - полное и сокращенное наименования, основной государственный регистрационный номер записи в Едином государственном реестре юридических лиц, идентификационный номер налогоплательщика;<br/>
                            для индивидуальных предпринимателей - наименование, основной государственный регистрационный номер записи в Едином государственном реестре индивидуальных предпринимателей, идентификационный номер налогоплательщика;<br/>
                            для физических лиц - фамилия, имя, отчество (последнее - при наличии), дата рождения, данные паспорта или иного документа, удостоверяющего личность, идентификационный номер налогоплательщика, страховой номер индивидуального лицевого счета)
                          </p>
                          <p className="ml-4 border-b border-gray-400 min-h-[20px] py-1">
                            {formData.lastName} {formData.firstName} {formData.middleName}
                            {formData.birthDate && `, дата рождения: ${formData.birthDate}`}
                            {formData.passportSeries && formData.passportNumber && `, паспорт серия ${formData.passportSeries} № ${formData.passportNumber}`}
                            {formData.passportIssuedBy && `, выдан ${formData.passportIssuedBy}`}
                            {formData.passportIssueDate && `, дата выдачи ${formData.passportIssueDate}`}
                            {formData.passportDivisionCode && `, код подразделения ${formData.passportDivisionCode}`}
                            {formData.inn && `, ИНН ${formData.inn}`}
                            {formData.snils && `, СНИЛС ${formData.snils}`}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">3. Контактные данные лица, обратившегося за выдачей технических условий</p>
                          <div className="ml-4 space-y-1 mb-2">
                            <div className="border-b border-gray-400 min-h-[20px]"></div>
                            <div className="border-b border-gray-400 min-h-[20px]"></div>
                            <div className="border-b border-gray-400 min-h-[20px]"></div>
                            <div className="border-b border-gray-400 min-h-[20px]"></div>
                          </div>
                          <p className="ml-4 text-[9px] leading-tight mb-2 text-gray-600">
                            (для органов государственной власти и местного самоуправления - место нахождения, почтовый адрес, контактный телефон, адрес электронной почты, для юридических лиц - место нахождения и адрес, указанные в Едином государственном реестре юридических лиц, почтовый адрес, фактический адрес, контактный телефон, адрес электронной почты;<br/>
                            для индивидуальных предпринимателей - адрес регистрации по месту жительства, почтовый адрес, контактный телефон, адрес электронной почты;<br/>
                            для физических лиц - адрес регистрации по месту жительства, почтовый адрес, контактный телефон, адрес электронной почты)
                          </p>
                          <p className="ml-4 border-b border-gray-400 min-h-[20px] py-1">
                            Адрес регистрации: {formData.registrationAddress || "_________________"}
                            {formData.phone && `, телефон: ${formData.phone}`}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">4. Основания обращения с запросом о выдаче технических условий:</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[40px] mb-2 py-1">
                            Правообладатель земельного участка
                          </p>
                          <p className="ml-4 text-[9px] leading-tight text-gray-600">
                            (указание, кем именно из перечня лиц, имеющих право обратиться с запросом о выдаче технических условий, указанных в пунктах 9 и 11 Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения, утвержденных постановлением Правительства Российской Федерации от 30 ноября 2021 г. № 2130 является данное лицо, а для правообладателя земельного участка также информация о праве лица на земельный участок, на который расположен подключаемый объект основания возникновения такого права)
                          </p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">5. В связи с <span className="border-b border-gray-400 inline-block min-w-[200px] px-1">{formData.constructionType || "_________________"}</span> прошу выдать технические условия на подключение (технологическое присоединение)</p>
                          <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(новым строительством, реконструкцией, модернизацией - указать нужное)</p>
                          <p className="ml-4 mb-1">объекта капитального строительства, водопроводных и (или) канализационных сетей, иного объекта, не относящегося к объектам капитального строительства (указать нужное):</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[30px] mb-1 py-1">
                            {formData.objectType === "residential" ? "Жилой дом" : formData.objectType === "apartment" ? "Квартира" : formData.objectType === "commercial" ? "Коммерческий объект" : formData.objectType === "industrial" ? "Промышленный объект" : "_________________"}
                          </p>
                          <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(наименование объекта или сетей)</p>
                          <p className="ml-4 mt-1">расположенного (проектируемого) по адресу:</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[30px] mb-1 py-1">
                            {formData.objectAddress || "_________________"}
                          </p>
                          <p className="ml-4 text-[9px] leading-tight text-gray-600">(место нахождения объекта или сетей)</p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">6. Требуется подключение к централизованной системе</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[30px] mb-1 py-1">
                            {formData.connectionTypeWater && "холодного водоснабжения"} {formData.connectionTypeWater && formData.connectionTypeSewerage && ", "} {formData.connectionTypeSewerage && "водоотведения"}
                            {!formData.connectionTypeWater && !formData.connectionTypeSewerage && "_________________"}
                          </p>
                          <p className="ml-4 text-[9px] leading-tight text-gray-600">(холодного водоснабжения, водоотведения – указать нужное)</p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">7. Необходимые виды ресурсов или услуг, планируемых к получению через централизованную систему</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[30px] mb-1 py-1">
                            {formData.resourceType || "получение питьевой воды, сброс хозяйственно-бытовых сточных вод"}
                          </p>
                          <p className="ml-4 text-[9px] leading-tight text-gray-600">(получение питьевой или технической воды, сброс хозяйственно-бытовых, сточных вод)</p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">8. Информация о предельных параметрах разрешенного строительства (реконструкции) подключаемых объектов, соответствующих указанному земельному участку</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[30px] mb-1 py-1">
                            {formData.objectHeight && `Высота: ${formData.objectHeight} м, `}
                            {formData.objectFloors && `Этажность: ${formData.objectFloors}, `}
                            {formData.networkLength && `Протяженность сети: ${formData.networkLength} м, `}
                            {formData.pipeDiameter && `Диаметр: ${formData.pipeDiameter} мм`}
                            {!formData.objectHeight && !formData.objectFloors && !formData.networkLength && !formData.pipeDiameter && "_________________"}
                          </p>
                          <p className="ml-4 text-[9px] leading-tight text-gray-600">(высота объекта, этажность, протяженность и диаметр сети)</p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">9. Планируемый срок ввода в эксплуатацию подключаемого объекта</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[30px] mb-1 py-1">
                            {formData.plannedCommissioningDate || "_________________"}
                          </p>
                          <p className="ml-4 text-[9px] leading-tight text-gray-600">(указывается при наличии соответствующей информации)</p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">10. Планируемая величина максимальной необходимой мощности (нагрузки) составляет для:</p>
                          <p className="ml-4">
                            потребления холодной воды <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.maxWaterConsumptionLps || "____"}</span> л/с, <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.maxWaterConsumptionM3h || "____"}</span> куб.м/час, <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.maxWaterConsumptionM3day || "____"}</span> куб. м./сутки,
                          </p>
                          <p className="ml-4">
                            в том числе на нужды пожаротушения - наружного <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.fireExtinguishingExternal || "____"}</span> л/сек, внутреннего <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.fireExtinguishingInternal || "____"}</span> л/сек. (количество пожарных кранов <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.fireHydrantsCount || "____"}</span> штук), автоматическое <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.fireExtinguishingAutomatic || "____"}</span> л/сек.
                          </p>
                          <p className="ml-4">
                            водоотведения <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.wastewaterLps || "____"}</span> л/с <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.wastewaterM3h || "____"}</span> куб. м/час, <span className="border-b border-gray-400 inline-block min-w-[40px] text-center px-1">{formData.wastewaterM3day || "____"}</span> куб. м/сутки
                          </p>
                        </div>

                        <div>
                          <p className="mb-1 font-semibold">11. Результаты рассмотрения запроса прошу направить (выбрать один из способов уведомления)</p>
                          <p className="ml-4 border-b border-gray-400 min-h-[30px] mb-1 py-1">
                            {formData.notificationMethod || "на адрес электронной почты"}
                          </p>
                          <p className="ml-4 text-[9px] leading-tight text-gray-600">(на адрес электронной почты, письмом посредством почтовой связи по адресу, иной способ)</p>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs">Заявитель дает согласие на обработку персональных данных для оформления процедуры выдачи ТУ и заключения ДТП.</p>
                        </div>

                        <div className="mt-4">
                          <p className="text-[9px] leading-tight text-gray-600"><strong>Примечание.</strong> К настоящему запросу прилагаются документы, предусмотренные пунктом 14 Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения, утвержденных постановлением Правительства Российской Федерации от 30 ноября 2021 г. №2130 «Об утверждении Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения и о внесении изменений и признании утратившими силу некоторых актов Правительства Российской Федерации».</p>
                        </div>

                        <div className="mt-6 flex justify-between items-end">
                          <div>
                            <p className="text-xs">«____»_____________20__ г.</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs mb-8 border-b border-gray-400 inline-block min-w-[150px]"></p>
                            <p className="text-xs">(М.П., подпись)</p>
                            <p className="text-xs mt-2 border-b border-gray-400 inline-block min-w-[150px]">{formData.lastName} {formData.firstName} {formData.middleName}</p>
                            <p className="text-xs">(Ф.И.О.)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={handleDownloadApplication}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Скачать заявление (PDF)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrintApplication}
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Печать
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      className="gap-2"
                    >
                      <a
                        href="/documents/zayavlenie-o-vydache-tehnicheskih-uslovij.docx"
                        download
                      >
                        <Download className="h-4 w-4" />
                        Скачать бланк (DOCX)
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Загрузка документов */}
              <Card>
                <CardHeader>
                  <CardTitle>Загрузка документов</CardTitle>
                  <CardDescription>
                    Загрузите отсканированные документы: подписанное заявление и копии паспорта
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Перетащите файлы сюда или нажмите для выбора
                      </p>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        id="documents-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("documents-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Выбрать файлы
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, JPG, PNG (макс. 10 МБ каждый)
                      </p>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Загруженные документы:</Label>
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
                            >
                              Удалить
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs text-amber-900 mb-1">Требования к документам:</p>
                          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                            <li>Подписанное заявление на выдачу ТУ (отсканированное)</li>
                            <li>Копии страниц паспорта с фото и пропиской</li>
                            <li>Все документы должны быть четкими и читаемыми</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Навигация */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={getCurrentStepIndex() === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            {getCurrentStepIndex() < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
              >
                Далее
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canGoNext() || isSubmitting}
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
        </CardContent>
      </Card>
    </div>
  );
}
