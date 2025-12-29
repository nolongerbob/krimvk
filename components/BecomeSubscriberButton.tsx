"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BecomeSubscriberButtonProps {
  className?: string;
}

export function BecomeSubscriberButton({ className }: BecomeSubscriberButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (status === "authenticated") {
      e.preventDefault();
      router.push("/stat-abonentom");
    }
    // Если не авторизован, просто переходим на /register (стандартное поведение Link)
  };

  return (
    <Button
      asChild
      size="lg"
      className={className}
      onClick={status === "authenticated" ? handleClick : undefined}
    >
      <Link href={status === "authenticated" ? "/stat-abonentom" : "/register"}>
        Стать абонентом
      </Link>
    </Button>
  );
}

