"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, useRef } from "react";
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

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const XML_NS = "http://www.w3.org/XML/1998/namespace";

/** Склеивает плейсхолдеры {{X}}, разорванные Word по разным <w:r>/<w:t>, в один <w:t>. Сохраняет оформление: копирует w:rPr из исходных runs. */
function fixSplitPlaceholdersInDocumentXml(xmlString: string): string {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xmlString, "text/xml");
  } catch {
    return xmlString;
  }
  if (!doc?.documentElement) return xmlString;

  const paras = doc.getElementsByTagNameNS(W_NS, "p");
  for (let i = 0; i < paras.length; i++) {
    const para = paras[i];
    const runs = Array.from(para.getElementsByTagNameNS(W_NS, "r"));
    let paraText = "";
    const runLengths: number[] = [];
    for (const run of runs) {
      let L = 0;
      const ts = run.getElementsByTagNameNS(W_NS, "t");
      for (let j = 0; j < ts.length; j++) {
        const txt = ts[j].textContent || "";
        L += txt.length;
        paraText += txt;
      }
      runLengths.push(L);
    }
    if (!paraText.includes("{{") || !paraText.includes("}}")) continue;
    paraText = paraText.replace(/\{\{([^}]+)\}\{\1\}\}/g, "{{$1}}");
    if (!/\{\{[^}]+\}\}/.test(paraText)) continue;

    const cumulative: number[] = [0];
    for (let k = 0; k < runLengths.length; k++) cumulative.push(cumulative[k]! + runLengths[k]!);
    const runForIndex = (idx: number) => {
      for (let k = cumulative.length - 1; k >= 0; k--) if (cumulative[k]! <= idx) return Math.min(k, runs.length - 1);
      return 0;
    };

    type Seg = { text: string; runIndex: number; rPr: Node | null };
    const segments: Seg[] = [];
    let current = paraText;
    let globalStart = 0;
    while (current) {
      const m = current.match(/\{\{[^}]+\}\}/);
      if (m) {
        const ph = m[0];
        const idx = current.indexOf(ph);
        const before = current.slice(0, idx);
        if (before) {
          segments.push({ text: before, runIndex: runForIndex(globalStart), rPr: null });
          globalStart += before.length;
        }
        segments.push({ text: ph, runIndex: runForIndex(globalStart), rPr: null });
        globalStart += ph.length;
        current = current.slice(idx + ph.length);
      } else {
        if (current) segments.push({ text: current, runIndex: runForIndex(globalStart), rPr: null });
        break;
      }
    }

    for (const seg of segments) {
      const run = runs[seg.runIndex];
      const rPrEl = run?.getElementsByTagNameNS(W_NS, "rPr")[0];
      seg.rPr = rPrEl ? rPrEl.cloneNode(true) : null;
    }

    for (const run of runs) {
      const parent = run.parentNode;
      if (parent) parent.removeChild(run);
    }

    for (const seg of segments) appendRun(para, doc, seg.text, seg.rPr);
  }

  try {
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xmlString;
  }
}

function appendRun(para: Element, doc: Document, text: string, rPrClone: Node | null): void {
  const run = doc.createElementNS(W_NS, "r");
  if (rPrClone) {
    run.appendChild(rPrClone);
  } else {
    const rPr = doc.createElementNS(W_NS, "rPr");
    const fonts = doc.createElementNS(W_NS, "rFonts");
    fonts.setAttributeNS(W_NS, "ascii", "Times New Roman");
    fonts.setAttributeNS(W_NS, "hAnsi", "Times New Roman");
    rPr.appendChild(fonts);
    run.appendChild(rPr);
  }
  const t = doc.createElementNS(W_NS, "t");
  t.textContent = text;
  if (text.startsWith(" ") || text.endsWith(" ")) t.setAttributeNS(XML_NS, "space", "preserve");
  run.appendChild(t);
  para.appendChild(run);
}

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
    // Информация об абоненте (юридическое лицо)
    fullName: "",       // полное наименование
    shortName: "",      // сокращенное наименование
    ogrn: "",           // ОГРН
    // Для объекта юр.лица (п.3): место по ЕГРЮЛ, почтовый, фактический, телефон, email
    legalAddress: "",   // место нахождения и адрес по ЕГРЮЛ
    postalAddress: "",  // почтовый адрес
    actualAddress: "",  // фактический адрес
    objectEmail: "",    // адрес электронной почты (для юр.лиц в объекте)
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
    requestBasis: "", // основание обращения: владелец или доверенное лицо
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
        formData.birthDate &&
        formData.phone &&
        formData.passportSeries &&
        formData.passportNumber &&
        formData.passportIssuedBy &&
        formData.passportIssueDate &&
        formData.passportDivisionCode
      );
    }
    if (currentStep === "abonent" && personType === "legal") {
      return (
        formData.fullName &&
        formData.shortName &&
        formData.ogrn &&
        formData.inn
      );
    }
    if (currentStep === "object") {
      if (personType === "legal") {
        return (
          formData.legalAddress &&
          formData.postalAddress &&
          formData.actualAddress &&
          formData.phone &&
          formData.objectEmail &&
          formData.objectType &&
          formData.objectAddress
        );
      }
      return (
        formData.objectType &&
        formData.objectAddress &&
        formData.requestBasis &&
        formData.constructionType &&
        formData.resourceType
      );
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
    try {
      // Импортируем необходимые библиотеки
      const pizzipMod = await import("pizzip");
      const PizZip = pizzipMod.default ?? (pizzipMod as any).PizZip;
      if (typeof PizZip !== "function") {
        throw new Error("Не удалось загрузить PizZip. Проверьте установку пакета pizzip.");
      }
      const Docxtemplater = (await import("docxtemplater")).default;
      const fileSaver = await import("file-saver");
      const saveAs = (fileSaver as any).saveAs ?? (fileSaver as any).default;
      if (typeof saveAs !== "function") {
        throw new Error("Не удалось загрузить file-saver (saveAs).");
      }

      // Источник: файл из корня (zayavlenie-o-vydache-tehnicheskih-uslovij.docx). Запас: _fixed и основной в public/documents, minimal.
      const templateUrls = [
        `/api/documents/zayavlenie?v=${Date.now()}`,
        `/documents/zayavlenie-o-vydache-tehnicheskih-uslovij_fixed.docx?v=${Date.now()}`,
        `/documents/zayavlenie-o-vydache-tehnicheskih-uslovij.docx?v=${Date.now()}`,
        `/documents/tu-template-minimal.docx?v=${Date.now()}`,
      ];

      // Подготавливаем данные до цикла: при ошибке compile/render (разорванные {{ }}) пробуем следующий шаблон
      const isLegal = personType === "legal";
      const fio = isLegal
        ? formData.fullName || ""
        : `${formData.lastName} ${formData.firstName} ${formData.middleName || ""}`.trim();
      const passport = isLegal
        ? ""
        : `серия ${formData.passportSeries} № ${formData.passportNumber}, выдан ${formData.passportIssuedBy}, ${formData.passportIssueDate}, код подразделения ${formData.passportDivisionCode}`;
      const ownerOrTrustedPerson = formData.requestBasis === "owner"
        ? "Правообладатель земельного участка"
        : formData.requestBasis === "trusted"
          ? "Доверенное лицо"
          : "";
      const objectTypeName =
        formData.objectType === "residential" ? "Жилой дом" :
        formData.objectType === "apartment" ? "Квартира" :
        formData.objectType === "commercial" ? "Коммерческий объект" :
        formData.objectType === "industrial" ? "Промышленный объект" :
        formData.objectType === "land" ? "Земельный участок" : "";
      const objectInformation = [
        `Тип: ${objectTypeName}`,
        formData.cadastralNumber ? `Кадастровый номер: ${formData.cadastralNumber}` : "",
        formData.area ? `Площадь: ${formData.area} кв.м` : "",
      ].filter(Boolean).join(", ");
      const typeOfConnection =
        formData.connectionMethod === "with-well"
          ? `с колодцем (${formData.wellType === "existing" ? "существующий" : "проектируемый"})`
          : "по протяженности";
      const templateData_fields = {
        resourse_type: formData.resourceType || "",
        object_type: objectTypeName,
        BirthDate: formData.birthDate || "",
        snils: formData.snils ? `СНИЛС ${formData.snils}` : "",
        "object information": objectInformation,
        "where to receive result": formData.notificationMethod || "на адрес электронной почты",
        date_start: formData.plannedCommissioningDate || "",
        "place address": formData.objectAddress || "",
        "type of connection": typeOfConnection,
        FIO: fio,
        fio: fio,
        Passport: passport,
        inn: formData.inn ? `ИНН ${formData.inn}` : "",
        email: formData.objectEmail || "",
        "mail address": isLegal ? formData.postalAddress : formData.registrationAddress || "",
        "owner or trusted person": ownerOrTrustedPerson,
        phone: formData.phone || "",
        reason: formData.constructionType || "",
        "registration address": formData.registrationAddress || "",
      };
      const dataProxy = new Proxy(templateData_fields, {
        get(t, p: string) {
          if (Object.prototype.hasOwnProperty.call(t, p)) return t[p as keyof typeof t];
          return "";
        },
      });

      let doc: InstanceType<typeof Docxtemplater> | null = null;
      for (const url of templateUrls) {
        const res = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } });
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        if (!buf?.byteLength) continue;

        const zip = new PizZip(buf);

        // Убираем недопустимые для XML 1.0 управляющие символы (кроме \t, \n, \r)
        // и склеиваем плейсхолдеры {{X}}, разорванные Word по разным <w:r>/<w:t>, в один <w:t>
        const docEntry = zip.files["word/document.xml"];
        if (docEntry) {
          try {
            let safe = docEntry.asText().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
            safe = fixSplitPlaceholdersInDocumentXml(safe);
            zip.file("word/document.xml", safe);
          } catch {
            // оставляем как есть
          }
        }

        try {
          doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => "",
            stripInvalidXMLChars: true,
          });
          doc.render(dataProxy);
          break;
        } catch (e: unknown) {
          const err = e as { message?: string; properties?: { id?: string; errors?: Array<{ properties?: { id?: string } }> } };
          const errList: Array<{ properties?: { id?: string } }> = err?.properties?.errors ?? (e as any)?.properties?.error ?? (e as any)?.errors ?? [];
          const malformed = err?.properties?.id === "malformed_xml" || /malformed xml/i.test(String(err?.message ?? ""));
          const hasFragmented = errList.some((x) => x?.properties?.id === "duplicate_open_tag" || x?.properties?.id === "duplicate_close_tag");
          const multiTag = err?.message === "Multi error" && errList.length > 0;
          if (malformed || hasFragmented || multiTag) {
            doc = null;
            continue; // пробуем следующий шаблон
          }
          throw e;
        }
      }

      if (!doc) {
        throw new Error("Не удалось подготовить шаблон (ошибка XML). Используйте «Скачать бланк (DOCX)» и заполните вручную.");
      }

      // Генерируем документ
      const docxBlob = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Сохраняем файл
      const fileName = personType === "legal"
        ? `zayavlenie_TU_${(formData.shortName || formData.fullName || "legal").replace(/[^a-zA-Zа-яА-ЯёЁ0-9_-]/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`
        : `zayavlenie_TU_${formData.lastName}_${new Date().toISOString().split("T")[0]}.docx`;

      saveAs(docxBlob, fileName);
    } catch (error: unknown) {
      console.error("Error generating DOCX:", error);

      let msg = "Ошибка при генерации DOCX.";
      const err = error as { message?: string; name?: string; properties?: { id?: string; errors?: Array<{ message?: string }> } };
      if (error instanceof Error) {
        msg = error.message;
        if (err?.properties?.id === "malformed_xml" || /malformed xml/i.test(msg)) {
          msg = "Ошибка XML в шаблоне Word. Используйте «Скачать бланк (DOCX)» и заполните вручную.";
        } else if (error.name === "TemplateError" || /tag|placeholder|парсер|parser/i.test(msg)) {
          msg = "Ошибка шаблона Word (возможно, плейсхолдеры разорваны). Скачайте бланк ниже и заполните вручную.";
        }
      }
      if (err?.properties?.errors?.length) {
        const first = err.properties.errors[0]?.message ?? "";
        if (/tag|parser|malformed/i.test(first)) {
          msg = "Ошибка в шаблоне заявления. Используйте «Скачать бланк (DOCX)» и заполните вручную.";
        }
      }

      setError(msg);
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

      const abonentBlock = personType === "legal"
        ? `Информация об абоненте (юр. лицо):
- Полное наименование: ${formData.fullName}
- Сокращенное наименование: ${formData.shortName}
- ОГРН: ${formData.ogrn}
- ИНН: ${formData.inn}

Контактные данные (объект):
- Адрес по ЕГРЮЛ: ${formData.legalAddress}
- Почтовый адрес: ${formData.postalAddress}
- Фактический адрес: ${formData.actualAddress}
- Телефон: ${formData.phone}
- Email: ${formData.objectEmail}`
        : `Информация об абоненте (физ. лицо):
- ФИО: ${formData.lastName} ${formData.firstName} ${formData.middleName}
- Дата рождения: ${formData.birthDate || "не указано"}
- Адрес регистрации: ${formData.registrationAddress}
- Паспорт: ${formData.passportSeries} ${formData.passportNumber}
- Выдан: ${formData.passportIssuedBy}
- Дата выдачи: ${formData.passportIssueDate || "не указано"}
- Код подразделения: ${formData.passportDivisionCode}
- Телефон: ${formData.phone}`;

      const description = `Заявка на подключение к водоснабжению/водоотведению

Тип лица: ${personType === "individual" ? "Физическое лицо" : "Юридическое лицо"}

${abonentBlock}

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
        <CardContent className="p-6 overflow-x-auto">
          <div className="flex items-center w-full min-w-[660px]">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              const isAccessible = index === 0 || getCurrentStepIndex() >= index - 1;

              return (
                <Fragment key={step.id}>
                  {/* Круг и подпись — фиксированная ширина, чтобы соединительные линии были одинаковые */}
                  <div className="flex flex-col items-center flex-shrink-0 w-[100px] sm:w-[120px]">
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
                  {/* Соединительная линия — flex-1, все одинаковой длины, выровнена по центру круга */}
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 min-w-[12px] mx-1 self-start mt-6 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                      aria-hidden
                    />
                  )}
                </Fragment>
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
                <Label htmlFor="birthDate">
                  Дата рождения <span className="text-red-500">*</span>
                </Label>
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
                  required
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
                    <Label htmlFor="passportDivisionCode">
                      Код подразделения <span className="text-red-500">*</span>
                    </Label>
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
                      required
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

          {/* Шаг 2: Личные данные (юридическое лицо) */}
          {currentStep === "abonent" && personType === "legal" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-2">Юридическое лицо</h3>
              <p className="text-gray-600 mb-4">
                Полное и сокращенное наименования, ОГРН, ИНН
              </p>
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Полное наименование <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  placeholder="Общество с ограниченной ответственностью «Пример»"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">
                  Сокращенное наименование <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={(e) =>
                    setFormData({ ...formData, shortName: e.target.value })
                  }
                  required
                  placeholder="ООО «Пример»"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ogrn">
                    ОГРН <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ogrn"
                    value={formData.ogrn}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                      setFormData({ ...formData, ogrn: v });
                    }}
                    required
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                  <p className="text-xs text-gray-500">
                    Основной государственный регистрационный номер в ЕГРЮЛ (13 цифр)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="innLegal">
                    ИНН <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="innLegal"
                    value={formData.inn}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 12);
                      setFormData({ ...formData, inn: v });
                    }}
                    required
                    placeholder="1234567890"
                    maxLength={12}
                  />
                  <p className="text-xs text-gray-500">
                    Идентификационный номер налогоплательщика (10 или 12 цифр)
                  </p>
                </div>
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
                    <option value="land">Земельный участок</option>
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
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9:]/g, ''); // Только цифры и двоеточия
                    
                    // Удаляем все двоеточия для переформатирования
                    const digitsOnly = value.replace(/:/g, '');
                    
                    // Автоматически добавляем двоеточия в нужных местах
                    // Формат: XX:XX:XXXXXX:XXXX
                    let formatted = '';
                    for (let i = 0; i < digitsOnly.length; i++) {
                      formatted += digitsOnly[i];
                      // Добавляем двоеточие после 2-й, 4-й и 10-й цифры
                      if ((i === 1 || i === 3 || i === 9) && i < digitsOnly.length - 1) {
                        formatted += ':';
                      }
                    }
                    
                    setFormData({ ...formData, cadastralNumber: formatted });
                  }}
                  placeholder="XX:XX:XXXXXX:XXXX"
                  maxLength={18} // Максимальная длина с двоеточиями: 2:2:6:4 = 18 символов
                />
                <p className="text-xs text-gray-500">Формат: XX:XX:XXXXXX:XXXX (например: 77:01:000100:1001)</p>
                <a
                  href="https://nspd.gov.ru/map"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Узнать кадастровый номер
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
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

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-4">Дополнительная информация</h3>

                <div className="space-y-2">
                  <Label htmlFor="requestBasis">
                    Основание обращения с запросом <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="requestBasis"
                    value={formData.requestBasis}
                    onChange={(e) =>
                      setFormData({ ...formData, requestBasis: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите основание</option>
                    <option value="owner">Правообладатель земельного участка</option>
                    <option value="trusted">Доверенное лицо</option>
                  </select>
                  <p className="text-xs text-gray-500">Укажите, кем вы являетесь по отношению к объекту</p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="constructionType">
                    В связи с чем просится выдать ТУ <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="constructionType"
                    value={formData.constructionType}
                    onChange={(e) =>
                      setFormData({ ...formData, constructionType: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите тип работ</option>
                    <option value="новое строительство">Новое строительство</option>
                    <option value="реконструкция">Реконструкция</option>
                    <option value="модернизация">Модернизация</option>
                  </select>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="resourceType">
                    Необходимые виды ресурсов <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="resourceType"
                    value={formData.resourceType}
                    onChange={(e) =>
                      setFormData({ ...formData, resourceType: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите вид ресурсов</option>
                    <option value="получение питьевой воды">Получение питьевой воды</option>
                    <option value="получение технической воды">Получение технической воды</option>
                    <option value="сброс хозяйственно-бытовых сточных вод">Сброс хозяйственно-бытовых сточных вод</option>
                    <option value="получение питьевой воды, сброс хозяйственно-бытовых сточных вод">Получение питьевой воды и сброс хозяйственно-бытовых сточных вод</option>
                  </select>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="plannedCommissioningDate">
                    Планируемый срок ввода в эксплуатацию
                  </Label>
                  <Input
                    id="plannedCommissioningDate"
                    type="text"
                    value={formData.plannedCommissioningDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      if (value.length === 2 && !value.includes('.')) {
                        value = value + '.';
                      } else if (value.length === 5 && value.split('.').length === 2) {
                        value = value + '.';
                      }
                      setFormData({ ...formData, plannedCommissioningDate: value });
                    }}
                    placeholder="дд.мм.гггг (например: 01.12.2025)"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500">Необязательное поле</p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-4">Информация о предельных параметрах (необязательно)</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="objectHeight">Высота объекта (метров)</Label>
                    <Input
                      id="objectHeight"
                      type="number"
                      value={formData.objectHeight}
                      onChange={(e) =>
                        setFormData({ ...formData, objectHeight: e.target.value })
                      }
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objectFloors">Этажность</Label>
                    <Input
                      id="objectFloors"
                      type="number"
                      value={formData.objectFloors}
                      onChange={(e) =>
                        setFormData({ ...formData, objectFloors: e.target.value })
                      }
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="networkLength">Протяженность сети (метров)</Label>
                    <Input
                      id="networkLength"
                      type="number"
                      value={formData.networkLength}
                      onChange={(e) =>
                        setFormData({ ...formData, networkLength: e.target.value })
                      }
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Шаг 3: Объект (юридическое лицо) — контактные данные и данные объекта */}
          {currentStep === "object" && personType === "legal" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-2">Контактные данные (место нахождения, адреса)</h3>
              <div className="space-y-2">
                <Label htmlFor="legalAddress">
                  Место нахождения и адрес по ЕГРЮЛ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="legalAddress"
                  value={formData.legalAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, legalAddress: e.target.value })
                  }
                  required
                  placeholder="Адрес по Единому государственному реестру юридических лиц"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalAddress">
                  Почтовый адрес <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postalAddress"
                  value={formData.postalAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, postalAddress: e.target.value })
                  }
                  required
                  placeholder="Почтовый адрес для связи"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualAddress">
                  Фактический адрес <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="actualAddress"
                  value={formData.actualAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, actualAddress: e.target.value })
                  }
                  required
                  placeholder="Фактический адрес осуществления деятельности"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneLegal">
                    Контактный телефон <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneLegal"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="+7 (978) 123-45-67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectEmail">
                    Адрес электронной почты <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="objectEmail"
                    type="email"
                    value={formData.objectEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, objectEmail: e.target.value })
                    }
                    required
                    placeholder="info@company.ru"
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-lg mb-4">Данные подключаемого объекта</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="objectTypeLegal">
                      Объект <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="objectTypeLegal"
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
                      <option value="land">Земельный участок</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objectPurposeLegal">Назначение объекта</Label>
                    <select
                      id="objectPurposeLegal"
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

                <div className="space-y-2 mt-4">
                  <Label htmlFor="cadastralNumberLegal">Кадастровый номер</Label>
                  <Input
                    id="cadastralNumberLegal"
                    value={formData.cadastralNumber}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9:]/g, "");
                      const digitsOnly = value.replace(/:/g, "");
                      let formatted = "";
                      for (let i = 0; i < digitsOnly.length; i++) {
                        formatted += digitsOnly[i];
                        if ((i === 1 || i === 3 || i === 9) && i < digitsOnly.length - 1) {
                          formatted += ":";
                        }
                      }
                      setFormData({ ...formData, cadastralNumber: formatted });
                    }}
                    placeholder="XX:XX:XXXXXX:XXXX"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="objectAddressLegal">
                    Адрес объекта <span className="text-red-500">*</span>
                  </Label>
                  <AddressInput
                    value={formData.objectAddress}
                    onChange={(value: string) =>
                      setFormData({ ...formData, objectAddress: value })
                    }
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="areaLegal">Площадь объекта (кв. метров)</Label>
                  <Input
                    id="areaLegal"
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
            </div>
          )}

          {/* Шаг 4: Параметры присоединения */}
          {currentStep === "params" && (personType === "individual" || personType === "legal") && (
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
          {currentStep === "documents" && (personType === "individual" || personType === "legal") && (
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
                      {personType === "individual" ? (
                        <li>Отсканируйте копии паспорта (страницы с фото и пропиской)</li>
                      ) : (
                        <li>Отсканируйте учредительные документы (устав, свидетельство о регистрации и т.п.)</li>
                      )}
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
                  <ApplicationForm formData={formData} personType={personType} isPreview={true} />

                  {/* Скрытое заявление для генерации PDF */}
                  <div ref={applicationRef} style={{ display: 'none' }}>
                    <ApplicationForm formData={formData} personType={personType} isPreview={false} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={handleDownloadApplication}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Скачать заявление (DOCX)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      className="gap-2"
                    >
                      <a
                        href="/api/documents/zayavlenie-blank"
                        download="zayavlenie-o-vydache-tehnicheskih-uslovij-3.docx"
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
                    {personType === "individual"
                      ? "Загрузите отсканированные документы: подписанное заявление и копии паспорта"
                      : "Загрузите отсканированные документы: подписанное заявление и учредительные документы (устав, свидетельство о регистрации и т.п.)"}
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
                            {personType === "individual" ? (
                              <li>Копии страниц паспорта с фото и пропиской</li>
                            ) : (
                              <li>Учредительные документы (устав, свидетельство о регистрации и т.п.)</li>
                            )}
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
