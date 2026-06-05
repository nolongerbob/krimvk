"use client";

import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, CheckCircle, XCircle, List } from "lucide-react";
import { adminOutlineBtnClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

type FilterStatus = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface ApplicationFiltersProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  counts: {
    all: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export function ApplicationFilters({
  activeFilter,
  onFilterChange,
  counts,
}: ApplicationFiltersProps) {
  const filters = [
    { value: "ALL" as FilterStatus, label: "Все", icon: List, count: counts.all },
    { value: "PENDING" as FilterStatus, label: "Ожидают", icon: Clock, count: counts.pending },
    { value: "IN_PROGRESS" as FilterStatus, label: "В работе", icon: AlertCircle, count: counts.inProgress },
    { value: "COMPLETED" as FilterStatus, label: "Завершенные", icon: CheckCircle, count: counts.completed },
    { value: "CANCELLED" as FilterStatus, label: "Отмененные", icon: XCircle, count: counts.cancelled },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.value;
        return (
          <Button
            key={filter.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "flex items-center gap-2",
              isActive ? adminPrimaryBtnClass : adminOutlineBtnClass
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{filter.label}</span>
            {filter.count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs",
                  isActive ? "bg-white/20" : "bg-slate-100 text-slate-600"
                )}
              >
                {filter.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
