"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { AddressInput } from "@/components/AddressInput";

type PersonType = "individual" | "legal" | null;
type Step = "type" | "abonent" | "object" | "params";

export default function BecomeSubscriberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("type");
  const [personType, setPersonType] = useState<PersonType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

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

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const description = `Заявка на подключение к водоснабжению/водоотведению

Тип лица: ${personType === "individual" ? "Физическое лицо" : "Юридическое лицо"}

Информация об абоненте:
- ФИО: ${formData.lastName} ${formData.firstName} ${formData.middleName}
- Дата рождения: ${formData.birthDate}
- Адрес регистрации: ${formData.registrationAddress}
- Паспорт: ${formData.passportSeries} ${formData.passportNumber}
- Выдан: ${formData.passportIssuedBy}
- Дата выдачи: ${formData.passportIssueDate}
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
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => {
                        if (isAccessible) {
                          setCurrentStep(step.id as Step);
                          setError(null);
                        }
                      }}
                      disabled={!isAccessible}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
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
                      className={`mt-2 text-xs font-medium ${
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
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationAddress">Адрес регистрации</Label>
                <AddressInput
                  value={formData.registrationAddress}
                  onChange={(value: string) =>
                    setFormData({ ...formData, registrationAddress: value })
                  }
                />
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
                      type="date"
                      value={formData.passportIssueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, passportIssueDate: e.target.value })
                      }
                      required
                    />
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
