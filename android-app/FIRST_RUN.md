# 🚀 Первый запуск проекта

## ⚠️ ВАЖНО: Сначала откройте в Android Studio!

**НЕ пытайтесь собрать через командную строку первый раз.**

Android Studio автоматически настроит все необходимое.

---

## Шаг 1: Откройте проект

1. Запустите **Android Studio**
2. Нажмите **File → Open**
3. Выберите папку: `/Users/danielkozhemiakin/Developer/krimvk/android-app`
4. Нажмите **Open**

## Шаг 2: Дождитесь Gradle Sync

После открытия Android Studio автоматически:
- ✅ Скачает Gradle 8.2
- ✅ Создаст Gradle Wrapper файлы
- ✅ Скачает все зависимости
- ✅ Настроит проект

**Это займет 3-5 минут при первом запуске.**

Внизу экрана вы увидите прогресс: `Gradle Sync in progress...`

## Шаг 3: Проверьте JDK (если есть ошибки)

Если Gradle Sync завершился с ошибкой про JDK:

1. Откройте: **Android Studio → Settings (Preferences на Mac)**
2. Перейдите: **Build, Execution, Deployment → Build Tools → Gradle**
3. В поле **"Gradle JDK"** выберите: **jbr-17** (или JDK 17)
4. Нажмите **Apply**, затем **OK**
5. Нажмите кнопку "Sync Project with Gradle Files" (иконка слона 🐘)

## Шаг 4: Настройте API URL

Откройте файл: `app/build.gradle.kts`

Найдите секцию `buildTypes` и измените URL:

```kotlin
buildTypes {
    debug {
        // Для Android Emulator (localhost вашего компьютера)
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")

        // Для реального устройства (замените на ваш IP)
        // buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.100:3000\"")
    }
}
```

**Как узнать ваш IP адрес:**
- **macOS**: Откройте Terminal → введите `ifconfig | grep "inet "`
- **Windows**: Откройте CMD → введите `ipconfig`
- **Linux**: Откройте Terminal → введите `ip addr show`

## Шаг 5: Запустите backend сервер

В **отдельном терминале** (не в Android Studio):

```bash
cd /Users/danielkozhemiakin/Developer/krimvk
npm install
npm run dev
```

Backend должен запуститься на `http://localhost:3000`

## Шаг 6: Запустите приложение

### Вариант A: С эмулятором

1. В Android Studio нажмите: **Device Manager** (иконка телефона справа)
2. Создайте новый эмулятор: **Create Virtual Device**
   - Выберите: **Pixel 5** или **Pixel 6**
   - System Image: **API 34** (Android 14)
   - Нажмите **Finish**
3. Запустите эмулятор (нажмите на ▶️ возле имени устройства)
4. В основном окне нажмите: **Run 'app'** (зеленая кнопка ▶️)

### Вариант B: С реальным устройством

1. Включите **Режим разработчика** на Android устройстве:
   - Откройте **Настройки**
   - Перейдите в **О телефоне**
   - Тапните 7 раз по **Номер сборки**

2. Включите **Отладку по USB**:
   - Вернитесь в **Настройки**
   - Откройте **Для разработчиков**
   - Включите **Отладка по USB**

3. Подключите телефон к компьютеру через USB

4. Разрешите отладку на телефоне (появится всплывающее окно)

5. В Android Studio выберите ваше устройство в списке

6. Нажмите **Run 'app'** (зеленая кнопка ▶️)

---

## ✅ Готово!

Приложение установится и запустится на устройстве/эмуляторе.

Вы увидите экран входа. Используйте:
- **Email**: ваш зарегистрированный email
- **Пароль**: ваш пароль

Или нажмите **"Нет аккаунта? Зарегистрироваться"** для создания нового.

---

## 📱 После первой успешной сборки

Теперь можно использовать командную строку:

```bash
cd android-app

# Сборка debug APK
./gradlew assembleDebug

# Установка на подключенное устройство
./gradlew installDebug

# Запуск приложения
adb shell am start -n com.krimvk.app/.MainActivity
```

APK файл будет здесь: `app/build/outputs/apk/debug/app-debug.apk`

---

## 🔧 Проблемы?

См. файл [TROUBLESHOOTING.md](TROUBLESHOOTING.md) для решения частых проблем.

---

## 💡 Полезные команды

```bash
# Посмотреть подключенные устройства
adb devices

# Логи в реальном времени
adb logcat | grep "KrimVK"

# Удалить приложение
adb uninstall com.krimvk.app

# Очистить и пересобрать
./gradlew clean assembleDebug
```

---

## 📚 Дополнительная документация

- [README.md](README.md) - Основная документация
- [DEVELOPMENT.md](DEVELOPMENT.md) - Руководство для разработчиков
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Решение проблем
- [QUICK_START.md](QUICK_START.md) - Краткое руководство
