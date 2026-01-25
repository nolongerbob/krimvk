# Решение проблем сборки

## Проблема: JDK Compatibility Error (kapt)

Если вы видите ошибку:
```
java.lang.IllegalAccessError: superclass access check failed:
class org.jetbrains.kotlin.kapt3.base.javac.KaptJavaCompiler
```

### Решение 1: Через Android Studio (Рекомендуется)

1. Откройте проект в Android Studio
2. Android Studio автоматически настроит Gradle Wrapper
3. Перейдите в: `Settings -> Build, Execution, Deployment -> Build Tools -> Gradle`
4. Убедитесь, что "Gradle JDK" установлен на **JDK 17** (jbr-17)
5. Нажмите "Apply" и "OK"
6. Нажмите "Sync Project with Gradle Files" (иконка слона с стрелкой)
7. После успешной синхронизации нажмите Run

### Решение 2: Очистка кэша Gradle

```bash
# Очистите Gradle кэш
rm -rf ~/.gradle/caches/

# Затем откройте проект в Android Studio
```

### Решение 3: Использование правильного JDK

Если у вас установлена неправильная версия JDK:

```bash
# Проверьте версию
java -version

# Должно показать OpenJDK 17
```

Если показывает JDK 21 или новее:

1. Установите JDK 17 из Android Studio
2. Или скачайте с https://adoptium.net/temurin/releases/?version=17

## Проблема: Gradle Wrapper отсутствует

Если вы видите:
```
Error: Could not find or load main class org.gradle.wrapper.GradleWrapperMain
```

### Решение: Откройте проект в Android Studio

Android Studio автоматически создаст Gradle Wrapper файлы при открытии проекта.

1. Откройте Android Studio
2. File -> Open
3. Выберите папку `android-app`
4. Android Studio сгенерирует wrapper файлы
5. Дождитесь завершения Gradle sync

## Проблема: Иконки приложения

Если вы видите ошибки про `mipmap/ic_launcher`:

Это уже исправлено - используется `@drawable/ic_launcher_foreground`

Для создания собственной иконки:
1. File -> New -> Image Asset
2. Icon Type: Launcher Icons
3. Загрузите свое изображение
4. Android Studio создаст все необходимые ресурсы

## Рекомендуемый процесс первой сборки

### Шаг 1: Откройте в Android Studio
```
File -> Open -> выберите папку android-app
```

### Шаг 2: Дождитесь Gradle Sync
Android Studio автоматически:
- Скачает Gradle
- Настроит Gradle Wrapper
- Синхронизирует зависимости

### Шаг 3: Проверьте JDK
```
Settings -> Build Tools -> Gradle -> Gradle JDK = "jbr-17"
```

### Шаг 4: Соберите проект
```
Build -> Rebuild Project
```

### Шаг 5: Запустите
```
Run -> Run 'app'
```

## Важно

**НЕ собирайте проект через командную строку первый раз!**

Сначала откройте в Android Studio, дождитесь полной настройки, и только потом можно использовать `./gradlew`.

## После успешной настройки в Android Studio

Теперь можно использовать командную строку:

```bash
cd android-app

# Очистка
./gradlew clean

# Сборка debug
./gradlew assembleDebug

# Сборка release
./gradlew assembleRelease

# Установка на устройство
./gradlew installDebug
```

## Полезные команды

```bash
# Посмотреть все задачи Gradle
./gradlew tasks

# Проверить зависимости
./gradlew dependencies

# Проверить версию Gradle
./gradlew --version
```

## Системные требования

- **JDK**: 17 (встроенный в Android Studio)
- **Gradle**: 8.2 (автоматически через wrapper)
- **Android Studio**: Hedgehog (2023.1.1) или новее
- **Android SDK**: 34
- **Kotlin**: 1.9.20

## Контакты

Если проблемы остались, создайте issue с:
- Полным текстом ошибки
- Версией JDK (`java -version`)
- Версией Android Studio
- Версией Gradle (`./gradlew --version`)
