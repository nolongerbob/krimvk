import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { File, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DynamicPagePage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slugArray = params.slug;
  const fullSlug = "/" + slugArray.join("/");

  // Сначала пробуем найти страницу по полному slug
  let page = await prisma.page.findUnique({
    where: {
      slug: fullSlug,
      isActive: true,
    },
    include: {
      author: { select: { name: true, email: true } },
      posts: {
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  // Если страница не найдена, пробуем найти пост по slug
  let post = null;
  if (!page) {
    // Пробуем найти пост по slug (последний сегмент)
    const lastSegment = slugArray[slugArray.length - 1];
    post = await prisma.post.findUnique({
      where: {
        slug: lastSegment,
      },
      include: {
        page: {
          select: { id: true, title: true, slug: true },
        },
        author: { select: { name: true, email: true } },
        attachments: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    // Если пост найден, загружаем страницу-категорию
    if (post) {
      page = await prisma.page.findUnique({
        where: {
          id: post.pageId,
          isActive: true,
        },
        include: {
          author: { select: { name: true, email: true } },
          posts: {
            include: {
              author: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    }
  }

  // Если это пост, отображаем его
  if (post) {
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    return (
      <div className="container py-8 px-4">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={post.page.slug}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к разделу
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <p className="text-gray-600">
            Раздел: {post.page.title} •{" "}
            {new Date(post.createdAt).toLocaleDateString("ru-RU")}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>

        {post.attachments.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Прикрепленные файлы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {post.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <File className="h-5 w-5 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.fileSize)} • {file.mimeType}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={file.filePath}
                      download
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Скачать
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Если ни страница, ни пост не найдены, показываем 404
  if (!page && !post) {
    notFound();
  }

  // TypeScript guard: если мы дошли сюда, page должен быть определен
  if (!page) {
    notFound();
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
        {page.description && (
          <p className="text-gray-600">{page.description}</p>
        )}
      </div>

      {page.content && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </CardContent>
        </Card>
      )}

      {/* Если это категория, показываем список постов */}
      {page.isCategory && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Посты в этом разделе</CardTitle>
          </CardHeader>
          <CardContent>
            {page.posts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Пока нет опубликованных постов в этом разделе
              </p>
            ) : (
              <div className="space-y-4">
                {page.posts.map((postItem) => (
                  <Link
                    key={postItem.id}
                    href={`${page.slug}/${postItem.slug}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold mb-2">{postItem.title}</h3>
                    <div
                      className="text-sm text-gray-600 line-clamp-2 mb-2"
                      dangerouslySetInnerHTML={{
                        __html: postItem.content.substring(0, 200) + (postItem.content.length > 200 ? "..." : ""),
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      {new Date(postItem.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}

