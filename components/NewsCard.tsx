import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPublicAuthorName } from "@/lib/format-public-author";

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
      <Card className="group flex h-full flex-col justify-between overflow-hidden rounded-none transition-all hover:shadow-lg hover:translate-y-0">
        {item.imageUrl && (
          <div className="relative h-48 w-full overflow-hidden bg-gray-200">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              unoptimized={item.imageUrl.includes("blob.vercel-storage.com")}
            />
          </div>
        )}
        <CardHeader className="p-5 pb-2">
          <CardTitle className="mb-2 line-clamp-2 text-lg leading-tight">{item.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
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
        </CardHeader>
        <CardContent className="flex flex-col p-5 pt-0">
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-700">
            {item.content}
          </p>
          <div className="pointer-events-none flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-800">
            Читать далее
            <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
