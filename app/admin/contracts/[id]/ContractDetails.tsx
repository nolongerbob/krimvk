"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCheck, Upload, X, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface Contract {
  id: string;
  userId: string | null;
  contractNumber: string;
  contractDate: string | null;
  status: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  birthDate?: string | null;
  registrationAddress?: string | null;
  passportSeries?: string | null;
  passportNumber?: string | null;
  passportIssuedBy?: string | null;
  passportIssueDate?: string | null;
  passportDivisionCode?: string | null;
  phone?: string | null;
  objectType?: string | null;
  objectPurpose?: string | null;
  cadastralNumber?: string | null;
  objectAddress?: string | null;
  objectArea?: string | null;
  siteMaster?: string | null;
  position?: string | null;
  objectBasis?: string | null;
  hasWaterSupply: boolean;
  hasSewerage: boolean;
  connectionType?: string | null;
  wellType?: string | null;
  requestedLoad?: string | null;
  connectionPoint?: string | null;
  pipeDiameter?: string | null;
  pipeMaterial?: string | null;
  waterSupplyRestriction: boolean;
  privateNetworkPermission: boolean;
  receiptDate?: string | null;
  technicalConditionsIssueDate?: string | null;
  technicalConditionsNumber?: string | null;
  connectionAgreementIssueDate?: string | null;
  connectionAgreementNumber?: string | null;
  designAgreementIssueDate?: string | null;
  designAgreementNumber?: string | null;
  costWithVAT?: string | null;
  contractFileUrl?: string | null;
  contractFileName?: string | null;
  contractFileSize?: number | null;
  contractFileMimeType?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: ContractDocument[];
}

interface ContractDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface ContractDetailsProps {
  contract: Contract;
}

const DOCUMENT_TYPES = [
  { id: "application", label: "ЗАЯВЛЕНИЯ" },
  { id: "pre-calculation", label: "ПРЕД-РАСЧЕТ" },
  { id: "tu", label: "ТУ" },
  { id: "contract-tp", label: "Договор ТП" },
  { id: "contract-project", label: "Договор ПРОЕКТ" },
  { id: "act-project", label: "Акт ПРОЕКТ" },
  { id: "vr", label: "ВР" },
];

const getDocumentTypeLabel = (type: string): string => {
  const docType = DOCUMENT_TYPES.find((dt) => dt.id === type);
  return docType?.label || type;
};

export function ContractDetails({ contract: initialContract }: ContractDetailsProps) {
  const router = useRouter();
  const [contract, setContract] = useState(initialContract);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("application");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    // Загружаем документы при монтировании
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/admin/contracts/${contract.id}/documents`);
      if (response.ok) {
        const data = await response.json();
        setContract((prev) => ({ ...prev, documents: data.documents }));
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert("Выберите файл");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("documentType", selectedDocumentType);

      const response = await fetch(
        `/api/admin/contracts/${contract.id}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContract((prev) => ({
          ...prev,
          documents: [...(prev.documents || []), data.document],
        }));
        setUploadFile(null);
        setShowUploadForm(false);
        // Сбрасываем input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при загрузке файла");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот документ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/contracts/${contract.id}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setContract((prev) => ({
          ...prev,
          documents: (prev.documents || []).filter((d) => d.id !== documentId),
        }));
      } else {
        alert("Ошибка при удалении документа");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Ошибка при удалении документа");
    }
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    try {
      if (dateStr.includes(".")) {
        return dateStr;
      }
      return new Date(dateStr).toLocaleDateString("ru-RU");
    } catch {
      return dateStr;
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: "В ожидании",
      IN_PROGRESS: "В работе",
      COMPLETED: "Завершен",
      CANCELLED: "Отменен",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  // Группируем документы по типам
  const documentsByType = (contract.documents || []).reduce(
    (acc, doc) => {
      if (!acc[doc.documentType]) {
        acc[doc.documentType] = [];
      }
      acc[doc.documentType].push(doc);
      return acc;
    },
    {} as Record<string, ContractDocument[]>
  );

  return (
    <div className="space-y-6">
      {/* Верхняя панель с основной информацией */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  Договор № {contract.contractNumber}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    contract.status
                  )}`}
                >
                  {getStatusLabel(contract.status)}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Абонент:</span>
                  <span className="text-gray-900">
                    {contract.lastName} {contract.firstName} {contract.middleName || ""}
                  </span>
                </div>
                {contract.phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Телефон:</span>
                    <span className="text-gray-900">{contract.phone}</span>
                  </div>
                )}
                {contract.contractDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Дата договора:</span>
                    <span className="text-gray-900">{formatDate(contract.contractDate)}</span>
                  </div>
                )}
              </div>
            </div>
            {contract.receiptDate && (
              <div className="text-right">
                <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg text-lg font-bold shadow-md">
                  ПОДКЛЮЧЕН {formatDate(contract.receiptDate)}
                </div>
              </div>
            )}
          </div>
          {contract.objectAddress && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-700">Адрес объекта:</span>
                <span className="text-gray-900">{contract.objectAddress}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Таблица с информацией о договоре */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <tbody>
                {/* Информация об абоненте */}
                <tr>
                  <td colSpan={2} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-300">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-blue-500 rounded"></div>
                      <span className="font-bold text-blue-900 text-lg">Информация об абоненте</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 bg-gray-50 text-gray-700 font-semibold w-1/3 border-r border-gray-200">Фамилия</td>
                  <td className="p-4 text-gray-900 font-medium">{contract.lastName || "—"}</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Имя</td>
                  <td className="p-4 text-gray-900 font-medium">{contract.firstName || "—"}</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Отчество</td>
                  <td className="p-4 text-gray-900 font-medium">{contract.middleName || "—"}</td>
                </tr>
                {contract.birthDate && (
                  <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Дата рождения</td>
                    <td className="p-4 text-gray-900">{formatDate(contract.birthDate)}</td>
                  </tr>
                )}
                {contract.registrationAddress && (
                  <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Адрес регистрации</td>
                    <td className="p-4 text-gray-900">{contract.registrationAddress}</td>
                  </tr>
                )}
                {contract.phone && (
                  <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Телефон</td>
                    <td className="p-4 text-gray-900 font-medium">{contract.phone}</td>
                  </tr>
                )}
                {(contract.passportSeries || contract.passportNumber) && (
                  <>
                    <tr>
                      <td colSpan={2} className="p-2 bg-blue-50/50 border-b border-blue-100">
                        <span className="font-semibold text-blue-800 text-sm ml-2">Паспортные данные</span>
                      </td>
                    </tr>
                    {contract.passportSeries && (
                      <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Серия</td>
                        <td className="p-4 text-gray-900 font-medium">{contract.passportSeries}</td>
                      </tr>
                    )}
                    {contract.passportNumber && (
                      <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Номер</td>
                        <td className="p-4 text-gray-900 font-medium">{contract.passportNumber}</td>
                      </tr>
                    )}
                    {contract.passportIssuedBy && (
                      <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Выдан</td>
                        <td className="p-4 text-gray-900">{contract.passportIssuedBy}</td>
                      </tr>
                    )}
                    {contract.passportIssueDate && (
                      <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Дата выдачи</td>
                        <td className="p-4 text-gray-900">{formatDate(contract.passportIssueDate)}</td>
                      </tr>
                    )}
                    {contract.passportDivisionCode && (
                      <tr className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Код подразделения</td>
                        <td className="p-4 text-gray-900 font-medium">{contract.passportDivisionCode}</td>
                      </tr>
                    )}
                  </>
                )}

                {/* Информация об объекте */}
                <tr>
                  <td colSpan={2} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-300 border-t-2 border-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-green-500 rounded"></div>
                      <span className="font-bold text-green-900 text-lg">Информация об объекте</span>
                    </div>
                  </td>
                </tr>
                {contract.objectType && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Объект</td>
                    <td className="p-4 text-gray-900 font-medium">{contract.objectType}</td>
                  </tr>
                )}
                {contract.objectPurpose && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Назначение объекта</td>
                    <td className="p-4 text-gray-900">{contract.objectPurpose}</td>
                  </tr>
                )}
                {contract.cadastralNumber && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Кадастровый номер</td>
                    <td className="p-4 text-gray-900 font-medium">{contract.cadastralNumber}</td>
                  </tr>
                )}
                {contract.objectAddress && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Адрес объекта</td>
                    <td className="p-4 text-gray-900">{contract.objectAddress}</td>
                  </tr>
                )}
                {contract.objectArea && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Площадь объекта</td>
                    <td className="p-4 text-gray-900 font-medium">{contract.objectArea} кв. метров</td>
                  </tr>
                )}
                {contract.objectBasis && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Объект принадлежит на основании</td>
                    <td className="p-4 text-gray-900">{contract.objectBasis}</td>
                  </tr>
                )}
                {contract.siteMaster && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Мастер участка</td>
                    <td className="p-4 text-gray-900 font-medium">{contract.siteMaster}</td>
                  </tr>
                )}
                {contract.position && (
                  <tr className="border-b border-gray-200 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Должность</td>
                    <td className="p-4 text-gray-900">{contract.position}</td>
                  </tr>
                )}

                {/* Информация о подключении */}
                <tr>
                  <td colSpan={2} className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-300 border-t-2 border-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-purple-500 rounded"></div>
                      <span className="font-bold text-purple-900 text-lg">Информация о подключении</span>
                    </div>
                  </td>
                </tr>
                {contract.requestedLoad && (
                  <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Запрошенная нагрузка</td>
                    <td className="p-4 text-gray-900 font-medium">{contract.requestedLoad} м. куб.</td>
                  </tr>
                )}
                {contract.costWithVAT && (
                  <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors bg-yellow-50/20">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Стоимость с НДС</td>
                    <td className="p-4 text-gray-900 font-bold text-lg">{contract.costWithVAT} рублей</td>
                  </tr>
                )}
                <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                  <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Водопровод</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      contract.hasWaterSupply 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {contract.hasWaterSupply ? "Да" : "Нет"}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                  <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Канализация</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      contract.hasSewerage 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {contract.hasSewerage ? "Да" : "Нет"}
                    </span>
                  </td>
                </tr>
                {contract.connectionType && (
                  <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Тип подключения</td>
                    <td className="p-4 text-gray-900 font-medium">
                      {contract.connectionType === "by-length"
                        ? "по протяженности"
                        : contract.connectionType === "with-well"
                        ? "с колодцем"
                        : contract.connectionType}
                    </td>
                  </tr>
                )}
                {contract.wellType && (
                  <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Колодец</td>
                    <td className="p-4 text-gray-900 font-medium">
                      {contract.wellType === "existing"
                        ? "Существующий"
                        : contract.wellType === "planned"
                        ? "Проектируемый"
                        : contract.wellType}
                    </td>
                  </tr>
                )}
                {contract.pipeDiameter && (
                  <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Диаметр водопровода</td>
                    <td className="p-4 text-gray-900 font-medium">{contract.pipeDiameter} мм</td>
                  </tr>
                )}
                {contract.pipeMaterial && (
                  <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Материал труб</td>
                    <td className="p-4 text-gray-900">{contract.pipeMaterial}</td>
                  </tr>
                )}
                {contract.connectionPoint && (
                  <tr className="border-b border-gray-200 hover:bg-purple-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Расположение точки подключения</td>
                    <td className="p-4 text-gray-900">{contract.connectionPoint}</td>
                  </tr>
                )}
                {contract.waterSupplyRestriction && (
                  <tr className="border-b border-gray-200 bg-orange-50">
                    <td className="p-3 text-orange-700 font-medium">⚠ Ограничение водоснабжения</td>
                    <td className="p-3 text-orange-700">Да</td>
                  </tr>
                )}
                {contract.privateNetworkPermission && (
                  <tr className="border-b border-gray-200 bg-orange-50">
                    <td className="p-3 text-orange-700 font-medium">⚠ Требуется разрешение на подключение к частным сетям</td>
                    <td className="p-3 text-orange-700">Да</td>
                  </tr>
                )}

                {/* Сведения о ходе присоединения */}
                <tr>
                  <td colSpan={2} className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-300 border-t-2 border-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-amber-500 rounded"></div>
                      <span className="font-bold text-amber-900 text-lg">Сведения о ходе присоединения</span>
                    </div>
                  </td>
                </tr>
                {contract.receiptDate && (
                  <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                    <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200">Дата поступления</td>
                    <td className="p-4 text-gray-900 font-medium">{formatDate(contract.receiptDate)}</td>
                  </tr>
                )}
                {(contract.technicalConditionsIssueDate || contract.technicalConditionsNumber) && (
                  <>
                    <tr>
                      <td colSpan={2} className="p-3 bg-gray-100 border-b border-gray-300">
                        <span className="font-bold text-gray-800 text-sm ml-2">Технические условия</span>
                      </td>
                    </tr>
                    {contract.technicalConditionsIssueDate && (
                      <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Дата выдачи</td>
                        <td className="p-4 text-gray-900">{formatDate(contract.technicalConditionsIssueDate)}</td>
                      </tr>
                    )}
                    {contract.technicalConditionsNumber && (
                      <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">№ тех. условий</td>
                        <td className="p-4 text-gray-900 font-medium">{contract.technicalConditionsNumber}</td>
                      </tr>
                    )}
                  </>
                )}
                {(contract.connectionAgreementIssueDate || contract.connectionAgreementNumber) && (
                  <>
                    <tr>
                      <td colSpan={2} className="p-3 bg-gray-100 border-b border-gray-300">
                        <span className="font-bold text-gray-800 text-sm ml-2">Договор присоединения</span>
                      </td>
                    </tr>
                    {contract.connectionAgreementIssueDate && (
                      <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Дата выдачи</td>
                        <td className="p-4 text-gray-900">{formatDate(contract.connectionAgreementIssueDate)}</td>
                      </tr>
                    )}
                    {contract.connectionAgreementNumber && (
                      <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">№ договора</td>
                        <td className="p-4 text-gray-900 font-medium">{contract.connectionAgreementNumber}</td>
                      </tr>
                    )}
                  </>
                )}
                {(contract.designAgreementIssueDate || contract.designAgreementNumber) && (
                  <>
                    <tr>
                      <td colSpan={2} className="p-3 bg-gray-100 border-b border-gray-300">
                        <span className="font-bold text-gray-800 text-sm ml-2">Договор проектных работ</span>
                      </td>
                    </tr>
                    {contract.designAgreementIssueDate && (
                      <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Дата выдачи</td>
                        <td className="p-4 text-gray-900">{formatDate(contract.designAgreementIssueDate)}</td>
                      </tr>
                    )}
                    {contract.designAgreementNumber && (
                      <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">№ договора</td>
                        <td className="p-4 text-gray-900 font-medium">{contract.designAgreementNumber}</td>
                      </tr>
                    )}
                  </>
                )}
                {contract.contractDate && (
                  <>
                    <tr>
                      <td colSpan={2} className="p-3 bg-gray-100 border-b border-gray-300">
                        <span className="font-bold text-gray-800 text-sm ml-2">Договор</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-amber-50/30 transition-colors">
                      <td className="p-4 bg-gray-50 text-gray-700 font-semibold border-r border-gray-200 pl-8">Дата договора</td>
                      <td className="p-4 text-gray-900 font-medium">{formatDate(contract.contractDate)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Таблица документов */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-6">Документы</h3>
          
          {/* Таблица */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-700">Тип документа</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Название файла</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Размер</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Дата загрузки</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Действия</th>
                </tr>
              </thead>
              <tbody>
                {DOCUMENT_TYPES.map((docType, index) => {
                  const docs = documentsByType[docType.id] || [];
                  return (
                    <tr 
                      key={docType.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-4 font-medium text-gray-900">{docType.label}</td>
                      <td className="p-4">
                        {docs.length > 0 ? (
                          <div className="space-y-2">
                            {docs.map((doc) => (
                              <div 
                                key={doc.id} 
                                className="flex items-center gap-2 group"
                              >
                                <FileCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {doc.fileName}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Нет документов</span>
                        )}
                      </td>
                      <td className="p-4">
                        {docs.length > 0 ? (
                          <div className="space-y-2">
                            {docs.map((doc) => (
                              <span 
                                key={doc.id} 
                                className="text-sm text-gray-600 inline-block"
                              >
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} МБ
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {docs.length > 0 ? (
                          <div className="space-y-2">
                            {docs.map((doc) => (
                              <span 
                                key={doc.id} 
                                className="text-sm text-gray-600 inline-block"
                              >
                                {new Date(doc.uploadedAt).toLocaleDateString("ru-RU", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {docs.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {docs.map((doc) => (
                              <div key={doc.id} className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.fileUrl, "_blank")}
                                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                  title="Скачать"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  title="Удалить"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Кнопки типов документов */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-4">Добавить документ</h4>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((docType) => (
                <Button
                  key={docType.id}
                  variant={selectedDocumentType === docType.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedDocumentType(docType.id);
                    setShowUploadForm(true);
                  }}
                  className={
                    selectedDocumentType === docType.id
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm"
                      : "border-gray-300 hover:border-green-500 hover:text-green-600 hover:bg-green-50"
                  }
                >
                  {docType.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Форма загрузки документа */}
          {showUploadForm && (
            <div className="mt-6 p-6 border-2 border-green-200 rounded-lg bg-green-50/50">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Добавить документ: <span className="text-green-700">{getDocumentTypeLabel(selectedDocumentType)}</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="max-w-md"
                    />
                    {uploadFile && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{uploadFile.name}</span>
                        <span className="text-gray-500">
                          ({(uploadFile.size / 1024 / 1024).toFixed(2)} МБ)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadFile || isUploading}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  >
                    {isUploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Добавить документ
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false);
                      setUploadFile(null);
                      const fileInput = document.getElementById("file-input") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
