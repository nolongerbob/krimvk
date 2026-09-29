import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewsCard, type NewsCardItem } from "@/components/NewsCard";

interface NewsSectionProps {
  news: NewsCardItem[];
  fullScreen?: boolean;
}

export function NewsSection({ news, fullScreen = false }: NewsSectionProps) {
  const displayedNews = news.slice(0, 6);

  if (news.length === 0) {
    return null;
  }

  if (fullScreen) return (
    <section className="home-news-section flex min-h-[calc(100svh-var(--home-sticky-header,72px))] flex-col bg-white pt-10">
        <div className="home-news-heading relative shrink-0 border-b border-slate-300 px-4 pb-6">
          <h2 className="text-center text-4xl font-semibold tracking-tight">Новости</h2>
          <Link href="/news" className="mt-2 flex min-h-11 items-center justify-end gap-2 font-medium text-blue-600 hover:text-blue-800 sm:absolute sm:right-3 sm:top-0 sm:mt-0">Все новости<ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="home-news-grid container mx-auto grid flex-1 grid-cols-1 content-center items-start gap-6 px-4 py-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedNews.map(item => <NewsCard key={item.id} item={item} />)}
        </div>
    </section>
  );

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
