import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, Droplet, AlertTriangle, FileText, Building2 } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container py-12 px-4">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">Свяжитесь с нами</h1>
        <p className="text-xl text-gray-600">
          Мы всегда готовы ответить на ваши вопросы
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Прием показаний водомеров ХВС */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Droplet className="h-6 w-6 text-blue-500" />
              <CardTitle>Прием показаний водомеров ХВС</CardTitle>
            </div>
            <CardDescription>
              Передача показаний счетчиков холодного водоснабжения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-500" />
              <div>
                <a href="tel:+79780800366" className="text-lg font-medium text-gray-900 hover:text-primary">
                  +7 (978) 080-03-66
                </a>
                <p className="text-sm text-gray-600">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-500" />
              <div>
                <a href="tel:+79787415759" className="text-lg font-medium text-gray-900 hover:text-primary">
                  +7 (978) 741-57-59
                </a>
                <p className="text-sm text-gray-600">с 8:00 до 17:00 по будням,  в пятницу c 8:00 до 16:00</p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium mb-1">Email для передачи показаний</p>
                  <a href="mailto:pokazaniya@krimvk.ru" className="text-gray-600 hover:text-primary">
                    pokazaniya@krimvk.ru
                  </a>
                  <p className="text-sm text-gray-500 mt-1">
                    Отправляйте показания счетчиков на этот адрес
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Аварийно-диспетчерская служба */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle>Аварийно-диспетчерская служба</CardTitle>
            </div>
            <CardDescription>
              Круглосуточная служба для экстренных ситуаций
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-red-500" />
              <div>
                <a href="tel:+79787013050" className="text-lg font-medium text-gray-900 hover:text-red-600">
                  +7 (978) 701-30-50
                </a>
                <p className="text-sm text-gray-600">Круглосуточно</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-red-500" />
              <div>
                <a href="tel:+79787460990" className="text-lg font-medium text-gray-900 hover:text-red-600">
                  +7 (978) 746-09-90
                </a>
                <p className="text-sm text-gray-600">Круглосуточно</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Общая контактная информация */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Контактная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <p className="font-medium">Email</p>
                <a href="mailto:sakwcompany@mail.ru" className="text-gray-600 hover:text-primary">
                  sakwcompany@mail.ru
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <p className="font-medium">Адрес</p>
                <p className="text-gray-600">
                  ул. Механизаторов, 9<br />
                  с. Лесновка Сакского района<br />
                  Республика Крым, Российская Федерация<br />
                  296560
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <p className="font-medium">Режим работы офиса</p>
                <p className="text-gray-600">
                  Пн-Пт: 8:00 - 17:00<br />
                  Сб: 8:00 - 16:00<br />
                  Вс: Выходной
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="font-medium mb-3">Социальные сети</p>
              <div className="space-y-3">
                <a
                  href="https://vk.com/krimvk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-gray-600 hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.785 16.241s.234-.027.354-.164c.264-.28.256-.8.256-.8s-.037-2.58 1.19-2.96c1.214-.37 2.77 2.46 4.41 3.55 1.24.82 2.18.64 2.18.64l4.41-.06s2.3-.14 1.21-1.96c-.09-.15-.64-1.33-3.3-3.76-2.79-2.48-2.41-2.08.94-6.37.65-.84.91-1.35.82-1.57-.08-.2-.58-.42-1.26-.44l-3.84.02s-.28-.02-.49.1c-.2.12-.33.4-.33.4s-.59 1.58-1.37 2.93c-1.65 2.95-2.31 3.11-2.58 2.93-.63-.42-.47-1.68-.47-2.58 0-2.81.42-3.98-.82-4.28-.41-.1-.71-.17-1.76-.18-1.35-.02-2.48 0-3.13.32-.44.22-.78.71-.58.74.26.03.84.15 1.15.55.4.5.39 1.62.39 1.62s.23 3.41-.54 3.83c-.53.3-1.26-.31-2.83-3.11-.8-1.4-1.4-2.95-1.4-2.95s-.12-.3-.33-.46c-.26-.19-.62-.25-.62-.25l-3.66.02s-.55.02-.75.25c-.18.2-.01.62-.01.62s2.83 6.6 6.03 9.93c2.93 2.97 6.27 2.77 6.27 2.77h1.52z"/>
                  </svg>
                  <span>ВКонтакте</span>
                </a>
                <a
                  href="https://t.me/krimvk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-gray-600 hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Реквизиты */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <CardTitle>Реквизиты</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-3 text-sm text-gray-600 flex-1">
              <div>
                <p className="font-medium text-gray-900 mb-1">Наименование организации</p>
                <p>ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ &quot;КРЫМСКАЯ ВОДНАЯ КОМПАНИЯ&quot;</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">ИНН организации</p>
                <p>9107000240</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">КПП организации</p>
                <p>910701001</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Счёт</p>
                <p>40702810725190003625</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Банк</p>
                <p>ФИЛИАЛ &quot;ЦЕНТРАЛЬНЫЙ&quot; БАНКА ВТБ (ПАО)</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Корр. счёт</p>
                <p>30101810145250000411</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">БИК</p>
                <p>044525411</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

