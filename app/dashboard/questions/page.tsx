import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionsChat } from "@/components/questions/QuestionsChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dashboardButtonClass } from "@/components/dashboard/dashboard-styles";

export default async function QuestionsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/questions");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login?callbackUrl=/dashboard/questions");
  }

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
    <div
      className={cn(
        "container flex max-w-3xl flex-col bg-slate-50 px-4 py-6",
        "h-[calc(100dvh-4rem)] min-h-0 lg:h-[calc(100dvh-4.5rem)]",
        "[&_button]:!rounded-none"
      )}
    >
      <div className="mb-4 shrink-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(dashboardButtonClass, "h-9 border-slate-200")}
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>
      </div>

      <div className="mb-4 shrink-0">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Задать вопрос
        </h1>
        <p className="text-sm text-slate-600">
          Напишите службе поддержки — ответим в этом чате
        </p>
      </div>

      <QuestionsChat question={question} className="min-h-0 flex-1" />
    </div>
  );
}
