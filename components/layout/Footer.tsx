"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerTop = footer.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      // Показываем футер когда он появляется в области видимости
      if (footerTop < windowHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Проверяем при загрузке

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <footer
      className={`site-footer bvi-no-styles bvi-preserve-ui border-t bg-slate-50 mt-auto transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
    >
      <div className="container py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/images/logo.png"
                alt="Крымская Водная Компания"
                width={48}
                height={48}
                className="h-12 w-12"
              />
              <span className="text-xl font-bold">КрымВК</span>
            </Link>
            <p className="text-sm text-slate-600">
              Водоканал Крыма - надежное водоснабжение и водоотведение
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Навигация</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/" className="text-slate-600 hover:text-primary">
                        Главная
                      </Link>
                    </li>
                    <li>
                      <Link href="/services" className="text-slate-600 hover:text-primary">
                        Услуги
                      </Link>
                    </li>
                    <li>
                      <Link href="/news" className="text-slate-600 hover:text-primary">
                        Новости
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-slate-600 hover:text-primary">
                        Контакты
                      </Link>
                    </li>
                  </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Личный кабинет</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-slate-600 hover:text-primary">
                  Вход
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-600 hover:text-primary">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-600 hover:text-primary">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Контакты</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="bvi-no-styles h-5 w-5 shrink-0 text-slate-600" aria-hidden />
                <a href="tel:+79780800366" className="text-slate-600 hover:text-primary">
                  +7 (978) 080-03-66
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="bvi-no-styles h-5 w-5 shrink-0 text-slate-600" aria-hidden />
                <a href="mailto:sakwcompany@mail.ru" className="text-slate-600 hover:text-primary">
                  sakwcompany@mail.ru
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="bvi-no-styles mt-0.5 h-5 w-5 shrink-0 text-slate-600" aria-hidden />
                <span className="text-slate-600">
                  ул. Механизаторов, 9<br />
                  с. Лесновка, Сакский район<br />
                  Республика Крым
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-slate-600">
          <p>&copy; {new Date().getFullYear()} КрымВК. Все права защищены.</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/legal/privacy" className="hover:text-primary">
              Политика ПДн
            </Link>
            <Link href="/legal/terms" className="hover:text-primary">
              Пользовательское соглашение
            </Link>
            <Link href="/legal/cookies" className="hover:text-primary">
              Политика cookie
            </Link>
            <Link href="/o-kompanii/licenzii" className="hover:text-primary">
              Лицензии и заключения
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

