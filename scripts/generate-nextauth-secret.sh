#!/bin/bash

# Скрипт для генерации NEXTAUTH_SECRET

echo "🔐 Генерация NEXTAUTH_SECRET..."
echo ""

# Способ 1: openssl (если установлен)
if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32)
    echo "✅ Сгенерированный секрет (openssl):"
    echo "$SECRET"
    echo ""
    echo "Добавьте в .env файл:"
    echo "NEXTAUTH_SECRET=\"$SECRET\""
# Способ 2: Node.js (если установлен)
elif command -v node &> /dev/null; then
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    echo "✅ Сгенерированный секрет (Node.js):"
    echo "$SECRET"
    echo ""
    echo "Добавьте в .env файл:"
    echo "NEXTAUTH_SECRET=\"$SECRET\""
# Способ 3: /dev/urandom (Linux)
elif [ -e /dev/urandom ]; then
    SECRET=$(head -c 32 /dev/urandom | base64)
    echo "✅ Сгенерированный секрет (/dev/urandom):"
    echo "$SECRET"
    echo ""
    echo "Добавьте в .env файл:"
    echo "NEXTAUTH_SECRET=\"$SECRET\""
else
    echo "❌ Не найдены инструменты для генерации. Установите openssl или node."
    exit 1
fi

echo ""
echo "💡 Скопируйте значение выше и вставьте в .env файл"

