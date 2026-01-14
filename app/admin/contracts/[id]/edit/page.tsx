"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, User, Building, Settings, FileText, Upload } from "lucide-react";
import Link from "next/link";

type Tab = "abonent" | "object" | "params" | "progress";

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("abonent");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
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
    objectType: "",
    objectPurpose: "",
    cadastralNumber: "",
    objectAddress: "",
    objectArea: "",
    siteMaster: "",
    position: "",
    objectBasis: "",
    hasWaterSupply: false,
    hasSewerage: false,
    connectionType: "",
    wellType: "",
    requestedLoad: "",
    connectionPoint: "",
    pipeDiameter: "",
    pipeMaterial: "",
    waterSupplyRestriction: false,
    privateNetworkPermission: false,
    receiptDate: "",
    technicalConditionsIssueDate: "",
    technicalConditionsNumber: "",
    connectionAgreementIssueDate: "",
    connectionAgreementNumber: "",
    designAgreementIssueDate: "",
    designAgreementNumber: "",
    costWithVAT: "",
    contractFileUrl: "",
    contractFileName: "",
    contractFileSize: 0,
    contractFileMimeType: "",
  });

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/admin/contracts/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          const contract = data.contract;
          setFormData({
            lastName: contract.lastName || "",
            firstName: contract.firstName || "",
            middleName: contract.middleName || "",
            birthDate: contract.birthDate || "",
            registrationAddress: contract.registrationAddress || "",
            passportSeries: contract.passportSeries || "",
            passportNumber: contract.passportNumber || "",
            passportIssuedBy: contract.passportIssuedBy || "",
            passportIssueDate: contract.passportIssueDate || "",
            passportDivisionCode: contract.passportDivisionCode || "",
            phone: contract.phone || "",
            objectType: contract.objectType || "",
            objectPurpose: contract.objectPurpose || "",
            cadastralNumber: contract.cadastralNumber || "",
            objectAddress: contract.objectAddress || "",
            objectArea: contract.objectArea || "",
            siteMaster: contract.siteMaster || "",
            position: contract.position || "",
            objectBasis: contract.objectBasis || "",
            hasWaterSupply: contract.hasWaterSupply || false,
            hasSewerage: contract.hasSewerage || false,
            connectionType: contract.connectionType || "",
            wellType: contract.wellType || "",
            requestedLoad: contract.requestedLoad || "",
            connectionPoint: contract.connectionPoint || "",
            pipeDiameter: contract.pipeDiameter || "",
            pipeMaterial: contract.pipeMaterial || "",
            waterSupplyRestriction: contract.waterSupplyRestriction || false,
            privateNetworkPermission: contract.privateNetworkPermission || false,
            receiptDate: contract.receiptDate || "",
            technicalConditionsIssueDate: contract.technicalConditionsIssueDate || "",
            technicalConditionsNumber: contract.technicalConditionsNumber || "",
            connectionAgreementIssueDate: contract.connectionAgreementIssueDate || "",
            connectionAgreementNumber: contract.connectionAgreementNumber || "",
            designAgreementIssueDate: contract.designAgreementIssueDate || "",
            designAgreementNumber: contract.designAgreementNumber || "",
            costWithVAT: contract.costWithVAT || "",
            contractFileUrl: contract.contractFileUrl || "",
            contractFileName: contract.contractFileName || "",
            contractFileSize: contract.contractFileSize || 0,
            contractFileMimeType: contract.contractFileMimeType || "",
          });
        } else {
          alert("Договор не найден");
          router.push("/admin/contracts");
        }
      } catch (error) {
        console.error("Error fetching contract:", error);
        alert("Ошибка при загрузке договора");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchContract();
    }
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let contractFileUrl: string | null = formData.contractFileUrl || null;
      let contractFileName: string | null = formData.contractFileName || null;
      let contractFileSize: number | null = formData.contractFileSize || null;
      let contractFileMimeType: string | null = formData.contractFileMimeType || null;

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

      const response = await fetch(`/api/admin/contracts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
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
        setError(data.error || "Ошибка при обновлении договора");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error updating contract:", err);
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

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // Используем ту же форму, что и при создании, но с загруженными данными
  // Для краткости, скопируем структуру из create/page.tsx, но с изменениями
  return (
    <div className="container py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Редактировать договор</h1>
        <p className="text-gray-600">Измените данные договора</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация</CardTitle>
          <CardDescription>Измените необходимые поля</CardDescription>
        </CardHeader>
        <CardContent>
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
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Информация об абоненте</h3>
                  
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
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка: Объект */}
            {activeTab === "object" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="objectType">Объект</Label>
                    <Input
                      id="objectType"
                      value={formData.objectType}
                      onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objectPurpose">Назначение объекта</Label>
                    <Input
                      id="objectPurpose"
                      value={formData.objectPurpose}
                      onChange={(e) => setFormData({ ...formData, objectPurpose: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cadastralNumber">Кадастровый номер</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cadastralNumber"
                      value={formData.cadastralNumber}
                      onChange={(e) => setFormData({ ...formData, cadastralNumber: e.target.value })}
                      placeholder="XX:XX:XXXXXX:XXXX"
                    />
                    <Button type="button" variant="outline">К КАРТЕ</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Адрес объекта</h4>
                  <div className="space-y-2">
                    <Label htmlFor="objectAddress">Введите адрес</Label>
                    <Input
                      id="objectAddress"
                      value={formData.objectAddress}
                      onChange={(e) => setFormData({ ...formData, objectAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectBasis">Объект принадлежит на основании</Label>
                  <Textarea
                    id="objectBasis"
                    value={formData.objectBasis}
                    onChange={(e) => setFormData({ ...formData, objectBasis: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectArea">Площадь объекта</Label>
                  <div className="flex gap-2">
                    <Input
                      id="objectArea"
                      type="number"
                      value={formData.objectArea}
                      onChange={(e) => setFormData({ ...formData, objectArea: e.target.value })}
                    />
                    <span className="self-center">кв. метров</span>
                  </div>
                </div>

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
            )}

            {/* Вкладка: Параметры присоединения */}
            {activeTab === "params" && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Вид подключения</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.hasWaterSupply}
                        onChange={(e) => setFormData({ ...formData, hasWaterSupply: e.target.checked })}
                      />
                      Водопровод
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.hasSewerage}
                        onChange={(e) => setFormData({ ...formData, hasSewerage: e.target.checked })}
                      />
                      Канализация
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Тип подключения</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="connectionType"
                        value="by-length"
                        checked={formData.connectionType === "by-length"}
                        onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
                      />
                      по протяженности
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="connectionType"
                        value="with-well"
                        checked={formData.connectionType === "with-well"}
                        onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
                      />
                      с колодцем
                    </label>
                  </div>
                </div>

                {formData.connectionType === "with-well" && (
                  <div>
                    <Label className="mb-3 block">Колодец</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="wellType"
                          value="existing"
                          checked={formData.wellType === "existing"}
                          onChange={(e) => setFormData({ ...formData, wellType: e.target.value })}
                        />
                        Существующий
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="wellType"
                          value="planned"
                          checked={formData.wellType === "planned"}
                          onChange={(e) => setFormData({ ...formData, wellType: e.target.value })}
                        />
                        Проектируемый
                      </label>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="requestedLoad">Запрошенная нагрузка</Label>
                  <div className="flex gap-2">
                    <Input
                      id="requestedLoad"
                      type="number"
                      value={formData.requestedLoad}
                      onChange={(e) => setFormData({ ...formData, requestedLoad: e.target.value })}
                    />
                    <span className="self-center">м. куб.</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connectionPoint">Расположение точки подключения</Label>
                  <Textarea
                    id="connectionPoint"
                    value={formData.connectionPoint}
                    onChange={(e) => setFormData({ ...formData, connectionPoint: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pipeDiameter">Диаметр водопровода</Label>
                    <div className="flex gap-2">
                      <Input
                        id="pipeDiameter"
                        type="number"
                        value={formData.pipeDiameter}
                        onChange={(e) => setFormData({ ...formData, pipeDiameter: e.target.value })}
                      />
                      <span className="self-center">мм</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pipeMaterial">Материал труб</Label>
                    <Input
                      id="pipeMaterial"
                      value={formData.pipeMaterial}
                      onChange={(e) => setFormData({ ...formData, pipeMaterial: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.waterSupplyRestriction}
                      onChange={(e) => setFormData({ ...formData, waterSupplyRestriction: e.target.checked })}
                    />
                    Ограничение водоснабжения
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.privateNetworkPermission}
                      onChange={(e) => setFormData({ ...formData, privateNetworkPermission: e.target.checked })}
                    />
                    Требуется разрешение на подключение к частным сетям
                  </label>
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
                  {formData.contractFileUrl && (
                    <div className="mb-2 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        Текущий файл: {formData.contractFileName || "договор.pdf"}
                      </p>
                      <a
                        href={formData.contractFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Открыть текущий файл
                      </a>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="contractFile">Загрузить новый договор</Label>
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
                  <>
                    <Button type="button" variant="outline" onClick={() => router.push("/admin/contracts")}>
                      Отмена
                    </Button>
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
                  </>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
