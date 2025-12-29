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
      className={`border-t bg-gray-50 mt-auto transition-all duration-700 ease-out ${
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-20 opacity-0"
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
            <p className="text-sm text-gray-600">
              Водоканал Крыма - надежное водоснабжение и водоотведение
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Навигация</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/" className="text-gray-600 hover:text-primary">
                        Главная
                      </Link>
                    </li>
                    <li>
                      <Link href="/services" className="text-gray-600 hover:text-primary">
                        Услуги
                      </Link>
                    </li>
                    <li>
                      <Link href="/news" className="text-gray-600 hover:text-primary">
                        Новости
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-gray-600 hover:text-primary">
                        Контакты
                      </Link>
                    </li>
                  </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Личный кабинет</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-gray-600 hover:text-primary">
                  Вход
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 hover:text-primary">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-primary">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Контакты</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-600" />
                <a href="tel:+78001234567" className="text-gray-600 hover:text-primary">
                  8 (800) 123-45-67
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <a href="mailto:info@krimvk.ru" className="text-gray-600 hover:text-primary">
                  info@krimvk.ru
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-600 mt-1" />
                <span className="text-gray-600">
                  ул. Механизаторов, 9<br />
                  с. Лесновка, Сакский район<br />
                  Республика Крым
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} КрымВК. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

