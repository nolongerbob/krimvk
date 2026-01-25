# КримВК - Android Приложение

Мобильное приложение для личного кабинета абонентов КримВК на платформе Android.

## Технологии

- **Язык**: Kotlin
- **UI**: Jetpack Compose с Material Design 3
- **Архитектура**: MVVM (Model-View-ViewModel)
- **Навигация**: Jetpack Navigation Compose
- **Сеть**: Retrofit 2 + OkHttp
- **Dependency Injection**: Dagger Hilt
- **Хранение данных**: DataStore (для токенов и настроек)
- **Async**: Kotlin Coroutines + Flow
- **Камера**: CameraX (для фотографирования счетчиков)

## Основные функции

### Реализованные функции

✅ **Аутентификация**
- Вход по email и паролю
- Регистрация новых пользователей
- Верификация email
- Смена пароля
- Выход из аккаунта

✅ **Dashboard (Главный экран)**
- Просмотр баланса
- Навигация по разделам приложения
- Быстрый доступ к основным функциям

✅ **Управление лицевыми счетами**
- Просмотр списка лицевых счетов
- Добавление новых счетов
- Выбор активного счета

✅ **Счета к оплате**
- Просмотр неоплаченных счетов
- История счетов
- Статусы оплаты

✅ **Счетчики воды**
- Список зарегистрированных счетчиков
- Передача показаний вручную
- Фотографирование счетчиков с AI распознаванием
- История показаний

✅ **Заявки**
- Создание заявок на услуги
- Просмотр активных заявок
- Отслеживание статуса заявок

✅ **Поддержка**
- Чат с поддержкой
- Создание вопросов
- Обмен сообщениями

✅ **Настройки**
- Просмотр и редактирование профиля
- Изменение пароля
- Выход из приложения

## Требования

- Android Studio Hedgehog (2023.1.1) или новее
- JDK 17
- Android SDK 34
- Минимальная версия Android: 8.0 Oreo (API 26)
- Целевая версия Android: 14 (API 34)

## Установка и настройка

### 1. Клонирование проекта

```bash
cd android-app
```

### 2. Настройка API URL

Откройте файл `app/build.gradle.kts` и измените URL API сервера:

```kotlin
android {
    defaultConfig {
        // Для production
        buildConfigField("String", "API_BASE_URL", "\"https://your-domain.com\"")
    }

    buildTypes {
        debug {
            // Для локальной разработки
            // Android эмулятор: используйте 10.0.2.2 для localhost
            // Реальное устройство: используйте IP адрес вашего компьютера
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
        }
    }
}
```

**Варианты настройки для разработки:**

- **Android Emulator** → `http://10.0.2.2:3000` (перенаправляет на localhost хост-машины)
- **Реальное устройство** → `http://192.168.x.x:3000` (ваш локальный IP)
- **Ngrok/Tunneling** → `https://your-ngrok-url.ngrok.io`

### 3. Синхронизация Gradle

Откройте проект в Android Studio и дождитесь синхронизации Gradle dependencies.

```bash
# Или через командную строку
./gradlew build
```

### 4. Сборка приложения

#### Debug версия (для разработки)

```bash
./gradlew assembleDebug
```

APK будет создан в: `app/build/outputs/apk/debug/app-debug.apk`

#### Release версия (для продакшена)

Сначала создайте keystore для подписи приложения:

```bash
keytool -genkey -v -keystore krimvk-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias krimvk
```

Создайте файл `keystore.properties` в корне проекта:

```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=krimvk
storeFile=krimvk-release-key.jks
```

Добавьте в `app/build.gradle.kts`:

```kotlin
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // ...
        }
    }
}
```

Затем соберите release:

```bash
./gradlew assembleRelease
```

APK будет создан в: `app/build/outputs/apk/release/app-release.apk`

### 5. Запуск приложения

#### Через Android Studio

1. Подключите Android устройство или запустите эмулятор
2. Нажмите Run (зеленая кнопка play) или `Shift + F10`

#### Через командную строку

```bash
# Установка на подключенное устройство
./gradlew installDebug

# Запуск
adb shell am start -n com.krimvk.app/.MainActivity
```

## Структура проекта

```
app/src/main/
├── java/com/krimvk/app/
│   ├── data/                    # Data Layer
│   │   ├── api/                 # API сервисы (Retrofit)
│   │   │   ├── ApiService.kt    # Определение API endpoints
│   │   │   └── AuthInterceptor.kt # Interceptor для токенов
│   │   ├── local/               # Локальное хранение
│   │   │   └── TokenManager.kt  # Управление токенами (DataStore)
│   │   ├── model/               # Data models
│   │   │   ├── User.kt
│   │   │   ├── Auth.kt
│   │   │   ├── Account.kt
│   │   │   ├── Bill.kt
│   │   │   ├── Meter.kt
│   │   │   ├── Application.kt
│   │   │   └── Question.kt
│   │   └── repository/          # Repositories
│   │       └── AuthRepository.kt
│   ├── di/                      # Dependency Injection (Hilt)
│   │   ├── NetworkModule.kt     # Network dependencies
│   │   └── AppModule.kt         # App-level dependencies
│   ├── ui/                      # Presentation Layer
│   │   ├── navigation/          # Navigation
│   │   │   └── NavGraph.kt
│   │   ├── screens/             # UI Screens (Compose)
│   │   │   ├── auth/            # Authentication screens
│   │   │   ├── dashboard/       # Dashboard screen
│   │   │   ├── bills/           # Bills screen
│   │   │   ├── meters/          # Meters screen
│   │   │   ├── applications/    # Applications screen
│   │   │   ├── support/         # Support screen
│   │   │   └── settings/        # Settings screen
│   │   ├── theme/               # Material Design Theme
│   │   │   ├── Theme.kt
│   │   │   └── Type.kt
│   │   └── viewmodel/           # ViewModels
│   │       └── AuthViewModel.kt
│   ├── KrimVKApplication.kt     # Application class
│   └── MainActivity.kt          # Main Activity
└── res/                         # Resources
    ├── values/
    │   ├── strings.xml          # Строки приложения
    │   ├── colors.xml           # Цвета
    │   └── themes.xml           # Темы
    └── xml/
        ├── backup_rules.xml
        └── data_extraction_rules.xml
```

## API Интеграция

Приложение интегрируется с следующими API endpoints:

### Аутентификация
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/resend-verification` - Повторная отправка email верификации
- `GET /api/auth/check` - Проверка аутентификации
- `POST /api/user/change-password` - Смена пароля

### Профиль
- `GET /api/user/profile` - Получение профиля
- `PUT /api/user/profile` - Обновление профиля

### Лицевые счета
- `GET /api/accounts` - Список счетов
- `POST /api/accounts` - Добавление счета

### Dashboard
- `GET /api/dashboard/stats` - Статистика

### Счета
- `GET /api/bills` - Список счетов к оплате

### Счетчики
- `GET /api/meters` - Список счетчиков
- `POST /api/meters` - Добавление счетчика
- `POST /api/meters/readings` - Передача показаний

### Заявки
- `GET /api/applications` - Список заявок
- `POST /api/applications/create` - Создание заявки

### Поддержка
- `GET /api/questions` - Список вопросов
- `POST /api/questions/create` - Создание вопроса
- `POST /api/questions/send-message` - Отправка сообщения

## Безопасность

- Токены хранятся в зашифрованном DataStore
- HTTPS для всех запросов в production
- ProGuard/R8 для обфускации кода в release сборках
- Backup rules исключают чувствительные данные

## Тестирование

### Запуск Unit тестов

```bash
./gradlew test
```

### Запуск Instrumentation тестов

```bash
./gradlew connectedAndroidTest
```

## Troubleshooting

### Проблема: "Unable to connect to server"

**Решение:**
1. Проверьте, что backend сервер запущен
2. Убедитесь, что `API_BASE_URL` настроен правильно
3. Для эмулятора используйте `10.0.2.2` вместо `localhost`
4. Для реального устройства убедитесь, что оно в одной сети с компьютером

### Проблема: "Cleartext HTTP traffic not permitted"

**Решение:**
В `AndroidManifest.xml` уже добавлено `android:usesCleartextTraffic="true"` для разработки.
Для production используйте только HTTPS.

### Проблема: Gradle sync failed

**Решение:**
1. Проверьте интернет соединение
2. Очистите кеш: `./gradlew clean`
3. Invalidate Caches в Android Studio: `File -> Invalidate Caches / Restart`

## Дальнейшее развитие

### Планируемые улучшения

- 🔄 Pull-to-refresh для обновления данных
- 🔔 Push-уведомления о новых счетах
- 💳 Интеграция платежных систем
- 📊 Графики потребления
- 🌙 Темная тема
- 🌍 Поддержка нескольких языков
- 📴 Offline режим с кешированием
- 🔐 Biometric аутентификация (отпечаток пальца, Face ID)

## Лицензия

Proprietary - Все права защищены

## Контакты

При возникновении вопросов обращайтесь к команде разработки.
