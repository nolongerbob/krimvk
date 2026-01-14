"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, MapPin, FileText, Building, Settings, Calendar } from "lucide-react";
import { ApplicationActions } from "@/components/admin/ApplicationActions";
import { ApplicationDetails } from "@/components/admin/ApplicationDetails";

interface TechnicalConditionsData {
  type: string;
  personType: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  birthDate?: string;
  registrationAddress?: string;
  passportSeries?: string;
  passportNumber?: string;
  passportIssuedBy?: string;
  passportIssueDate?: string;
  passportDivisionCode?: string;
  inn?: string;
  snils?: string;
  objectType?: string;
  objectAddress?: string;
  constructionType?: string;
  connectionTypeWater?: boolean;
  connectionTypeSewerage?: boolean;
  uploadedFiles?: string[];
  [key: string]: any;
}

interface TechnicalConditionsApplicationProps {
  application: {
    id: string;
    status: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    createdAt: Date | string;
    user: {
      name: string | null;
      email: string;
      phone: string | null;
    };
    service?: {
      title: string;
      category?: string;
    };
    adminFiles?: Array<{
      id: string;
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: Date | string;
    }>;
  };
}

// Функция для преобразования внутренних обозначений типа объекта в читаемые названия
const getObjectTypeLabel = (objectType?: string): string => {
  if (!objectType) return "не указано";
  
  const typeMap: Record<string, string> = {
    "residential": "Жилой дом",
    "apartment": "Квартира",
    "commercial": "Коммерческий объект",
    "industrial": "Промышленный объект",
    "land": "Земельный участок",
    "land-plot": "Земельный участок",
  };
  
  return typeMap[objectType] || objectType;
};

// Безопасная функция для парсинга JSON из description с учетом комментариев администратора
function safeParseDescription(description: string | null): any | null {
  if (!description) return null;
  
  try {
    // Извлекаем JSON часть, если есть комментарий администратора
    let jsonPart = description;
    const commentIndex = description.indexOf('\n\nКомментарий при завершении:');
    if (commentIndex !== -1) {
      jsonPart = description.substring(0, commentIndex).trim();
    }
    
    return JSON.parse(jsonPart);
  } catch (e) {
    return null;
  }
}

// Функция для извлечения полного имени из данных заявки
function extractFullName(data: any | null, fallbackName: string | null, fallbackEmail: string): string {
  if (data) {
    // Проверяем наличие полей ФИО (могут быть пустыми строками, null, undefined)
    const lastName = (data.lastName && typeof data.lastName === 'string') ? data.lastName.trim() : "";
    const firstName = (data.firstName && typeof data.firstName === 'string') ? data.firstName.trim() : "";
    const middleName = (data.middleName && typeof data.middleName === 'string') ? data.middleName.trim() : "";
    
    // Временное логирование для отладки
    if (process.env.NODE_ENV === 'development') {
      console.log('[extractFullName] Debug:', {
        hasData: !!data,
        rawLastName: data.lastName,
        rawFirstName: data.firstName,
        rawMiddleName: data.middleName,
        lastName,
        firstName,
        middleName,
        fallbackName,
        fallbackEmail
      });
    }
    
    // Если есть хотя бы фамилия или имя, формируем ФИО
    if (lastName || firstName) {
      const fullName = `${lastName} ${firstName} ${middleName}`.trim();
      if (fullName) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[extractFullName] Returning fullName from data:', fullName);
        }
        return fullName;
      }
    }
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('[extractFullName] Returning fallback:', fallbackName || fallbackEmail);
  }
  return fallbackName || fallbackEmail;
}

export function TechnicalConditionsApplication({ application }: TechnicalConditionsApplicationProps) {
  let data: TechnicalConditionsData | null = null;
  
  // Используем безопасную функцию парсинга
  const parsed = safeParseDescription(application.description);
  if (parsed) {
    data = parsed;
    // Временное логирование для отладки
    if (process.env.NODE_ENV === 'development') {
      console.log('[TechnicalConditionsApplication] Parsed data:', {
        type: parsed.type,
        lastName: parsed.lastName,
        firstName: parsed.firstName,
        middleName: parsed.middleName,
        hasLastName: !!parsed.lastName,
        hasFirstName: !!parsed.firstName,
        hasMiddleName: !!parsed.middleName,
        user: application.user.name || application.user.email
      });
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TechnicalConditionsApplication] Failed to parse description:', {
        descriptionLength: application.description?.length,
        descriptionStart: application.description?.substring(0, 200),
        user: application.user.name || application.user.email
      });
    }
  }
  
  // Если не удалось распарсить, пытаемся извлечь данные из обрезанного JSON
  if (!data) {
    // Если не JSON или JSON обрезан, пытаемся извлечь данные из обрезанного JSON
    if (application.description && application.description.trim().startsWith('{')) {
      try {
        // Пытаемся найти основные поля даже в обрезанном JSON с помощью регулярных выражений
        const desc = application.description;
        const extractField = (fieldName: string): string | undefined => {
          const regex = new RegExp(`"${fieldName}":"([^"]*)"`, 'i');
          const match = desc.match(regex);
          return match ? match[1] : undefined;
        };
        
        const lastName = extractField('lastName');
        const firstName = extractField('firstName');
        const middleName = extractField('middleName');
        const objectAddress = extractField('objectAddress');
        const birthDate = extractField('birthDate');
        const registrationAddress = extractField('registrationAddress');
        const passportSeries = extractField('passportSeries');
        const passportNumber = extractField('passportNumber');
        const passportIssuedBy = extractField('passportIssuedBy');
        const passportIssueDate = extractField('passportIssueDate');
        const passportDivisionCode = extractField('passportDivisionCode');
        const inn = extractField('inn');
        const snils = extractField('snils');
        const objectType = extractField('objectType');
        const connectionTypeWater = desc.includes('"connectionTypeWater":true');
        const connectionTypeSewerage = desc.includes('"connectionTypeSewerage":true');
        
        if (lastName || firstName || middleName || desc.includes('"type":"technical_conditions"')) {
          data = {
            type: "technical_conditions",
            lastName: lastName || "",
            firstName: firstName || "",
            middleName: middleName || "",
            birthDate: birthDate,
            registrationAddress: registrationAddress,
            passportSeries: passportSeries,
            passportNumber: passportNumber,
            passportIssuedBy: passportIssuedBy,
            passportIssueDate: passportIssueDate,
            passportDivisionCode: passportDivisionCode,
            inn: inn,
            snils: snils,
            objectType: objectType,
            objectAddress: objectAddress || "",
            connectionTypeWater: connectionTypeWater,
            connectionTypeSewerage: connectionTypeSewerage,
          } as TechnicalConditionsData;
        }
      } catch (parseError) {
        console.error("Failed to extract data from truncated JSON:", parseError);
      }
    }
  }

  // Если это не технические условия по типу, но название услуги указывает на это, все равно показываем
  const isTechnicalConditionsByTitle = 
    application.service?.title?.toLowerCase().includes("технологическое присоединение") ||
    application.service?.title?.toLowerCase().includes("технические условия");

  // Если нет данных, но название услуги указывает на технические условия, показываем базовую информацию
  if (!data || (data.type !== "technical_conditions" && !isTechnicalConditionsByTitle)) {
    if (isTechnicalConditionsByTitle) {
      // Извлекаем ФИО из данных заявки
      const extractedFullName = extractFullName(data, application.user.name, application.user.email);
      
      // Показываем базовую информацию даже если JSON не парсится
      return (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle>Заявка на технические условия</CardTitle>
                  <Badge variant="outline" className="bg-blue-100">Технические условия</Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{extractedFullName}</span>
                  </div>
                  {application.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{application.address}</span>
                    </div>
                  )}
                  <div>
                    Создана: {new Date(application.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <ApplicationDetails application={application} />
              <ApplicationActions 
                applicationId={application.id} 
                currentStatus={application.status}
                isTechnicalConditions={true}
              />
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  const fullName = extractFullName(data, application.user.name, application.user.email);
  const passportInfo = data.passportSeries && data.passportNumber 
    ? `Серия ${data.passportSeries} № ${data.passportNumber}` 
    : "не указано";

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>Заявка на технические условия</CardTitle>
              <Badge variant="outline" className="bg-blue-100">Технические условия</Badge>
            </div>
            
            <div className="space-y-3 mt-4">
              {/* Личные данные */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Личные данные
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">ФИО:</span>{" "}
                    <span className="font-medium">{fullName || "не указано"}</span>
                  </div>
                  {data.birthDate && (
                    <div>
                      <span className="text-gray-600">Дата рождения:</span>{" "}
                      <span className="font-medium">{data.birthDate}</span>
                    </div>
                  )}
                  {data.registrationAddress && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Адрес регистрации:</span>{" "}
                      <span className="font-medium">{data.registrationAddress}</span>
                    </div>
                  )}
                  {passportInfo !== "не указано" && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Паспорт:</span>{" "}
                      <span className="font-medium">{passportInfo}</span>
                      {data.passportIssuedBy && `, выдан ${data.passportIssuedBy}`}
                      {data.passportIssueDate && `, ${data.passportIssueDate}`}
                      {data.passportDivisionCode && `, код ${data.passportDivisionCode}`}
                    </div>
                  )}
                  {data.inn && (
                    <div>
                      <span className="text-gray-600">ИНН:</span>{" "}
                      <span className="font-medium">{data.inn}</span>
                    </div>
                  )}
                  {data.snils && (
                    <div>
                      <span className="text-gray-600">СНИЛС:</span>{" "}
                      <span className="font-medium">{data.snils}</span>
                    </div>
                  )}
                  {application.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-600">Телефон:</span>{" "}
                      <span className="font-medium">{application.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Информация об объекте */}
              {(data.objectType || data.objectAddress) && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Информация об объекте
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {data.objectType && (
                      <div>
                        <span className="text-gray-600">Тип объекта:</span>{" "}
                        <span className="font-medium">{getObjectTypeLabel(data.objectType)}</span>
                      </div>
                    )}
                    {data.objectAddress && (
                      <div className="md:col-span-2 flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                        <div>
                          <span className="text-gray-600">Адрес объекта:</span>{" "}
                          <span className="font-medium">{data.objectAddress}</span>
                        </div>
                      </div>
                    )}
                    {data.constructionType && (
                      <div>
                        <span className="text-gray-600">Тип строительства:</span>{" "}
                        <span className="font-medium">{data.constructionType}</span>
                      </div>
                    )}
                    {data.objectHeight && (
                      <div>
                        <span className="text-gray-600">Высота:</span>{" "}
                        <span className="font-medium">{data.objectHeight} м</span>
                      </div>
                    )}
                    {data.objectFloors && (
                      <div>
                        <span className="text-gray-600">Этажность:</span>{" "}
                        <span className="font-medium">{data.objectFloors}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Параметры подключения */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Параметры подключения
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Водоснабжение:</span>{" "}
                    <Badge variant={data.connectionTypeWater ? "default" : "secondary"}>
                      {data.connectionTypeWater ? "Да" : "Нет"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Водоотведение:</span>{" "}
                    <Badge variant={data.connectionTypeSewerage ? "default" : "secondary"}>
                      {data.connectionTypeSewerage ? "Да" : "Нет"}
                    </Badge>
                  </div>
                  {data.maxWaterConsumptionLps && (
                    <div>
                      <span className="text-gray-600">Макс. потребление воды:</span>{" "}
                      <span className="font-medium">
                        {data.maxWaterConsumptionLps} л/с
                        {data.maxWaterConsumptionM3h && `, ${data.maxWaterConsumptionM3h} м³/ч`}
                        {data.maxWaterConsumptionM3day && `, ${data.maxWaterConsumptionM3day} м³/сут`}
                      </span>
                    </div>
                  )}
                  {data.plannedCommissioningDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-600">Планируемый срок ввода:</span>{" "}
                      <span className="font-medium">{data.plannedCommissioningDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Файлы */}
              {data.uploadedFiles && data.uploadedFiles.length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Прикрепленные документы ({data.uploadedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {data.uploadedFiles.map((file, index) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        {file.split("/").pop()}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Создана: {new Date(application.createdAt).toLocaleString("ru-RU")}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 items-center">
          <ApplicationDetails application={application} />
          <ApplicationActions 
            applicationId={application.id} 
            currentStatus={application.status}
            isTechnicalConditions={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}

