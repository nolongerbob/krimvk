import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdminQuestionsChat } from "@/components/admin/AdminQuestionsChat";

export default async function AdminQuestionsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/questions");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем все диалоги
  const questions = await prisma.question.findMany({
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
      orderBy: [
        { status: "asc" },
        { updatedAt: "desc" },
      ],
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Вопросы и ответы</h1>
          <p className="text-gray-600">Ответы на вопросы пользователей</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Назад</Link>
        </Button>
      </div>

      <AdminQuestionsChat questions={questions} />
    </div>
  );
}
