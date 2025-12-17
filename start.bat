@echo off
chcp 65001 > nul
echo =========================================
echo CalorieTracker - Запуск приложения
echo =========================================
echo.

echo Проверяем Node.js...
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен!
    echo Пожалуйста установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js установлен: %NODE_VERSION%
echo.

echo Проверяем наличие .env файла...
if not exist .env (
    echo ⚠️  Файл .env не найден, создаём...
    (
        echo PORT=3000
        echo JWT_SECRET=calorie-tracker-secret-key-2024-super-secure-random-string
        echo NODE_ENV=development
    ) > .env
    echo ✅ Файл .env создан
) else (
    echo ✅ Файл .env найден
)
echo.

echo Устанавливаем зависимости...
call npm install
if errorlevel 1 (
    echo.
    echo ⚠️  Ошибка при установке зависимостей!
    echo.
    echo Попытка установки с использованием предкомпилированных бинарников...
    call npm install --build-from-source=false
    if errorlevel 1 (
        echo.
        echo ❌ Установка не удалась из-за проблем с компиляцией better-sqlite3
        echo.
        echo =========================================
        echo РЕШЕНИЕ: Установите Visual Studio Build Tools
        echo =========================================
        echo.
        echo 1. Откройте браузер и перейдите на:
        echo    https://visualstudio.microsoft.com/downloads/
        echo.
        echo 2. Прокрутите вниз и найдите:
        echo    "Tools for Visual Studio" ^> "Build Tools for Visual Studio"
        echo.
        echo 3. Скачайте и запустите установщик
        echo.
        echo 4. В установщике выберите:
        echo    "Desktop development with C++"
        echo    (галочка должна быть установлена)
        echo.
        echo 5. Нажмите "Install" и дождитесь завершения
        echo.
        echo 6. После установки перезапустите start.bat
        echo.
        echo =========================================
        echo.
        echo Альтернатива: Используйте Node.js версии 20 LTS
        echo   Текущая версия: %NODE_VERSION%
        echo   Рекомендуется: Node.js 20.x LTS
        echo   Скачать: https://nodejs.org/
        echo.
        echo Подробные инструкции сохранены в файле:
        echo   INSTALL_BUILD_TOOLS.md
        echo.
        pause
        exit /b 1
    )
)
echo ✅ Зависимости установлены
echo.

echo =========================================
echo Запускаем сервер...
echo =========================================
echo.
echo 🚀 Сервер запускается на http://localhost:3000
echo 📚 API документация: http://localhost:3000/api-docs
echo 🌐 Frontend: http://localhost:3000
echo.
echo Тестовые аккаунты:
echo   user1@example.com / password123
echo   dietitian1@example.com / password123
echo   admin@example.com / password123
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

node server.js
if errorlevel 1 (
    echo.
    echo ❌ Ошибка при запуске сервера!
    echo Проверьте логи выше для деталей.
    pause
    exit /b 1
)
pause
