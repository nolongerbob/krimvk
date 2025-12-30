import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

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
      take: 5,
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
      take: 5,
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
      take: 5,
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
      take: 5,
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

    const results = [
      ...news.map((item) => ({
        title: item.title,
        description: item.content?.substring(0, 150) + "...",
        url: `/news/${item.id}`,
        type: "Новость",
      })),
      ...pages.map((item) => ({
        title: item.title,
        description: item.description?.substring(0, 150) + "...",
        url: item.slug,
        type: "Страница",
      })),
      ...posts.map((item) => ({
        title: item.title,
        description: item.content?.substring(0, 150) + "...",
        url: item.page ? `${item.page.slug}/${item.slug}` : `/posts/${item.slug}`,
        type: "Статья",
      })),
      ...services.map((item) => ({
        title: item.title,
        description: item.description?.substring(0, 150) + "...",
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

    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Ошибка при поиске" },
      { status: 500 }
    );
  }
}

