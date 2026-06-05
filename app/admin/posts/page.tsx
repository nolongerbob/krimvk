import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PostsClient } from "./PostsClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminContainerClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";

export default async function AdminPostsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/admin/posts");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      createdAt: true,
      page: { select: { id: true, title: true, slug: true } },
      author: { select: { name: true, email: true } },
      _count: { select: { attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.page.findMany({
    where: { isCategory: true, isActive: true },
    select: { id: true, title: true, slug: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Управление постами"
        description="Создание и редактирование постов в разделах"
        actions={
          <Button asChild className={adminPrimaryBtnClass}>
            <Link href="/admin/posts/create">
              <Plus className="mr-2 h-4 w-4" />
              Создать пост
            </Link>
          </Button>
        }
      />

      <PostsClient posts={posts} categories={categories} />
    </div>
  );
}
