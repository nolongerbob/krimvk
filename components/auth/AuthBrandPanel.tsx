import Image from "next/image";
import { cn } from "@/lib/utils";

export function AuthBrandPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-blue-600 px-8 py-12 text-center text-white lg:px-12 lg:py-16",
        className
      )}
    >
      <Image
        src="/images/logo.png"
        alt="КрымВК"
        width={112}
        height={112}
        className="mb-6 h-24 w-24 object-contain brightness-0 invert"
        priority
      />
      <p className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">КрымВК</p>
      <p className="max-w-md text-base leading-relaxed text-blue-100 md:text-lg">
        Личный кабинет абонента. Управляйте услугами водоснабжения онлайн
      </p>
    </div>
  );
}

export function AuthSplitLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:min-h-[calc(100dvh-4rem)] xl:min-h-[calc(100dvh-4.5rem)]",
        className
      )}
    >
      <AuthBrandPanel className="min-h-[240px] shrink-0 lg:min-h-0" />
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-white px-6 py-10 md:px-12 md:py-12">
        {children}
      </div>
    </div>
  );
}
