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
  Clock,
  Lightbulb,
  Wrench,
  FileCheck,
} from "lucide-react";
import { AddressInput } from "@/components/AddressInput";
import { ApplicationForm } from "./application-form";
import Link from "next/link";

type PersonType = "individual" | "legal" | null;
type Step = "stages" | "type" | "abonent" | "object" | "params" | "documents";

export default function BecomeSubscriberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("stages");
  const [personType, setPersonType] = useState<PersonType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const applicationRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [existingApplication, setExistingApplication] = useState<{
    id: string;
    status: string;
    createdAt: string;
    serviceTitle: string;
  } | null>(null);

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
    // Загружаем профиль только если пользователь авторизован
    if (status === "authenticated" && session?.user) {
      loadUserProfile();
    } else if (status === "unauthenticated") {
      // Если не авторизован, просто завершаем загрузку профиля
      setLoadingProfile(false);
    }
  }, [status, session]);

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
    { id: "stages", label: "Этапы подключения", icon: Settings },
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
    if (currentStep === "stages") return true; // Всегда можно продолжить с этапов
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
    
    // Проверяем авторизацию при переходе со страницы "Этапы подключения" на следующий шаг
    if (currentStep === "stages" && status !== "authenticated") {
      setError("Для продолжения необходимо войти в систему или зарегистрироваться");
      // Прокручиваем к началу формы, чтобы пользователь увидел сообщение
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    
    setError(null);
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as Step);
      // Прокручиваем к началу формы
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as Step);
      // Прокручиваем к началу формы
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
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
      const originalDisplay = hiddenElement.style.display;
      const originalPosition = hiddenElement.style.position;
      const originalLeft = hiddenElement.style.left;
      const originalTop = hiddenElement.style.top;
      const originalZIndex = hiddenElement.style.zIndex;
      
      // Устанавливаем стили для правильной генерации A4
      // Временно показываем элемент вне экрана для правильного рендеринга
      hiddenElement.className = "bg-white";
      hiddenElement.style.display = "block";
      hiddenElement.style.position = "absolute";
      hiddenElement.style.left = "-9999px";
      hiddenElement.style.top = "0";
      hiddenElement.style.zIndex = "-1";
      // Устанавливаем точную ширину A4, padding будет добавлен при добавлении в PDF
      // Устанавливаем ширину с учетом боковых отступов (210mm - 40mm = 170mm)
      hiddenElement.style.width = "170mm";
      hiddenElement.style.maxWidth = "170mm";
      hiddenElement.style.minWidth = "170mm";
      hiddenElement.style.padding = "0";
      hiddenElement.style.margin = "0";
      hiddenElement.style.boxSizing = "border-box";
      hiddenElement.style.fontFamily = "Times New Roman, serif";
      hiddenElement.style.fontSize = "10pt"; // Уменьшили еще для умещения на 2 листа
      hiddenElement.style.lineHeight = "1.5";
      hiddenElement.style.color = "#000000";
      hiddenElement.style.boxSizing = "border-box";
      hiddenElement.style.overflow = "visible";
      hiddenElement.style.height = "auto";

      // Ждем, чтобы стили применились и контент отрендерился
      await new Promise(resolve => setTimeout(resolve, 300));

      // Получаем реальные размеры контента
      const scrollWidth = hiddenElement.scrollWidth;
      const scrollHeight = hiddenElement.scrollHeight;

      const canvas = await html2canvas(hiddenElement, {
        scale: 1.5, // Уменьшаем scale для меньшего размера файла
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        removeContainer: false,
        width: scrollWidth,
        height: scrollHeight,
        windowWidth: scrollWidth,
        windowHeight: scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Восстанавливаем оригинальные стили
      hiddenElement.className = originalClasses;
      hiddenElement.style.cssText = originalStyle;
      hiddenElement.style.display = originalDisplay;
      hiddenElement.style.position = originalPosition;
      hiddenElement.style.left = originalLeft;
      hiddenElement.style.top = originalTop;
      hiddenElement.style.zIndex = originalZIndex;

      const pdf = new jsPDF("p", "mm", "a4");
      // Используем JPEG с качеством 0.85 для меньшего размера файла
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      // Размеры canvas в пикселях (при scale=1.5)
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Реальный размер в пикселях (делим на scale)
      const scale = 1.5;
      const realWidthPx = imgWidth / scale;
      const realHeightPx = imgHeight / scale;
      
      // Масштабируем под ширину страницы A4, сохраняя пропорции
      // Отступы для каждой страницы (PDF generation)
      const paddingTop = 15; // мм - отступ сверху на каждой странице
      const paddingLeft = 20; // мм
      const paddingRight = 20; // мм
      const paddingBottom = 20; // мм - увеличен отступ снизу для предотвращения обрезания последней строки
      // Добавляем небольшой запас для предотвращения обрезания текста
      const safetyMargin = 5; // мм - запас для предотвращения обрезания строк
      const availableWidth = pdfWidth - paddingLeft - paddingRight;
      const availableHeight = pdfHeight - paddingTop - paddingBottom - safetyMargin;
      
      // Конвертируем пиксели в мм (96 DPI: 1px = 25.4/96 mm)
      const pxToMm = 25.4 / 96;
      const imgWidthMm = realWidthPx * pxToMm;
      const imgHeightMm = realHeightPx * pxToMm;
      
      // Масштабируем под доступную ширину, сохраняя пропорции
      const widthRatio = availableWidth / imgWidthMm;
      const finalWidth = availableWidth;
      const finalHeight = imgHeightMm * widthRatio;
      
      // Если изображение больше одной страницы, разбиваем на страницы
      if (finalHeight <= availableHeight) {
        // Помещается на одну страницу
        pdf.addImage(imgData, "JPEG", paddingLeft, paddingTop, finalWidth, finalHeight);
      } else {
        // Разбиваем на несколько страниц
        // Высота одной страницы в мм (с учетом отступов и запаса)
        const pageHeightMm = availableHeight;
        // Вычисляем сколько пикселей исходного canvas соответствует одной странице
        // Сначала переводим высоту страницы в мм обратно в реальные пиксели
        const pageHeightRealPx = pageHeightMm / pxToMm / widthRatio;
        // Учитываем scale
        const pageHeightPx = pageHeightRealPx * scale;
        
        let sourceY = 0;
        let pageNumber = 0;
        
        while (sourceY < imgHeight) {
          const remainingHeight = imgHeight - sourceY;
          const isLastPage = sourceY + pageHeightPx >= imgHeight - 1; // -1 для учета погрешности
          
          // Для всех страниц кроме последней используем фиксированную высоту pageHeightPx
          // Это обеспечивает одинаковое масштабирование на всех страницах
          let currentPageHeightPx: number;
          if (isLastPage) {
            // На последней странице берем оставшуюся высоту
            currentPageHeightPx = remainingHeight;
          } else {
            // На всех остальных страницах используем фиксированную высоту
            currentPageHeightPx = pageHeightPx;
          }
          
          // Создаем временный canvas для текущей страницы
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.ceil(currentPageHeightPx);
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            // Копируем часть исходного canvas
            pageCtx.drawImage(
              canvas, 
              0, sourceY, imgWidth, currentPageHeightPx,
              0, 0, imgWidth, currentPageHeightPx
            );
            const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.85);
            
            if (pageNumber > 0) {
              pdf.addPage();
            }
            
            // На каждой странице добавляем верхний отступ
            const yPosition = paddingTop;
            
            // Используем тот же подход, что и для одной страницы
            // Вычисляем высоту страницы пропорционально finalHeight
            // Это обеспечивает одинаковое масштабирование на всех страницах
            const pageHeightRatio = currentPageHeightPx / imgHeight; // Доля от общей высоты
            const pageHeightForPdf = finalHeight * pageHeightRatio; // Пропорциональная высота в мм
            
            let actualPageHeight: number;
            if (isLastPage) {
              // На последней странице добавляем дополнительный запас снизу
              const lastPageExtraMargin = 15; // мм
              actualPageHeight = pageHeightForPdf + lastPageExtraMargin;
            } else {
              // На всех остальных страницах используем пропорциональную высоту
              actualPageHeight = pageHeightForPdf;
            }
            
            pdf.addImage(pageImgData, "JPEG", paddingLeft, yPosition, finalWidth, actualPageHeight);
          }
          
          sourceY += currentPageHeightPx;
          pageNumber++;
        }
      }
      
      const fileName = `zayavlenie_TU_${formData.lastName}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(error instanceof Error ? error.message : "Ошибка при генерации PDF.");
    }
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

      const response = await fetch("/api/applications/technical-conditions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personType: personType,
          ...formData,
          uploadedFiles: fileUrls,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/applications?created=true");
        }, 2000);
      } else {
        // Если есть информация о существующей заявке, сохраняем её
        if (data.existingApplication) {
          setExistingApplication(data.existingApplication);
        }
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

  // Разрешаем показывать страницу даже неавторизованным пользователям для просмотра этапов

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Стать абонентом
        </h1>
        <p className="text-xl text-gray-600">
          Заполните форму для подключения к системам водоснабжения и водоотведения
        </p>
      </div>

      {/* Сообщение о существующей заявке */}
      {existingApplication && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  У вас уже есть активная заявка
                </h3>
                <p className="text-blue-800 mb-4">
                  Статус: <span className="font-medium">
                    {existingApplication.status === "PENDING" ? "Ожидает обработки" : 
                     existingApplication.status === "IN_PROGRESS" ? "В работе" : 
                     existingApplication.status}
                  </span>
                  <br />
                  Создана: {new Date(existingApplication.createdAt).toLocaleDateString("ru-RU")}
                </p>
                <Button asChild>
                  <Link href="/dashboard/applications">
                    Перейти к заявкам
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Прогресс-бар */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              const isAccessible = index === 0 || getCurrentStepIndex() >= index - 1;

              return (
                <div key={step.id} className="flex items-center flex-1 min-w-0">
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
                      className={`mt-2 text-xs font-medium text-center leading-tight ${
                        isActive ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 mt-6 ${
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
                  <AlertDescription>
                    {error}
                    {error.includes("войти в систему") && (
                      <div className="mt-4 flex gap-3">
                        <Button asChild size="sm">
                          <Link href={`/login?callbackUrl=${encodeURIComponent('/stat-abonentom')}`}>
                            Войти
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/register?callbackUrl=${encodeURIComponent('/stat-abonentom')}`}>
                            Зарегистрироваться
                          </Link>
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

          {/* Шаг 0: Этапы подключения */}
          {currentStep === "stages" && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-6">
                Ознакомьтесь с процессом подключения к системам водоснабжения и водоотведения
              </p>
              
              <div className="space-y-4">
                {/* Этап 1 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-blue-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Получение Технических Условий (ТУ)</h3>
                      <p className="text-sm text-gray-600 mb-2">Подача заявления в производственно-технический отдел (ПТО)</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Срок выдачи: 14 рабочих дней</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Этап 2 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-green-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Заключение договора о подключении</h3>
                      <p className="text-sm text-gray-600">У вас есть 1 год с момента получения ТУ для заключения договора</p>
                    </div>
                  </div>
                </div>

                {/* Этап 3 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-purple-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Проектирование</h3>
                      <p className="text-sm text-gray-600">Разработка проектно-сметной документации на строительство сетей</p>
                    </div>
                  </div>
                </div>

                {/* Этап 4 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-orange-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">4</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Строительство сетей</h3>
                      <p className="text-sm text-gray-600">Прокладка труб водопровода/канализации согласно согласованному проекту</p>
                    </div>
                  </div>
                </div>

                {/* Этап 5 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-red-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-red-600">5</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Врезка и пуск</h3>
                      <p className="text-sm text-gray-600">Получение разрешения на врезку и подключение к сетям</p>
                    </div>
                  </div>
                </div>

                {/* Этап 6 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-cyan-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-cyan-600">6</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Заключение абонентского договора</h3>
                      <p className="text-sm text-gray-600">Оформление договора на водоснабжение и водоотведение</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/abonenty/platy-uslugi/podklyuchenie">
                    <FileText className="h-4 w-4 mr-2" />
                    Подробная информация о каждом этапе
                  </Link>
                </Button>
              </div>
            </div>
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

              <div className="space-y-2">
                <Label htmlFor="objectAddress">
                  Адрес объекта
                </Label>
                <Input
                  id="objectAddress"
                  type="text"
                  value={formData.objectAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, objectAddress: e.target.value })
                  }
                  placeholder="Введите адрес объекта (если отличается от адреса регистрации)"
                />
                <p className="text-xs text-gray-500">Адрес объекта для подключения (если отличается от адреса регистрации)</p>
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

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-4">Дополнительные данные</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inn">ИНН</Label>
                    <Input
                      id="inn"
                      value={formData.inn}
                      onChange={(e) =>
                        setFormData({ ...formData, inn: e.target.value })
                      }
                      maxLength={12}
                      placeholder="123456789012"
                    />
                    <p className="text-xs text-gray-500">Идентификационный номер налогоплательщика</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="snils">СНИЛС</Label>
                    <Input
                      id="snils"
                      value={formData.snils}
                      onChange={(e) =>
                        setFormData({ ...formData, snils: e.target.value })
                      }
                      maxLength={11}
                      placeholder="123-456-789 01"
                    />
                    <p className="text-xs text-gray-500">Страховой номер индивидуального лицевого счета</p>
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
                  <ApplicationForm formData={formData} isPreview={true} />

                  {/* Скрытое заявление для генерации PDF */}
                  <div ref={applicationRef} style={{ display: 'none' }}>
                    <ApplicationForm formData={formData} isPreview={false} />
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
                {currentStep === "stages" ? "Продолжить" : "Далее"}
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
