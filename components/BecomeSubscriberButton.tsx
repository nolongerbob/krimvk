"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BecomeSubscriberButtonProps {
  className?: string;
}

export function BecomeSubscriberButton({ className }: BecomeSubscriberButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/stat-abonentom");
  };

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

