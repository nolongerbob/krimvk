"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TehnologicheskoePrisoedineniePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Редирект на страницу "Стать абонентом"
    router.replace("/stat-abonentom");
  }, [router]);

  return (
    <div className="container py-12 px-4 max-w-6xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Перенаправление на страницу "Стать абонентом"...</p>
        </div>
      </div>
    </div>
  );
}
