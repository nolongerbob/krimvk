"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

type HeaderPhoneMenuProps = {
  session: { user?: { name?: string | null; email?: string | null } } | null;
  onLinkClick?: () => void;
};

type PhoneSection = {
  title: string;
  titleClassName?: string;
  links: Array<{
    href: string;
    label: string;
    description?: string;
    labelClassName?: string;
  }>;
};

const phoneSections: PhoneSection[] = [
  {
    title: "Прием показаний водомеров ХВС",
    links: [
      {
        href: "tel:+79780800366",
        label: "+7 (978) 080-03-66",
        description: "с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00",
      },
      {
        href: "tel:+79884648724",
        label: "+7 (988) 464-87-24",
        description: "с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00",
      },
    ],
  },
  {
    title: "Аварийно-диспетчерская служба",
    titleClassName: "text-red-600",
    links: [
      {
        href: "tel:+79787013050",
        label: "+7 (978) 701-30-50",
        description: "Круглосуточно",
        labelClassName: "text-red-600",
      },
      {
        href: "tel:+79787460990",
        label: "+7 (978) 746-09-90",
        description: "Круглосуточно",
        labelClassName: "text-red-600",
      },
    ],
  },
];

export function HeaderPhoneMenu({ session, onLinkClick }: HeaderPhoneMenuProps) {
  const chatHref = session ? "/dashboard/questions" : "/login?callbackUrl=/dashboard/questions";

  return (
    <div className="w-full border-t border-gray-200/60 bg-white/75 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="w-full px-6 py-8 sm:px-8 lg:px-14 lg:py-10 xl:px-20">
        <div className="grid w-full grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-20 lg:gap-y-10">
          {phoneSections.map((section) => (
            <div key={section.title}>
              <p
                className={`mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 ${section.titleClassName ?? ""}`}
              >
                {section.title}
              </p>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={onLinkClick}
                      className="group/link block transition-colors"
                    >
                      <span
                        className={`relative inline-block text-base font-medium leading-snug text-gray-900 group-hover/link:text-primary ${link.labelClassName ?? ""}`}
                      >
                        {link.label}
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-primary transition-[width] duration-300 ease-out group-hover/link:w-full"
                        />
                      </span>
                      {link.description ? (
                        <span className="mt-1 block text-sm leading-relaxed text-gray-500">
                          {link.description}
                        </span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Онлайн-чат
            </p>
            <Link
              href={chatHref}
              onClick={onLinkClick}
              className="group/link inline-flex items-center gap-2 text-base leading-snug text-gray-900 transition-colors hover:text-primary"
            >
              <MessageSquare className="h-5 w-5 shrink-0 text-blue-600" />
              <span className="relative font-medium">
                Написать в чате
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-primary transition-[width] duration-300 ease-out group-hover/link:w-full"
                />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
