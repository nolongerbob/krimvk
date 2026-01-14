"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCheck, Trash2, Edit, Copy, Search, Eye, X, Filter } from "lucide-react";
import Link from "next/link";

interface Contract {
  id: string;
  userId: string | null;
  contractNumber: string;
  contractDate: string | null;
  status: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  phone?: string | null;
  objectAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContractsClientProps {
  contracts: Contract[];
}

export function ContractsClient({ contracts: initialContracts }: ContractsClientProps) {
  const [contracts, setContracts] = useState(initialContracts);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Сохраняем поисковый запрос в URL для возможности поделиться ссылкой
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const status = params.get("status");
    if (query) setSearchTerm(query);
    if (status) setStatusFilter(status);
  }, []);

  // Обновляем URL при изменении поиска
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) {
      params.set("q", searchTerm);
    } else {
      params.delete("q");
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [searchTerm, statusFilter]);

  const filteredContracts = useMemo(() => {
    let filtered = contracts;

    // Фильтр по статусу
    if (statusFilter !== "all") {
      filtered = filtered.filter((contract) => contract.status === statusFilter);
    }

    // Поиск
    if (!searchTerm.trim()) {
      return filtered;
    }

    const searchLower = searchTerm.toLowerCase();
    return filtered.filter((contract) => {
      const fullName = `${contract.lastName} ${contract.firstName} ${contract.middleName || ""}`.toLowerCase();
      const contractNumber = contract.contractNumber?.toLowerCase() || "";
      const phone = contract.phone?.toLowerCase() || "";
      const address = contract.objectAddress?.toLowerCase() || "";

      return (
        fullName.includes(searchLower) ||
        contractNumber.includes(searchLower) ||
        phone.includes(searchLower) ||
        address.includes(searchLower) ||
        contract.lastName.toLowerCase().includes(searchLower) ||
        contract.firstName.toLowerCase().includes(searchLower) ||
        contract.firstName.toLowerCase().startsWith(searchLower) ||
        contract.lastName.toLowerCase().startsWith(searchLower)
      );
    });
  }, [contracts, searchTerm, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот договор?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/contracts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setContracts(contracts.filter((c) => c.id !== id));
      } else {
        alert("Ошибка при удалении договора");
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Ошибка при удалении договора");
    }
  };

  const handleClone = async (contract: Contract) => {
    try {
      const response = await fetch(`/api/admin/contracts/${contract.id}`);
      if (!response.ok) {
        alert("Ошибка при загрузке данных договора");
        return;
      }

      const { contract: fullContract } = await response.json();
      const { id, createdAt, updatedAt, ...contractData } = fullContract;

      const createResponse = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData),
      });

      if (createResponse.ok) {
        const data = await createResponse.json();
        if (data.contract) {
          setContracts([data.contract, ...contracts]);
          alert("Договор скопирован");
        } else {
          alert("Ошибка при копировании договора");
        }
      } else {
        const errorData = await createResponse.json();
        alert(errorData.error || "Ошибка при копировании договора");
      }
    } catch (error) {
      console.error("Error cloning contract:", error);
      alert("Ошибка при копировании договора");
    }
  };

  const getFullName = (contract: Contract): string => {
    const parts = [
      contract.lastName,
      contract.firstName,
      contract.middleName,
    ].filter(Boolean);
    return parts.join(" ") || "Не указано";
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

  if (initialContracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Договоры не найдены</p>
          <Button asChild>
            <Link href="/admin/contracts/create">Создать первый договор</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const clearSearch = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Панель поиска и фильтров */}
      <Card className="border-2 border-blue-200 shadow-md">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Быстрый поиск: фамилия, имя, номер договора, телефон, адрес..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-10 h-12 text-base"
                autoFocus
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Фильтры */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Статус:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  Все
                </Button>
                <Button
                  variant={statusFilter === "PENDING" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("PENDING")}
                  className={statusFilter === "PENDING" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                >
                  В ожидании
                </Button>
                <Button
                  variant={statusFilter === "IN_PROGRESS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("IN_PROGRESS")}
                  className={statusFilter === "IN_PROGRESS" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  В работе
                </Button>
                <Button
                  variant={statusFilter === "COMPLETED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={statusFilter === "COMPLETED" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  Завершен
                </Button>
                <Button
                  variant={statusFilter === "CANCELLED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("CANCELLED")}
                  className={statusFilter === "CANCELLED" ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  Отменен
                </Button>
              </div>
            </div>

            {/* Статистика */}
            {(searchTerm || statusFilter !== "all") && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Найдено: <span className="font-semibold text-gray-900">{filteredContracts.length}</span> из{" "}
                  <span className="font-semibold text-gray-900">{contracts.length}</span> договоров
                </div>
                {(searchTerm || statusFilter !== "all") && (
                  <Button variant="ghost" size="sm" onClick={clearSearch} className="text-gray-600">
                    <X className="h-4 w-4 mr-1" />
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Результаты поиска */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm || statusFilter !== "all"
                ? "Ничего не найдено"
                : "Договоры не найдены"}
            </p>
            {searchTerm && (
              <p className="text-sm text-gray-500 mb-4">
                По запросу "<span className="font-medium">{searchTerm}</span>" ничего не найдено
              </p>
            )}
            {(searchTerm || statusFilter !== "all") && (
              <Button variant="outline" onClick={clearSearch}>
                Сбросить фильтры
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        Договор № {contract.contractNumber}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {getStatusLabel(contract.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Абонент:</span> {getFullName(contract)}
                      </div>
                      {contract.contractDate && (
                        <div>
                          <span className="font-medium">Дата договора:</span>{" "}
                          {formatDate(contract.contractDate)}
                        </div>
                      )}
                      {contract.phone && (
                        <div>
                          <span className="font-medium">Телефон:</span> {contract.phone}
                        </div>
                      )}
                      {contract.objectAddress && (
                        <div>
                          <span className="font-medium">Адрес объекта:</span>{" "}
                          {contract.objectAddress}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/contracts/${contract.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотр
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/contracts/${contract.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClone(contract)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Клонировать
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(contract.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
