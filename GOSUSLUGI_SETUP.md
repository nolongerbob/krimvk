# Настройка входа через Госуслуги (ЕСИА)

Это руководство поможет настроить вход и регистрацию через портал Госуслуги.

## Шаг 1: Регистрация приложения в ЕСИА

1. Перейдите на [портал разработчиков ЕСИА](https://esia.gosuslugi.ru/)
2. Зарегистрируйте новое приложение
3. Получите следующие данные:
   - `CLIENT_ID` (идентификатор клиента)
   - `CLIENT_SECRET` (секретный ключ)
   - `REDIRECT_URI` (URL для перенаправления после авторизации)

## Шаг 2: Настройка переменных окружения

Добавьте следующие переменные в файл `.env.local`:

```env
# Госуслуги (ЕСИА) OAuth настройки
GOSUSLUGI_CLIENT_ID=your_client_id_here
GOSUSLUGI_CLIENT_SECRET=your_client_secret_here

# Опционально: кастомные URL (если используются тестовые окружения)
# GOSUSLUGI_AUTHORIZATION_URL=https://esia.gosuslugi.ru/aas/oauth2/ac
# GOSUSLUGI_TOKEN_URL=https://esia.gosuslugi.ru/aas/oauth2/te
# GOSUSLUGI_USERINFO_URL=https://esia.gosuslugi.ru/rs/prns

# NextAuth URL (обязательно для OAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Шаг 3: Настройка Redirect URI

В настройках приложения в ЕСИА укажите следующий Redirect URI:

```
http://localhost:3000/api/auth/callback/gosuslugi
```

Для production окружения:

```
https://yourdomain.com/api/auth/callback/gosuslugi
```

## Шаг 4: Проверка работы

1. Перезапустите сервер разработки:
   ```bash
   npm run dev
   ```

2. Откройте страницу входа: `http://localhost:3000/login`

3. Вы должны увидеть кнопку "Войти через Госуслуги"

4. При нажатии на кнопку произойдет перенаправление на страницу авторизации Госуслуг

## Особенности реализации

- **Автоматическая регистрация**: Если пользователь впервые входит через Госуслуги, автоматически создается аккаунт в системе
- **Связывание аккаунтов**: Если пользователь с таким email уже существует, OAuth аккаунт связывается с существующим пользователем
- **Без пароля**: Пользователи, зарегистрированные через Госуслуги, не имеют пароля в системе и могут входить только через OAuth

## Отладка

Если возникают проблемы:

1. Проверьте, что все переменные окружения установлены правильно
2. Убедитесь, что Redirect URI в ЕСИА совпадает с `NEXTAUTH_URL/api/auth/callback/gosuslugi`
3. Проверьте логи сервера на наличие ошибок
4. Убедитесь, что приложение в ЕСИА имеет статус "Активно"

## Дополнительная информация

- [Документация ЕСИА](https://digital.gov.ru/ru/documents/instruktsiya-po-podklyucheniyu-k-esia/)
- [NextAuth.js OAuth провайдеры](https://next-auth.js.org/configuration/providers/oauth)

