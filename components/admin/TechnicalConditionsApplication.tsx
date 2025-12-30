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

export function TechnicalConditionsApplication({ application }: TechnicalConditionsApplicationProps) {
  let data: TechnicalConditionsData | null = null;
  
  try {
    if (application.description) {
      data = JSON.parse(application.description);
    }
  } catch (e) {
    // Если не JSON, значит это старая заявка
  }

  if (!data || data.type !== "technical_conditions") {
    return null;
  }

  const fullName = `${data.lastName || ""} ${data.firstName || ""} ${data.middleName || ""}`.trim();
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
                        <span className="font-medium">{data.objectType}</span>
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
          <ApplicationActions applicationId={application.id} currentStatus={application.status} />
        </div>
      </CardContent>
    </Card>
  );
}

