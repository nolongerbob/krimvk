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
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">← Админ</Link>
          </Button>
          <h1 className="text-lg font-semibold">Вопросы и ответы</h1>
        </div>
        <div className="text-sm text-gray-500">
          {questions.length} диалогов
        </div>
      </div>

      <AdminQuestionsChat questions={questions} />
    </div>
  );
}
