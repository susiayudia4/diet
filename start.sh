#!/bin/bash

echo "========================================="
echo "CalorieTracker - Запуск приложения"
echo "========================================="
echo ""

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "Пожалуйста установите Node.js с https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js установлен"
echo ""

# Установка зависимостей
echo "Устанавливаем зависимости (первый запуск)..."
npm install > /dev/null 2>&1

echo ""
echo "========================================="
echo "Запускаем сервер..."
echo "========================================="
echo ""
echo "🚀 Сервер запускается на http://localhost:3000"
echo "📚 API документация: http://localhost:3000/api-docs"
echo ""
echo "Тестовые аккаунты:"
echo "   user1@example.com / password123"
echo "   dietitian1@example.com / password123"
echo "   admin@example.com / password123"
echo ""
echo "Нажмите Ctrl+C для остановки сервера"
echo ""

node server.js
