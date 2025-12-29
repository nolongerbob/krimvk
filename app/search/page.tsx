import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }> | { q?: string };
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await Promise.resolve(props.searchParams);
  const query = searchParams.q || "";
  let results: any[] = [];

  if (query.length >= 2) {
    const searchTerm = query.trim().toLowerCase();

    // Поиск по новостям
    const news = await prisma.news.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Поиск по страницам
    const pages = await prisma.page.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
      },
    });

    // Поиск по постам
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        page: {
          select: {
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Поиск по услугам
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    // Статические страницы (не хранятся в БД)
    const staticPages = [
      {
        title: "Подключение к водоснабжению и водоотведению",
        description: "Пошаговая инструкция по подключению вашего объекта к центральным системам водоснабжения и канализации. Получение технических условий, заключение договора, проектирование, строительство сетей, врезка и пуск, заключение абонентского договора.",
        url: "/abonenty/platy-uslugi/podklyuchenie",
        keywords: ["подключение", "технические условия", "ту", "договор подключения", "проектирование", "врезка", "водоснабжение", "водоотведение", "канализация"],
      },
      {
        title: "Заявка на откачку сточных вод",
        description: "Услуги ассенизатора по специальным социальным тарифам для населения. Как заказать услугу, стоимость, требования, льготы и компенсации.",
        url: "/abonenty/platy-uslugi/otkachka",
        keywords: ["откачка", "сточные воды", "ассенизатор", "вывоз стоков", "канализация"],
      },
      {
        title: "История предприятия",
        description: "ООО «Крымская Водная Компания»: от истоков к современности. Как всё начиналось, масштаб и цифры, технологии и модернизация, реальные дела, социальная ответственность.",
        url: "/o-kompanii/istoriya",
        keywords: ["история", "компания", "предприятие", "развитие", "модернизация"],
      },
      {
        title: "Руководство",
        description: "Руководители и учредители ООО «Крымская Водная Компания».",
        url: "/o-kompanii/rukovodstvo",
        keywords: ["руководство", "руководители", "учредители", "директор"],
      },
      {
        title: "Сообщение об аварии",
        description: "Сообщите нам об аварийной ситуации, требующей немедленного реагирования. Ваша заявка будет передана в диспетчерскую службу.",
        url: "/emergency",
        keywords: ["авария", "аварийная ситуация", "диспетчерская", "аварийная служба"],
      },
    ];

    // Фильтруем статические страницы по поисковому запросу
    const matchedStaticPages = staticPages.filter((page) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        page.title.toLowerCase().includes(searchLower) ||
        page.description.toLowerCase().includes(searchLower) ||
        page.keywords.some((keyword) => keyword.toLowerCase().includes(searchLower))
      );
    });

    results = [
      ...news.map((item) => ({
        title: item.title,
        description: item.content?.substring(0, 200) + "...",
        url: `/news/${item.id}`,
        type: "Новость",
        date: item.createdAt,
      })),
      ...pages.map((item) => ({
        title: item.title,
        description: item.description?.substring(0, 200) + "...",
        url: item.slug,
        type: "Страница",
      })),
      ...posts.map((item) => ({
        title: item.title,
        description: item.content?.substring(0, 200) + "...",
        url: item.page ? `${item.page.slug}/${item.slug}` : `/posts/${item.slug}`,
        type: "Статья",
      })),
      ...services.map((item) => ({
        title: item.title,
        description: item.description?.substring(0, 200) + "...",
        url: `/services/${item.id}/apply`,
        type: "Услуга",
      })),
      ...matchedStaticPages.map((item) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        type: "Страница",
      })),
    ];
  }

  return (
    <div className="container py-12 px-4 max-w-4xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-4">Поиск по сайту</h1>
        <form action="/search" method="get" className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              name="q"
              placeholder="Введите запрос для поиска..."
              defaultValue={query}
              className="pl-10"
            />
          </div>
          <Button type="submit">Найти</Button>
        </form>
      </div>

      {query && (
        <div className="animate-fade-in animate-delay-100">
          {results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Найдено результатов: <strong>{results.length}</strong>
              </p>
              {results.map((result, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          <Link href={result.url} className="hover:text-blue-600 transition-colors">
                            {result.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-sm">{result.type}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm">{result.description}</p>
                    <Link
                      href={result.url}
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      Читать далее →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 text-lg mb-2">Ничего не найдено</p>
                <p className="text-gray-400 text-sm">
                  Попробуйте изменить запрос или использовать другие ключевые слова
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!query && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Введите запрос для поиска</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

