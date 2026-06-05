import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight } from "lucide-react";
import { formatPublicAuthorName } from "@/lib/format-public-author";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { dashboardTileClass } from "@/components/dashboard/dashboard-styles";
import { cn } from "@/lib/utils";

export type NewsCardItem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  author: {
    name: string | null;
    email: string;
  };
};

export function NewsCard({ item }: { item: NewsCardItem }) {
  return (
    <Link href={`/news/${item.id}`} className="block h-full">
      <DashboardCard className={cn(dashboardTileClass, "group flex h-full flex-col justify-between overflow-hidden")}>
        {item.imageUrl && (
          <div className="relative h-48 w-full overflow-hidden bg-slate-200">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              unoptimized={item.imageUrl.includes("blob.vercel-storage.com")}
            />
          </div>
        )}
        <DashboardCardBody className="flex flex-1 flex-col p-5">
          <h2 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight text-slate-900">
            {item.title}
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {formatPublicAuthorName(item.author.name, item.author.email)}
              </span>
            </div>
            {item.publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-700">
            {item.content}
          </p>
          <div className="pointer-events-none flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-800">
            Читать далее
            <ArrowRight className="h-3 w-3" />
          </div>
        </DashboardCardBody>
      </DashboardCard>
    </Link>
  );
}
