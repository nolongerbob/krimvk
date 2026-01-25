# 🔧 Исправление ошибки JDK/kapt

## Проблема

Вы видите ошибку:
```
java.lang.IllegalAccessError: superclass access check failed:
class org.jetbrains.kotlin.kapt3.base.javac.KaptJavaCompiler
cannot access class com.sun.tools.javac.main.JavaCompiler
```

**Причина:** Gradle daemon запущен с неправильной версией JDK (возможно JDK 21+), но проект требует JDK 17.

---

## ✅ Решение

### Шаг 1: Остановите все Gradle процессы

В Terminal выполните:
```bash
pkill -f '.*GradleDaemon.*'
```

Или в Android Studio:
```
File → Invalidate Caches → Invalidate and Restart
```

### Шаг 2: Настройте JDK в Android Studio

#### Вариант A: Через Settings (Рекомендуется)

1. Откройте **Android Studio**

2. Перейдите в настройки:
   ```
   Android Studio → Settings (на Mac)
   File → Settings (на Windows/Linux)
   ```
   Или нажмите `Cmd + ,` (Mac) / `Ctrl + Alt + S` (Windows/Linux)

3. Найдите Gradle настройки:
   ```
   Build, Execution, Deployment
     → Build Tools
       → Gradle
   ```

4. В поле **"Gradle JDK"** выберите:
   ```
   ✅ jbr-17
   ```

   Или:
   ```
   ✅ Embedded JDK (version: 17.0.14)
   ```

5. Нажмите **Apply**, затем **OK**

#### Вариант B: Через Project Structure

1. Откройте: `File → Project Structure` (или `Cmd + ;` на Mac)

2. В левом меню выберите: **SDK Location**

3. В разделе **Gradle Settings**:
   - Нажмите на поле **Gradle JDK**
   - Выберите **jbr-17** или **Embedded JDK 17**

4. Нажмите **Apply**, затем **OK**

### Шаг 3: Очистите проект

В Android Studio:

```
Build → Clean Project
```

Дождитесь завершения.

### Шаг 4: Пересоберите проект

```
Build → Rebuild Project
```

---

## 🎯 Проверка

После выполнения этих шагов:

1. В нижней панели Android Studio не должно быть ошибок
2. Статус Gradle sync: ✅ **Gradle sync finished**
3. Вы можете нажать Run (▶️) для запуска приложения

---

## 🔍 Дополнительная диагностика

### Проверить текущий JDK в Gradle

Откройте Terminal в Android Studio и выполните:

```bash
./gradlew -version
```

Должно показать:
```
JVM:          17.0.14 (JetBrains s.r.o. 17.0.14+1-b1367.22)
```

### Если показывает JDK 21 или выше

Раскомментируйте строку в `gradle.properties`:

```properties
org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home
```

Затем:
```bash
./gradlew --stop
./gradlew clean
```

---

## 📋 Пошаговая визуальная инструкция

### 1. Откройте Settings
```
┌─────────────────────────────────────┐
│ Android Studio                      │
├─────────────────────────────────────┤
│ Preferences... (Cmd+,)         ◄────┼── Нажмите здесь
│ Settings for New Projects...        │
│ ...                                 │
└─────────────────────────────────────┘
```

### 2. Найдите Gradle
```
┌─ Settings ───────────────────────────┐
│ ├─ Appearance & Behavior             │
│ ├─ Keymap                            │
│ ├─ Editor                            │
│ ├─ Plugins                           │
│ ├─ Version Control                   │
│ └─ Build, Execution, Deployment      │
│    ├─ Build Tools                    │
│    │  └─ Gradle                  ◄───┼── Откройте это
│    ├─ Compiler                       │
│    └─ Debugger                       │
└──────────────────────────────────────┘
```

### 3. Выберите JDK 17
```
┌─ Gradle ─────────────────────────────┐
│                                      │
│ Gradle JDK:                          │
│ ┌──────────────────────────────────┐ │
│ │ jbr-17                      [▼] │ │◄── Выберите jbr-17
│ └──────────────────────────────────┘ │
│                                      │
│ [Apply]  [Cancel]  [OK]              │
└──────────────────────────────────────┘
```

---

## 🚨 Если ничего не помогло

### Крайнее решение: Удалите Gradle кэш

**⚠️ ВНИМАНИЕ:** Это удалит все кэшированные библиотеки Gradle. Повторная загрузка займет время.

```bash
# Остановите все Gradle процессы
./gradlew --stop

# Удалите кэш Gradle
rm -rf ~/.gradle/caches/
rm -rf ~/.gradle/daemon/

# Удалите build директорию проекта
rm -rf android-app/build
rm -rf android-app/app/build

# Откройте проект в Android Studio заново
# Android Studio пересоздаст всё с нуля
```

---

## ✅ После успешной сборки

Вы увидите:
```
BUILD SUCCESSFUL in 45s
```

И сможете запустить приложение на эмуляторе или устройстве.

---

## 📞 Помощь

Если проблема не решена, создайте issue с:

1. Полным текстом ошибки
2. Выводом команды: `./gradlew -version`
3. Выводом команды: `java -version`
4. Версией Android Studio
5. Скриншотом настроек Gradle JDK

---

## 🎓 Объяснение

**Почему это происходит?**

- Kotlin kapt (Kotlin Annotation Processing Tool) требует JDK 17
- Ваша система может использовать JDK 21 по умолчанию
- Gradle daemon кэширует версию JDK при первом запуске
- Нужно остановить daemon и настроить правильный JDK

**Что делает jbr-17?**

- JBR = JetBrains Runtime
- Это кастомная версия JDK от JetBrains
- Оптимизирована для IntelliJ IDEA и Android Studio
- Включена в Android Studio по умолчанию
