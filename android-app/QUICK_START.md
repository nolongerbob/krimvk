# Быстрый старт

## Для пользователей

### Установка APK

1. Скачайте файл `app-release.apk` или `app-debug.apk`
2. Откройте файл на Android устройстве
3. Разрешите установку из неизвестных источников (если требуется)
4. Следуйте инструкциям установщика
5. Откройте приложение "КримВК"

### Первый запуск

1. **Регистрация**:
   - Нажмите "Нет аккаунта? Зарегистрироваться"
   - Введите ФИО, email, телефон и пароль
   - Нажмите "Зарегистрироваться"
   - Проверьте email для подтверждения регистрации

2. **Вход**:
   - Введите ваш email и пароль
   - Нажмите "Войти"

3. **Добавление лицевого счета**:
   - В Dashboard перейдите в раздел "Счета"
   - Нажмите "Добавить счет"
   - Введите номер лицевого счета и пароль из 1С

4. **Передача показаний счетчиков**:
   - Перейдите в раздел "Счетчики воды"
   - Добавьте счетчик
   - Нажмите "Сфотографировать счетчик" или введите показания вручную

---

## Для разработчиков

### Системные требования

- **macOS/Linux/Windows**
- **Android Studio** Hedgehog (2023.1.1+)
- **JDK 17**
- **Android SDK 34**

### Установка

```bash
# 1. Перейдите в директорию проекта
cd android-app

# 2. Сделайте gradlew исполняемым (Mac/Linux)
chmod +x gradlew

# 3. Откройте проект в Android Studio
# File -> Open -> выберите папку android-app
```

### Настройка API

Откройте `app/build.gradle.kts` и измените:

```kotlin
buildTypes {
    debug {
        // Для Android Emulator
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")

        // Для реального устройства (замените на ваш IP)
        // buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.100:3000\"")
    }
}
```

### Запуск backend

```bash
# В корне проекта (не в android-app)
cd ..
npm install
npm run dev
```

### Запуск приложения

#### Через Android Studio
1. Запустите эмулятор или подключите устройство
2. Нажмите Run (▶️) или `Shift + F10`

#### Через командную строку
```bash
./gradlew installDebug
adb shell am start -n com.krimvk.app/.MainActivity
```

### Сборка APK

```bash
# Debug
./gradlew assembleDebug
# Файл: app/build/outputs/apk/debug/app-debug.apk

# Release
./gradlew assembleRelease
# Файл: app/build/outputs/apk/release/app-release.apk
```

### Полезные команды

```bash
# Очистка
./gradlew clean

# Список устройств
adb devices

# Логи в реальном времени
adb logcat | grep "KrimVK"

# Удалить приложение
adb uninstall com.krimvk.app
```

---

## Troubleshooting

### Не могу подключиться к серверу

**Android Emulator:**
```kotlin
API_BASE_URL = "http://10.0.2.2:3000"  // 10.0.2.2 = localhost хост-машины
```

**Реальное устройство:**
```kotlin
// Узнайте ваш локальный IP
// macOS: ifconfig | grep "inet "
// Windows: ipconfig
// Linux: ip addr show

API_BASE_URL = "http://192.168.1.100:3000"  // Замените на ваш IP
```

### Ошибка "Cleartext HTTP traffic not permitted"

В `AndroidManifest.xml` уже добавлено:
```xml
android:usesCleartextTraffic="true"
```

Для production используйте HTTPS.

### Gradle sync failed

```bash
./gradlew clean
# В Android Studio: File -> Invalidate Caches / Restart
```

### Hilt compilation errors

Убедитесь что все аннотации на месте:
- `@HiltAndroidApp` на `KrimVKApplication`
- `@AndroidEntryPoint` на `MainActivity`
- `@HiltViewModel` на всех ViewModel

---

## Документация

- **README.md** - Основная документация
- **DEVELOPMENT.md** - Руководство для разработчиков
- **PROJECT_INFO.md** - Информация о проекте
- **QUICK_START.md** - Этот файл

## Поддержка

При возникновении проблем:
1. Проверьте документацию выше
2. Убедитесь что backend сервер запущен
3. Проверьте логи: `adb logcat`
4. Откройте issue в репозитории
