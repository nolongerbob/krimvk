import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";
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
    <Link href={`/news/${item.id}`} className="news-card-link block h-full">
      <DashboardCard className={cn(dashboardTileClass, "group flex h-full flex-col justify-between overflow-hidden border-slate-300")}>
        {item.imageUrl && (
          <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden bg-slate-50">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain"
              unoptimized={item.imageUrl.includes("blob.vercel-storage.com")}
            />
          </div>
        )}
        <DashboardCardBody className="news-card-body flex flex-1 flex-col p-5">
          <h2 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight text-slate-900">
            {item.title}
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
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
