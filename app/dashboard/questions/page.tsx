import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionsChat } from "@/components/questions/QuestionsChat";

export default async function QuestionsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/dashboard/questions");
  }

  // Проверяем, существует ли пользователь в базе данных
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    // Пользователь не существует, перенаправляем на вход
    redirect("/login?callbackUrl=/dashboard/questions");
  }

  // Находим или создаем диалог пользователя
  let question = await prisma.question.findFirst({
    where: { userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!question) {
    question = await prisma.question.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  return (
    <div className="container py-8 px-4 max-w-4xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Задать вопрос</h1>
        <p className="text-gray-600">Задайте вопрос нашей службе поддержки</p>
      </div>

      <QuestionsChat question={question} />
    </div>
  );
}

