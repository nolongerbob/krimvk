"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import {
  adminOutlineBtnClass,
  adminPrimaryBtnClass,
  adminSectionLabelClass,
} from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

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
      <DashboardCard>
        <DashboardCardBody>
          <p className={cn(adminSectionLabelClass, "mb-4")}>Фильтр по разделам</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? adminPrimaryBtnClass : adminOutlineBtnClass}
            >
              Все разделы
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id ? adminPrimaryBtnClass : adminOutlineBtnClass
                }
              >
                {category.title}
              </Button>
            ))}
          </div>
        </DashboardCardBody>
      </DashboardCard>

      {filteredPosts.length === 0 ? (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="mb-4 text-slate-500">Нет постов</p>
            <Button asChild className={adminPrimaryBtnClass}>
              <Link href="/admin/posts/create">Создать первый пост</Link>
            </Button>
          </DashboardCardBody>
        </DashboardCard>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <DashboardCard key={post.id}>
              <DashboardCardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>
                      {post._count.attachments > 0 && (
                        <Badge variant="outline" className="rounded-none">
                          {post._count.attachments} файлов
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        Раздел: <span className="font-medium text-slate-800">{post.page.title}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Автор: {post.author.name || post.author.email} • Создан:{" "}
                        {new Date(post.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" asChild className="rounded-none">
                      <Link href={`${post.page.slug}/${post.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild className="rounded-none">
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      className="rounded-none text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DashboardCardBody>
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}
