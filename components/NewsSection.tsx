import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewsCard, type NewsCardItem } from "@/components/NewsCard";

interface NewsSectionProps {
  news: NewsCardItem[];
}

export function NewsSection({ news }: NewsSectionProps) {
  const displayedNews = news.slice(0, 6);

  if (news.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-50 py-12 md:py-14">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-semibold tracking-tight md:text-4xl">Новости</h2>
            <p className="text-base text-slate-600 md:text-lg">Актуальные события и новости компании</p>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800"
          >
            Все новости
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {displayedNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
