import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminQuestionsChat } from "@/components/admin/AdminQuestionsChat";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

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

  const questions = await prisma.question.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-6">
      <AdminPageHeader
        title="Вопросы и ответы"
        description={`${questions.length} диалогов`}
        className="mb-4 shrink-0"
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminQuestionsChat questions={questions} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
