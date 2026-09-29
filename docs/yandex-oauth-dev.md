# Яндекс ID: этап подключения на dev

Сейчас реализован OAuth-вход только для ранее явно привязанной записи Account.
Непривязанный ID не создаёт пользователя и не связывается по email. Явная
привязка доступна в настройках после проверки пароля, с одноразовым разрешением
на 5 минут. Новые пользователи пока регистрируются обычным способом.

Вход выключен без всех серверных переменных:

```
YANDEX_AUTH_ENABLED=true
YANDEX_CLIENT_ID=<из приложения Яндекс>
YANDEX_CLIENT_SECRET=<секрет приложения>
```

В production этот этап принудительно выключен. Не использовать NEXT_PUBLIC_
для секрета; не коммитить реальные значения. У текущего изолированного dev-preview
по умолчанию отключена база. Для проверки запускайте setup-local-dev.mjs и
dev-seasonal.mjs --esia-preview --yandex-auth --with-db --google-maps --home-preview.
Это подключает только локальную БД на 127.0.0.1:55435; 1С и внешняя поддержка отключены.

Создать приложение: https://oauth.yandex.ru/client/new/id/
Права: login:info и login:email (аватар, телефон и прочие права не нужны).
Callback для текущего локального адреса:
http://localhost:3006/api/auth/callback/yandex
Если портал требует HTTPS, нужен отдельный согласованный HTTPS dev-домен;
не подменять его production callback. NEXTAUTH_URL должен совпадать с origin.

Протокол: Authorization Code + state + PKCE S256 через NextAuth.
Токен Яндекса не добавляется в JWT сессии сайта.
Документация: https://yandex.ru/dev/id/doc/ru/codes/code-url

До production: протестировать с реальным Яндекс ID
отмену, повтор callback, неверный state, конфликт email и вход привязанного ID.
