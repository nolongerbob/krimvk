import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminOutlineBtnClass } from "@/components/admin/admin-styles";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  backHref = "/admin",
  backLabel = "Назад",
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {(actions || backHref) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {backHref ? (
            <Button asChild variant="outline" className={adminOutlineBtnClass}>
              <Link href={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
