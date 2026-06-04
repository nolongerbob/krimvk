import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, Droplet, AlertTriangle, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

function IconBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-md",
        className
      )}
    >
      {children}
    </div>
  );
}

const requisitesRows = [
  { label: "ИНН", value: "9107000240" },
  { label: "КПП", value: "910701001" },
  { label: "Счёт", value: "40702810725190003625", mono: true },
  { label: "Банк", value: 'Филиал «Центральный» Банка ВТБ (ПАО)' },
  { label: "Корр. счёт", value: "30101810145250000411", mono: true },
  { label: "БИК", value: "044525411", mono: true },
] as const;

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-white py-16">
        <div className="container mx-auto mb-12 px-4 text-center animate-fade-in">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Свяжитесь с нами</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 md:text-lg">
            Мы всегда готовы ответить на ваши вопросы
          </p>
        </div>

        <div className="grid w-full grid-cols-1 lg:grid-cols-2 lg:items-stretch">
          <Card className="flex min-h-[520px] flex-col rounded-none border-x-0 border-t border-b shadow-none hover:translate-y-0 lg:border-r">
            <CardContent className="flex h-full w-full flex-col px-8 pb-14 pt-14 lg:px-12 lg:pb-16 lg:pt-16">
              <div className="mb-10 flex min-h-[150px] w-full flex-col items-center justify-start gap-3 text-center">
                <IconBadge className="bg-cyan-100">
                  <Droplet className="h-6 w-6 text-cyan-600" />
                </IconBadge>
                <CardTitle className="text-center text-2xl leading-tight">Прием показаний водомеров ХВС</CardTitle>
                <CardDescription className="mx-auto max-w-sm text-center text-base">
                  Передача показаний счетчиков холодного водоснабжения
                </CardDescription>
              </div>

              <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
                <div className="flex flex-col space-y-6 text-center">
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1">
                    <Phone className="h-5 w-5 shrink-0 text-blue-500" />
                    <a href="tel:+79780800366" className="text-lg font-medium text-gray-900 hover:text-primary">
                      +7 (978) 080-03-66
                    </a>
                    <p className="max-w-sm text-sm text-gray-600">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</p>
                  </div>
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1">
                    <Phone className="h-5 w-5 shrink-0 text-blue-500" />
                    <a href="tel:+79787415759" className="text-lg font-medium text-gray-900 hover:text-primary">
                      +7 (978) 741-57-59
                    </a>
                    <p className="max-w-sm text-sm text-gray-600">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</p>
                  </div>
                </div>

                <div className="mt-auto flex min-h-[132px] flex-col items-center justify-start border-t border-gray-200 pt-6 text-center">
                  <Mail className="mb-2 h-5 w-5 shrink-0 text-gray-500" />
                  <p className="mb-1 font-medium text-gray-900">Email для передачи показаний</p>
                  <a href="mailto:NVKVK2208@mail.ru" className="text-gray-600 hover:text-primary">
                    NVKVK2208@mail.ru
                  </a>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    Отправляйте показания счетчиков на этот адрес
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-[520px] flex-col rounded-none border-x-0 border-t border-b border-red-200 bg-red-50 shadow-none hover:translate-y-0">
            <CardContent className="flex h-full w-full flex-col px-8 pb-14 pt-14 lg:px-12 lg:pb-16 lg:pt-16">
              <div className="mb-10 flex min-h-[150px] w-full flex-col items-center justify-start gap-3 text-center">
                <IconBadge className="bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </IconBadge>
                <CardTitle className="text-center text-2xl leading-tight">Аварийно-диспетчерская служба</CardTitle>
                <CardDescription className="mx-auto max-w-sm text-center text-base">
                  Круглосуточная служба для экстренных ситуаций
                </CardDescription>
              </div>

              <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
                <div className="flex flex-col space-y-6 text-center">
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1">
                    <Phone className="h-5 w-5 shrink-0 text-red-500" />
                    <a href="tel:+79787013050" className="text-lg font-medium text-gray-900 hover:text-red-600">
                      +7 (978) 701-30-50
                    </a>
                    <p className="text-sm text-gray-600">Круглосуточно</p>
                  </div>
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1">
                    <Phone className="h-5 w-5 shrink-0 text-red-500" />
                    <a href="tel:+79787460990" className="text-lg font-medium text-gray-900 hover:text-red-600">
                      +7 (978) 746-09-90
                    </a>
                    <p className="text-sm text-gray-600">Круглосуточно</p>
                  </div>
                </div>

                <div className="mt-auto flex min-h-[132px] flex-col items-center justify-center border-t border-red-200 pt-6">
                  <Button
                    asChild
                    className="rounded-none bg-red-600 px-8 py-6 text-base hover:bg-red-700 hover:scale-100 active:scale-100"
                  >
                    <Link href="/emergency">Сообщить об аварии</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto mb-12 px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Контакты и реквизиты</h2>
        </div>

        <div className="grid w-full grid-cols-1 lg:grid-cols-2 lg:items-stretch">
          <Card className="flex min-h-[520px] flex-col rounded-none border-x-0 border-t border-b bg-white shadow-none hover:translate-y-0 lg:border-r">
            <CardContent className="flex h-full w-full flex-col px-8 pb-14 pt-14 lg:px-12 lg:pb-16 lg:pt-16">
              <div className="mb-10 flex flex-col items-center gap-3 text-center">
                <IconBadge className="bg-orange-100">
                  <Mail className="h-6 w-6 text-orange-600" />
                </IconBadge>
                <CardTitle className="text-2xl leading-tight">Контактная информация</CardTitle>
              </div>

              <div className="mx-auto flex w-full max-w-lg flex-col space-y-6">
                <div className="flex items-start gap-3 text-left">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <a href="mailto:sakwcompany@mail.ru" className="text-gray-600 hover:text-primary">
                      sakwcompany@mail.ru
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Адрес</p>
                    <p className="text-sm leading-relaxed text-gray-600">
                      ул. Механизаторов, 9<br />
                      с. Лесновка Сакского района<br />
                      Республика Крым, Российская Федерация<br />
                      296560
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Режим работы офиса</p>
                    <p className="text-sm text-gray-600">
                      Пн-Пт: 8:00 - 17:00<br />
                      Сб: 8:00 - 16:00<br />
                      Вс: Выходной
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <p className="mb-4 text-center font-medium text-gray-900">Социальные сети</p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <a
                      href="https://vk.com/krimvk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M12.785 16.241s.234-.027.354-.164c.264-.28.256-.8.256-.8s-.037-2.58 1.19-2.96c1.214-.37 2.77 2.46 4.41 3.55 1.24.82 2.18.64 2.18.64l4.41-.06s2.3-.14 1.21-1.96c-.09-.15-.64-1.33-3.3-3.76-2.79-2.48-2.41-2.08.94-6.37.65-.84.91-1.35.82-1.57-.08-.2-.58-.42-1.26-.44l-3.84.02s-.28-.02-.49.1c-.2.12-.33.4-.33.4s-.59 1.58-1.37 2.93c-1.65 2.95-2.31 3.11-2.58 2.93-.63-.42-.47-1.68-.47-2.58 0-2.81.42-3.98-.82-4.28-.41-.1-.71-.17-1.76-.18-1.35-.02-2.48 0-3.13.32-.44.22-.78.71-.58.74.26.03.84.15 1.15.55.4.5.39 1.62.39 1.62s.23 3.41-.54 3.83c-.53.3-1.26-.31-2.83-3.11-.8-1.4-1.4-2.95-1.4-2.95s-.12-.3-.33-.46c-.26-.19-.62-.25-.62-.25l-3.66.02s-.55.02-.75.25c-.18.2-.01.62-.01.62s2.83 6.6 6.03 9.93c2.93 2.97 6.27 2.77 6.27 2.77h1.52z" />
                      </svg>
                      ВКонтакте
                    </a>
                    <a
                      href="https://t.me/krimvk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      Telegram
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-[520px] flex-col rounded-none border-x-0 border-t border-b bg-white shadow-none hover:translate-y-0">
            <CardContent className="flex h-full w-full flex-col px-8 pb-14 pt-14 lg:px-12 lg:pb-16 lg:pt-16">
              <div className="mb-10 flex flex-col items-center gap-3 text-center">
                <IconBadge className="bg-indigo-100">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </IconBadge>
                <CardTitle className="text-2xl leading-tight">Реквизиты</CardTitle>
              </div>

              <div className="mx-auto w-full max-w-lg text-left">
                <p className="mb-6 text-base font-medium leading-snug text-gray-900">
                  ООО «Крымская Водная Компания»
                </p>

                <dl className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-3 text-sm sm:grid-cols-[8.5rem_1fr] sm:gap-x-6">
                  {requisitesRows.map((row) => (
                    <div key={row.label} className="contents">
                      <dt className="text-gray-500">{row.label}</dt>
                      <dd
                        className={cn(
                          "text-gray-900",
                          "mono" in row && row.mono && "font-mono text-[13px] leading-relaxed tracking-wide sm:text-sm"
                        )}
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
