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

  if (status === "authenticated") {
    return (
      <Button
        size="lg"
        className={className}
        onClick={handleClick}
      >
        Стать абонентом
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="lg"
      className={className}
    >
      <Link href="/register">
        Стать абонентом
      </Link>
    </Button>
  );
}

