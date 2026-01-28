"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, User, Building, Settings, FileText, Upload, AlertCircle, Search, X, FileCheck, ChevronDown } from "lucide-react";
import Link from "next/link";

type Tab = "abonent" | "object" | "params" | "progress";

interface ApplicationOption {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  createdAt: string;
  status: string;
  serviceTitle: string;
}

// Начальное состояние формы (синхронизировано с формой "Стать абонентом")
const initialFormData = {
  // Основная информация о договоре
  contractNumber: "",
  contractDate: "",
  
  // Информация об абоненте
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
  inn: "",
  snils: "",
  
  // Информация об объекте
  objectType: "",
  objectPurpose: "",
  cadastralNumber: "",
  objectAddress: "",
  objectArea: "",
  siteMaster: "",
  position: "",
  objectBasis: "",
  // Дополнительные поля объекта
  requestBasis: "", // основание обращения: owner/trusted
  constructionType: "", // новое строительство, реконструкция, модернизация
  resourceType: "", // получение питьевой воды, сброс сточных вод
  plannedCommissioningDate: "", // планируемый срок ввода
  objectHeight: "",
  objectFloors: "",
  networkLength: "",
  
  // Параметры присоединения
  hasWaterSupply: false,
  hasSewerage: false,
  connectionMethod: "", // by-length / with-well
  wellType: "", // existing / planned
  requestedLoad: "",
  connectionPoint: "",
  pipeDiameter: "",
  pipeMaterial: "",
  waterSupplyRestriction: false,
  privateNetworkPermission: false,
  
  // Параметры потребления воды
  maxWaterConsumptionLps: "",
  maxWaterConsumptionM3h: "",
  maxWaterConsumptionM3day: "",
  
  // Пожаротушение
  fireExtinguishingExternal: "",
  fireExtinguishingInternal: "",
  fireHydrantsCount: "",
  fireExtinguishingAutomatic: "",
  
  // Водоотведение
  wastewaterLps: "",
  wastewaterM3h: "",
  wastewaterM3day: "",
  
  // Способ уведомления
  notificationMethod: "",
  
  // Ход подключения
  receiptDate: "",
  technicalConditionsIssueDate: "",
  technicalConditionsNumber: "",
  connectionAgreementIssueDate: "",
  connectionAgreementNumber: "",
  designAgreementIssueDate: "",
  designAgreementNumber: "",
  costWithVAT: "",
};

export default function CreateContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromApplicationId = searchParams.get("fromApplication");
  
  const [activeTab, setActiveTab] = useState<Tab>("abonent");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingApplication, setIsLoadingApplication] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationInfo, setApplicationInfo] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  
  // Состояние для выбора заявки
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(fromApplicationId);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [isApplicationDropdownOpen, setIsApplicationDropdownOpen] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

  // Загружаем список заявок при монтировании
  useEffect(() => {
    loadApplicationsList();
  }, []);

  // Загружаем данные из заявки, если передан параметр fromApplication или выбрана заявка
  useEffect(() => {
    if (fromApplicationId) {
      setSelectedApplicationId(fromApplicationId);
      loadApplicationData(fromApplicationId);
    }
  }, [fromApplicationId]);

  // Загрузка списка заявок
  const loadApplicationsList = async () => {
    setIsLoadingApplications(true);
    try {
      const response = await fetch("/api/admin/applications/list");
      if (response.ok) {
        const { applications: apps } = await response.json();
        setApplications(apps);
      }
    } catch (err) {
      console.error("Error loading applications list:", err);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Фильтрация заявок по поиску
  const filteredApplications = useMemo(() => {
    if (!applicationSearch.trim()) return applications;
    const search = applicationSearch.toLowerCase();
    return applications.filter(app => 
      app.fullName.toLowerCase().includes(search) ||
      app.address?.toLowerCase().includes(search) ||
      app.phone?.toLowerCase().includes(search)
    );
  }, [applications, applicationSearch]);

  // Обработка выбора заявки
  const handleSelectApplication = (appId: string) => {
    setSelectedApplicationId(appId);
    setIsApplicationDropdownOpen(false);
    setApplicationSearch("");
    loadApplicationData(appId);
  };

  // Сброс выбранной заявки
  const handleClearApplication = () => {
    setSelectedApplicationId(null);
    setApplicationInfo(null);
    setFormData(initialFormData);
  };

  // Ref для закрытия dropdown при клике вне
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsApplicationDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadApplicationData = async (applicationId: string) => {
    setIsLoadingApplication(true);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      if (!response.ok) {
        throw new Error("Не удалось загрузить заявку");
      }
      
      const { application } = await response.json();
      
      // Парсим description для извлечения данных заявки
      let appData: any = {};
      if (application.description) {
        try {
          // Извлекаем JSON часть, если есть комментарий администратора
          let jsonPart = application.description;
          const commentIndex = application.description.indexOf('\n\nКомментарий при завершении:');
          if (commentIndex !== -1) {
            jsonPart = application.description.substring(0, commentIndex).trim();
          }
          appData = JSON.parse(jsonPart);
          console.log("Parsed application JSON:", appData);
        } catch (e) {
          // Если JSON не парсится, пробуем извлечь данные регулярками
          const desc = application.description;
          const extractField = (fieldName: string): string | undefined => {
            const regex = new RegExp(`"${fieldName}":"([^"]*)"`, 'i');
            const match = desc.match(regex);
            return match ? match[1] : undefined;
          };
          
          appData = {
            // Личные данные
            lastName: extractField('lastName'),
            firstName: extractField('firstName'),
            middleName: extractField('middleName'),
            birthDate: extractField('birthDate'),
            registrationAddress: extractField('registrationAddress'),
            passportSeries: extractField('passportSeries'),
            passportNumber: extractField('passportNumber'),
            passportIssuedBy: extractField('passportIssuedBy'),
            passportIssueDate: extractField('passportIssueDate'),
            passportDivisionCode: extractField('passportDivisionCode'),
            phone: extractField('phone'),
            inn: extractField('inn'),
            snils: extractField('snils'),
            
            // Данные объекта
            objectType: extractField('objectType'),
            objectAddress: extractField('objectAddress'),
            objectPurpose: extractField('objectPurpose'),
            cadastralNumber: extractField('cadastralNumber'),
            area: extractField('area'),
            requestBasis: extractField('requestBasis'),
            constructionType: extractField('constructionType'),
            resourceType: extractField('resourceType'),
            plannedCommissioningDate: extractField('plannedCommissioningDate'),
            objectHeight: extractField('objectHeight'),
            objectFloors: extractField('objectFloors'),
            networkLength: extractField('networkLength'),
            
            // Параметры подключения
            connectionTypeWater: desc.includes('"connectionTypeWater":true'),
            connectionTypeSewerage: desc.includes('"connectionTypeSewerage":true'),
            connectionMethod: extractField('connectionMethod'),
            wellType: extractField('wellType'),
            requestedLoad: extractField('requestedLoad'),
            connectionPointLocation: extractField('connectionPointLocation'),
            pipeDiameter: extractField('pipeDiameter'),
            pipeMaterial: extractField('pipeMaterial'),
            
            // Потребление воды
            maxWaterConsumptionLps: extractField('maxWaterConsumptionLps'),
            maxWaterConsumptionM3h: extractField('maxWaterConsumptionM3h'),
            maxWaterConsumptionM3day: extractField('maxWaterConsumptionM3day'),
            
            // Пожаротушение
            fireExtinguishingExternal: extractField('fireExtinguishingExternal'),
            fireExtinguishingInternal: extractField('fireExtinguishingInternal'),
            fireHydrantsCount: extractField('fireHydrantsCount'),
            fireExtinguishingAutomatic: extractField('fireExtinguishingAutomatic'),
            
            // Водоотведение
            wastewaterLps: extractField('wastewaterLps'),
            wastewaterM3h: extractField('wastewaterM3h'),
            wastewaterM3day: extractField('wastewaterM3day'),
            
            // Уведомление
            notificationMethod: extractField('notificationMethod'),
          };
        }
        
        // Логируем для отладки
        console.log("Extracted application data:", appData);
      }
      
      // Генерируем номер договора
      const today = new Date();
      const dateStr = today.toLocaleDateString("ru-RU").replace(/\./g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const contractNumber = `ДГ-${today.getFullYear()}-${randomNum}`;
      
      // Преобразуем тип объекта в читаемый формат
      const objectTypeMap: Record<string, string> = {
        "residential": "Жилой дом",
        "apartment": "Квартира",
        "commercial": "Коммерческий объект",
        "industrial": "Промышленный объект",
        "land": "Земельный участок",
        "land-plot": "Земельный участок",
      };
      
      // Заполняем форму данными из заявки
      setFormData({
        ...initialFormData,
        contractNumber,
        contractDate: today.toLocaleDateString("ru-RU"),
        
        // Данные абонента
        lastName: appData.lastName || "",
        firstName: appData.firstName || "",
        middleName: appData.middleName || "",
        birthDate: appData.birthDate || "",
        registrationAddress: appData.registrationAddress || "",
        passportSeries: appData.passportSeries || "",
        passportNumber: appData.passportNumber || "",
        passportIssuedBy: appData.passportIssuedBy || "",
        passportIssueDate: appData.passportIssueDate || "",
        passportDivisionCode: appData.passportDivisionCode || "",
        phone: appData.phone || application.phone || application.user?.phone || "",
        inn: appData.inn || "",
        snils: appData.snils || "",
        
        // Данные объекта
        objectType: objectTypeMap[appData.objectType] || appData.objectType || "",
        objectPurpose: appData.objectPurpose || "",
        cadastralNumber: appData.cadastralNumber || "",
        objectAddress: appData.objectAddress || application.address || "",
        objectArea: appData.area || appData.objectArea || "",
        siteMaster: appData.siteMaster || "",
        position: appData.position || "",
        objectBasis: appData.objectBasis || "",
        requestBasis: appData.requestBasis || "",
        constructionType: appData.constructionType || "",
        resourceType: appData.resourceType || "",
        plannedCommissioningDate: appData.plannedCommissioningDate || "",
        objectHeight: appData.objectHeight || "",
        objectFloors: appData.objectFloors || "",
        networkLength: appData.networkLength || "",
        
        // Параметры присоединения
        hasWaterSupply: appData.connectionTypeWater || false,
        hasSewerage: appData.connectionTypeSewerage || false,
        connectionMethod: appData.connectionMethod || "",
        wellType: appData.wellType || "",
        requestedLoad: appData.requestedLoad || "",
        connectionPoint: appData.connectionPointLocation || appData.connectionPoint || "",
        pipeDiameter: appData.pipeDiameter || "",
        pipeMaterial: appData.pipeMaterial || "",
        waterSupplyRestriction: appData.waterSupplyRestriction || false,
        privateNetworkPermission: appData.privateNetworkPermission || false,
        
        // Параметры потребления воды
        maxWaterConsumptionLps: appData.maxWaterConsumptionLps || "",
        maxWaterConsumptionM3h: appData.maxWaterConsumptionM3h || "",
        maxWaterConsumptionM3day: appData.maxWaterConsumptionM3day || "",
        
        // Пожаротушение
        fireExtinguishingExternal: appData.fireExtinguishingExternal || "",
        fireExtinguishingInternal: appData.fireExtinguishingInternal || "",
        fireHydrantsCount: appData.fireHydrantsCount || "",
        fireExtinguishingAutomatic: appData.fireExtinguishingAutomatic || "",
        
        // Водоотведение
        wastewaterLps: appData.wastewaterLps || "",
        wastewaterM3h: appData.wastewaterM3h || "",
        wastewaterM3day: appData.wastewaterM3day || "",
        
        // Уведомление
        notificationMethod: appData.notificationMethod || "",
        
        // Ход подключения
        receiptDate: new Date(application.createdAt).toLocaleDateString("ru-RU"),
        technicalConditionsIssueDate: "",
        technicalConditionsNumber: "",
        connectionAgreementIssueDate: "",
        connectionAgreementNumber: "",
        designAgreementIssueDate: "",
        designAgreementNumber: "",
        costWithVAT: "",
      });
      
      // Показываем информацию о заявке
      const fullName = [appData.lastName, appData.firstName, appData.middleName].filter(Boolean).join(" ") || 
                      application.user?.name || application.user?.email;
      setApplicationInfo(`Данные загружены из заявки: ${fullName}`);
      
    } catch (err) {
      console.error("Error loading application:", err);
      setError("Не удалось загрузить данные заявки");
    } finally {
      setIsLoadingApplication(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Сначала загружаем файл договора, если есть
      let contractFileUrl = null;
      let contractFileName = null;
      let contractFileSize = null;
      let contractFileMimeType = null;

      if (contractFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", contractFile);

        const uploadResponse = await fetch("/api/admin/contracts/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          contractFileUrl = uploadData.url;
          contractFileName = uploadData.fileName;
          contractFileSize = uploadData.fileSize;
          contractFileMimeType = uploadData.mimeType;
        } else {
          throw new Error("Ошибка при загрузке файла договора");
        }
      }

      // Создаем договор
      const response = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          applicationId: selectedApplicationId || undefined, // Связываем с заявкой, если создаем из неё
          contractFileUrl,
          contractFileName,
          contractFileSize,
          contractFileMimeType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/admin/contracts");
        router.refresh();
      } else {
        setError(data.error || "Ошибка при создании договора");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error creating contract:", err);
      setError("Произошла ошибка. Попробуйте позже.");
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "abonent" as Tab, label: "Абонент", icon: User },
    { id: "object" as Tab, label: "Объект", icon: Building },
    { id: "params" as Tab, label: "Параметры присоединение", icon: Settings },
    { id: "progress" as Tab, label: "Ход подключения", icon: FileText },
  ];

  return (
    <div className="container py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Создать договор</h1>
        <p className="text-gray-600">Заполните форму для создания договора на технологическое присоединение</p>
      </div>

      {/* Выбор заявки для автозаполнения */}
      <Card className="mb-4 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 mb-3">
            <FileCheck className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-700">Заполнить из заявки</span>
            <span className="text-sm text-gray-500">(опционально)</span>
          </div>
          
          <div className="relative">
            {selectedApplicationId && applicationInfo ? (
              // Показываем выбранную заявку
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700">{applicationInfo}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearApplication}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Показываем поле поиска/выбора
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="flex items-center border rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => setIsApplicationDropdownOpen(!isApplicationDropdownOpen)}
                >
                  <Search className="h-4 w-4 text-gray-400 ml-3" />
                  <Input
                    placeholder="Поиск по ФИО, адресу или телефону..."
                    value={applicationSearch}
                    onChange={(e) => {
                      setApplicationSearch(e.target.value);
                      setIsApplicationDropdownOpen(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsApplicationDropdownOpen(true);
                    }}
                    className="border-0 focus-visible:ring-0"
                  />
                  {isLoadingApplications ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-3" />
                  ) : (
                    <ChevronDown className={`h-4 w-4 text-gray-400 mr-3 transition-transform ${isApplicationDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>

                {/* Выпадающий список заявок */}
                {isApplicationDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {filteredApplications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {isLoadingApplications ? "Загрузка..." : "Заявки не найдены"}
                      </div>
                    ) : (
                      filteredApplications.map((app) => (
                        <div
                          key={app.id}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                          onClick={() => handleSelectApplication(app.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{app.fullName}</div>
                              {app.address && (
                                <div className="text-sm text-gray-600 mt-1">{app.address}</div>
                              )}
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                {app.phone && <span>📞 {app.phone}</span>}
                                <span>📅 {new Date(app.createdAt).toLocaleDateString("ru-RU")}</span>
                              </div>
                            </div>
                            <div className="ml-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                app.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                app.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                                app.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {app.status === "COMPLETED" ? "Завершена" :
                                 app.status === "IN_PROGRESS" ? "В работе" :
                                 app.status === "PENDING" ? "Ожидает" : app.status}
                              </span>
                            </div>
                          </div>
                          {app.serviceTitle && (
                            <div className="text-xs text-blue-600 mt-1">{app.serviceTitle}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {isLoadingApplication && (
            <div className="flex items-center gap-2 mt-3 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Загрузка данных...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Информация</CardTitle>
          <CardDescription>Заполните все необходимые поля</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Вкладки */}
          <div className="flex gap-2 mb-6 border-b">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {error}
              </div>
            )}

            {/* Вкладка: Абонент */}
            {activeTab === "abonent" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Информация об абоненте</h3>
                
                {/* Номер и дата договора */}
                <div className="grid md:grid-cols-2 gap-4 mb-4 border-b pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">
                      Номер договора <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contractNumber"
                      value={formData.contractNumber}
                      onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                      required
                      placeholder="ДГ-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractDate">
                      Дата договора <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contractDate"
                      type="text"
                      value={formData.contractDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9.]/g, '');
                        if (value.length === 2 && !value.includes('.')) value = value + '.';
                        if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                        setFormData({ ...formData, contractDate: value });
                      }}
                      placeholder="дд.мм.гггг"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Фамилия <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        Имя <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Отчество</Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Дата рождения</Label>
                      <Input
                        id="birthDate"
                        type="text"
                        value={formData.birthDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          if (value.length === 2 && !value.includes('.')) value = value + '.';
                          if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                          setFormData({ ...formData, birthDate: value });
                        }}
                        placeholder="дд.мм.гггг"
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registrationAddress">Адрес регистрации</Label>
                      <Textarea
                        id="registrationAddress"
                        value={formData.registrationAddress}
                        onChange={(e) => setFormData({ ...formData, registrationAddress: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Паспортные данные</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="passportSeries">Серия</Label>
                          <Input
                            id="passportSeries"
                            value={formData.passportSeries}
                            onChange={(e) => setFormData({ ...formData, passportSeries: e.target.value })}
                            maxLength={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passportNumber">Номер</Label>
                          <Input
                            id="passportNumber"
                            value={formData.passportNumber}
                            onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="passportIssuedBy">Выдан</Label>
                        <Textarea
                          id="passportIssuedBy"
                          value={formData.passportIssuedBy}
                          onChange={(e) => setFormData({ ...formData, passportIssuedBy: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="passportIssueDate">Дата выдачи</Label>
                          <Input
                            id="passportIssueDate"
                            type="text"
                            value={formData.passportIssueDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9.]/g, '');
                              if (value.length === 2 && !value.includes('.')) value = value + '.';
                              if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                              setFormData({ ...formData, passportIssueDate: value });
                            }}
                            placeholder="дд.мм.гггг"
                            maxLength={10}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passportDivisionCode">Код подразделения</Label>
                          <Input
                            id="passportDivisionCode"
                            value={formData.passportDivisionCode}
                            onChange={(e) => setFormData({ ...formData, passportDivisionCode: e.target.value })}
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон для связи</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+7 (978) 123-45-67"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Дополнительные данные</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="inn">ИНН</Label>
                          <Input
                            id="inn"
                            value={formData.inn}
                            onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                            maxLength={12}
                            placeholder="123456789012"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="snils">СНИЛС</Label>
                          <Input
                            id="snils"
                            value={formData.snils}
                            onChange={(e) => setFormData({ ...formData, snils: e.target.value })}
                            maxLength={14}
                            placeholder="123-456-789 01"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {/* Вкладка: Объект */}
            {activeTab === "object" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="objectType">Тип объекта</Label>
                    <select
                      id="objectType"
                      value={formData.objectType}
                      onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Выберите тип</option>
                      <option value="Жилой дом">Жилой дом</option>
                      <option value="Квартира">Квартира</option>
                      <option value="Коммерческий объект">Коммерческий объект</option>
                      <option value="Промышленный объект">Промышленный объект</option>
                      <option value="Земельный участок">Земельный участок</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objectPurpose">Назначение объекта</Label>
                    <select
                      id="objectPurpose"
                      value={formData.objectPurpose}
                      onChange={(e) => setFormData({ ...formData, objectPurpose: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Выберите назначение</option>
                      <option value="Жилое">Жилое</option>
                      <option value="Коммерческое">Коммерческое</option>
                      <option value="Промышленное">Промышленное</option>
                      <option value="Общественное">Общественное</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cadastralNumber">Кадастровый номер</Label>
                  <Input
                    id="cadastralNumber"
                    value={formData.cadastralNumber}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9:]/g, '');
                      const digitsOnly = value.replace(/:/g, '');
                      let formatted = '';
                      for (let i = 0; i < digitsOnly.length; i++) {
                        formatted += digitsOnly[i];
                        if ((i === 1 || i === 3 || i === 9) && i < digitsOnly.length - 1) formatted += ':';
                      }
                      setFormData({ ...formData, cadastralNumber: formatted });
                    }}
                    placeholder="XX:XX:XXXXXX:XXXX"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectAddress">Адрес объекта</Label>
                  <Textarea
                    id="objectAddress"
                    value={formData.objectAddress}
                    onChange={(e) => setFormData({ ...formData, objectAddress: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectArea">Площадь объекта (кв. м)</Label>
                  <Input
                    id="objectArea"
                    type="number"
                    value={formData.objectArea}
                    onChange={(e) => setFormData({ ...formData, objectArea: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Дополнительная информация</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="requestBasis">Основание обращения с запросом</Label>
                      <select
                        id="requestBasis"
                        value={formData.requestBasis}
                        onChange={(e) => setFormData({ ...formData, requestBasis: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Выберите основание</option>
                        <option value="owner">Правообладатель земельного участка</option>
                        <option value="trusted">Доверенное лицо</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="constructionType">В связи с чем (тип работ)</Label>
                      <select
                        id="constructionType"
                        value={formData.constructionType}
                        onChange={(e) => setFormData({ ...formData, constructionType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Выберите тип работ</option>
                        <option value="новое строительство">Новое строительство</option>
                        <option value="реконструкция">Реконструкция</option>
                        <option value="модернизация">Модернизация</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resourceType">Необходимые виды ресурсов</Label>
                      <select
                        id="resourceType"
                        value={formData.resourceType}
                        onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Выберите вид ресурсов</option>
                        <option value="получение питьевой воды">Получение питьевой воды</option>
                        <option value="получение технической воды">Получение технической воды</option>
                        <option value="сброс хозяйственно-бытовых сточных вод">Сброс хозяйственно-бытовых сточных вод</option>
                        <option value="получение питьевой воды, сброс хозяйственно-бытовых сточных вод">Получение воды и сброс сточных вод</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plannedCommissioningDate">Планируемый срок ввода в эксплуатацию</Label>
                      <Input
                        id="plannedCommissioningDate"
                        type="text"
                        value={formData.plannedCommissioningDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          if (value.length === 2 && !value.includes('.')) value = value + '.';
                          if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                          setFormData({ ...formData, plannedCommissioningDate: value });
                        }}
                        placeholder="дд.мм.гггг"
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="objectBasis">Объект принадлежит на основании</Label>
                      <Textarea
                        id="objectBasis"
                        value={formData.objectBasis}
                        onChange={(e) => setFormData({ ...formData, objectBasis: e.target.value })}
                        rows={2}
                        placeholder="Документ о праве собственности, договор аренды и т.д."
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Параметры строительства</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="objectHeight">Высота объекта (м)</Label>
                      <Input
                        id="objectHeight"
                        type="number"
                        value={formData.objectHeight}
                        onChange={(e) => setFormData({ ...formData, objectHeight: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, objectFloors: e.target.value })}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="networkLength">Протяженность сети (м)</Label>
                      <Input
                        id="networkLength"
                        type="number"
                        value={formData.networkLength}
                        onChange={(e) => setFormData({ ...formData, networkLength: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Служебная информация</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="siteMaster">Мастер участка</Label>
                      <Input
                        id="siteMaster"
                        value={formData.siteMaster}
                        onChange={(e) => setFormData({ ...formData, siteMaster: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Должность</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка: Параметры присоединения */}
            {activeTab === "params" && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Вид подключения</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.hasWaterSupply}
                        onChange={(e) => setFormData({ ...formData, hasWaterSupply: e.target.checked })}
                        className="w-5 h-5"
                      />
                      Водопровод
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.hasSewerage}
                        onChange={(e) => setFormData({ ...formData, hasSewerage: e.target.checked })}
                        className="w-5 h-5"
                      />
                      Канализация
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Тип подключения</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="connectionMethod"
                        value="by-length"
                        checked={formData.connectionMethod === "by-length"}
                        onChange={(e) => setFormData({ ...formData, connectionMethod: e.target.value, wellType: "" })}
                        className="w-4 h-4"
                      />
                      по протяженности
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="connectionMethod"
                        value="with-well"
                        checked={formData.connectionMethod === "with-well"}
                        onChange={(e) => setFormData({ ...formData, connectionMethod: e.target.value })}
                        className="w-4 h-4"
                      />
                      с колодцем
                    </label>
                  </div>
                </div>

                {formData.connectionMethod === "with-well" && (
                  <div>
                    <Label className="mb-3 block">Колодец</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="wellType"
                          value="existing"
                          checked={formData.wellType === "existing"}
                          onChange={(e) => setFormData({ ...formData, wellType: e.target.value })}
                          className="w-4 h-4"
                        />
                        Существующий
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="wellType"
                          value="planned"
                          checked={formData.wellType === "planned"}
                          onChange={(e) => setFormData({ ...formData, wellType: e.target.value })}
                          className="w-4 h-4"
                        />
                        Проектируемый
                      </label>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="requestedLoad">Запрошенная нагрузка (м³)</Label>
                  <Input
                    id="requestedLoad"
                    type="number"
                    value={formData.requestedLoad}
                    onChange={(e) => setFormData({ ...formData, requestedLoad: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connectionPoint">Расположение точки подключения</Label>
                  <Textarea
                    id="connectionPoint"
                    value={formData.connectionPoint}
                    onChange={(e) => setFormData({ ...formData, connectionPoint: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pipeDiameter">Диаметр водопровода (мм)</Label>
                    <Input
                      id="pipeDiameter"
                      type="number"
                      value={formData.pipeDiameter}
                      onChange={(e) => setFormData({ ...formData, pipeDiameter: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pipeMaterial">Материал труб</Label>
                    <select
                      id="pipeMaterial"
                      value={formData.pipeMaterial}
                      onChange={(e) => setFormData({ ...formData, pipeMaterial: e.target.value })}
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

                {/* Потребление холодной воды */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Потребление холодной воды</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxWaterConsumptionLps">л/с</Label>
                      <Input
                        id="maxWaterConsumptionLps"
                        type="number"
                        value={formData.maxWaterConsumptionLps}
                        onChange={(e) => setFormData({ ...formData, maxWaterConsumptionLps: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxWaterConsumptionM3h">м³/час</Label>
                      <Input
                        id="maxWaterConsumptionM3h"
                        type="number"
                        value={formData.maxWaterConsumptionM3h}
                        onChange={(e) => setFormData({ ...formData, maxWaterConsumptionM3h: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxWaterConsumptionM3day">м³/сут</Label>
                      <Input
                        id="maxWaterConsumptionM3day"
                        type="number"
                        value={formData.maxWaterConsumptionM3day}
                        onChange={(e) => setFormData({ ...formData, maxWaterConsumptionM3day: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Пожаротушение */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Нужды пожаротушения</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fireExtinguishingExternal">Наружное (л/с)</Label>
                      <Input
                        id="fireExtinguishingExternal"
                        type="number"
                        value={formData.fireExtinguishingExternal}
                        onChange={(e) => setFormData({ ...formData, fireExtinguishingExternal: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fireExtinguishingInternal">Внутреннее (л/с)</Label>
                      <Input
                        id="fireExtinguishingInternal"
                        type="number"
                        value={formData.fireExtinguishingInternal}
                        onChange={(e) => setFormData({ ...formData, fireExtinguishingInternal: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fireHydrantsCount">Кол-во пожарных кранов</Label>
                      <Input
                        id="fireHydrantsCount"
                        type="number"
                        value={formData.fireHydrantsCount}
                        onChange={(e) => setFormData({ ...formData, fireHydrantsCount: e.target.value })}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fireExtinguishingAutomatic">Автоматическое (л/с)</Label>
                      <Input
                        id="fireExtinguishingAutomatic"
                        type="number"
                        value={formData.fireExtinguishingAutomatic}
                        onChange={(e) => setFormData({ ...formData, fireExtinguishingAutomatic: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Водоотведение */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Водоотведение</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wastewaterLps">л/с</Label>
                      <Input
                        id="wastewaterLps"
                        type="number"
                        value={formData.wastewaterLps}
                        onChange={(e) => setFormData({ ...formData, wastewaterLps: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wastewaterM3h">м³/час</Label>
                      <Input
                        id="wastewaterM3h"
                        type="number"
                        value={formData.wastewaterM3h}
                        onChange={(e) => setFormData({ ...formData, wastewaterM3h: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wastewaterM3day">м³/сут</Label>
                      <Input
                        id="wastewaterM3day"
                        type="number"
                        value={formData.wastewaterM3day}
                        onChange={(e) => setFormData({ ...formData, wastewaterM3day: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Дополнительные опции */}
                <div className="border-t pt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.waterSupplyRestriction}
                      onChange={(e) => setFormData({ ...formData, waterSupplyRestriction: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Ограничение водоснабжения
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privateNetworkPermission}
                      onChange={(e) => setFormData({ ...formData, privateNetworkPermission: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Требуется разрешение на подключение к частным сетям
                  </label>
                </div>

                {/* Способ уведомления */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="notificationMethod">Способ уведомления о результате</Label>
                    <select
                      id="notificationMethod"
                      value={formData.notificationMethod}
                      onChange={(e) => setFormData({ ...formData, notificationMethod: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Выберите способ</option>
                      <option value="на адрес электронной почты">На адрес электронной почты</option>
                      <option value="письмом посредством почтовой связи">Письмом по почте</option>
                      <option value="лично">Лично</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка: Ход подключения */}
            {activeTab === "progress" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="receiptDate">Дата поступления</Label>
                  <Input
                    id="receiptDate"
                    type="text"
                    value={formData.receiptDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      if (value.length === 2 && !value.includes('.')) value = value + '.';
                      if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                      setFormData({ ...formData, receiptDate: value });
                    }}
                    placeholder="дд.мм.гггг"
                    maxLength={10}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Технические условия</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="technicalConditionsIssueDate">Дата выдачи</Label>
                      <Input
                        id="technicalConditionsIssueDate"
                        type="text"
                        value={formData.technicalConditionsIssueDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          if (value.length === 2 && !value.includes('.')) value = value + '.';
                          if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                          setFormData({ ...formData, technicalConditionsIssueDate: value });
                        }}
                        placeholder="дд.мм.гггг"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="technicalConditionsNumber">№ тех. условий</Label>
                      <Input
                        id="technicalConditionsNumber"
                        value={formData.technicalConditionsNumber}
                        onChange={(e) => setFormData({ ...formData, technicalConditionsNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Договор присоединения</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="connectionAgreementIssueDate">Дата выдачи</Label>
                      <Input
                        id="connectionAgreementIssueDate"
                        type="text"
                        value={formData.connectionAgreementIssueDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          if (value.length === 2 && !value.includes('.')) value = value + '.';
                          if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                          setFormData({ ...formData, connectionAgreementIssueDate: value });
                        }}
                        placeholder="дд.мм.гггг"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="connectionAgreementNumber">№ договора</Label>
                      <Input
                        id="connectionAgreementNumber"
                        value={formData.connectionAgreementNumber}
                        onChange={(e) => setFormData({ ...formData, connectionAgreementNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Договор проектных работ</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designAgreementIssueDate">Дата выдачи</Label>
                      <Input
                        id="designAgreementIssueDate"
                        type="text"
                        value={formData.designAgreementIssueDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          if (value.length === 2 && !value.includes('.')) value = value + '.';
                          if (value.length === 5 && value.split('.').length === 2) value = value + '.';
                          setFormData({ ...formData, designAgreementIssueDate: value });
                        }}
                        placeholder="дд.мм.гггг"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designAgreementNumber">№ договора</Label>
                      <Input
                        id="designAgreementNumber"
                        value={formData.designAgreementNumber}
                        onChange={(e) => setFormData({ ...formData, designAgreementNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costWithVAT">Стоимость с НДС</Label>
                  <div className="flex gap-2">
                    <Input
                      id="costWithVAT"
                      type="number"
                      value={formData.costWithVAT}
                      onChange={(e) => setFormData({ ...formData, costWithVAT: e.target.value })}
                    />
                    <span className="self-center">рублей</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Файл договора</h4>
                  <div className="space-y-2">
                    <Label htmlFor="contractFile">Загрузить договор</Label>
                    <Input
                      id="contractFile"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setContractFile(file);
                        }
                      }}
                    />
                    {contractFile && (
                      <p className="text-sm text-gray-600">
                        Выбран файл: {contractFile.name} ({(contractFile.size / 1024 / 1024).toFixed(2)} МБ)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки навигации и отправки */}
            <div className="flex justify-between pt-6 border-t">
              <div className="flex gap-2">
                {tabs.map((tab, index) => {
                  const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                  if (index < currentIndex) {
                    return (
                      <Button
                        key={tab.id}
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab(tab.id)}
                      >
                        {tab.label}
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>
              <div className="flex gap-2">
                {activeTab !== tabs[tabs.length - 1].id && (
                  <Button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1].id);
                      }
                    }}
                  >
                    Далее
                  </Button>
                )}
                {activeTab === tabs[tabs.length - 1].id && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
