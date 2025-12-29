"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: Date;
  page: {
    id: string;
    title: string;
    slug: string;
  };
  author: {
    name: string | null;
    email: string;
  };
  _count: {
    attachments: number;
  };
}

interface Category {
  id: string;
  title: string;
  slug: string;
}

interface PostsClientProps {
  posts: Post[];
  categories: Category[];
}

export function PostsClient({ posts: initialPosts, categories }: PostsClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const router = useRouter();

  const filteredPosts =
    selectedCategory === "all"
      ? posts
      : posts.filter((post) => post.page.id === selectedCategory);

  const handleDelete = async (postId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот пост?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении поста");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Ошибка при удалении поста");
    }
  };


  return (
    <div className="space-y-6">
      {/* Фильтр по категориям */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтр по разделам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              Все разделы
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Список постов */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">Нет постов</p>
            <Button asChild>
              <Link href="/admin/posts/create">Создать первый пост</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{post.title}</CardTitle>
                      {post._count.attachments > 0 && (
                        <Badge variant="outline">
                          {post._count.attachments} файлов
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      <div className="space-y-1">
                        <p className="text-sm">
                          Раздел: <span className="font-medium">{post.page.title}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Автор: {post.author.name || post.author.email} • 
                          Создан: {new Date(post.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`${post.page.slug}/${post.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

