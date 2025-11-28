@echo off
REM XPOS Printer Bridge Desktop App - Setup Script for Windows

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║       XPOS Printer Bridge Desktop App Setup             ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo 1️⃣  Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found!
    echo    Please install Node.js v16 or later from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Check npm
echo 2️⃣  Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm found: %NPM_VERSION%
echo.

REM Install dependencies
echo 3️⃣  Installing dependencies...
echo    This may take a few minutes...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Note about icons
echo 4️⃣  Icon setup...
echo    ⚠️  Icon generation requires ImageMagick on Windows.
echo    📝 You can create icons manually or use online tools.
echo    📝 See electron\assets\README.md for instructions.
echo.

REM Summary
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║                 ✅ Setup Complete!                       ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Next steps:
echo.
echo 1. Test the app in development mode:
echo    npm run electron:dev
echo.
echo 2. Build Windows installer:
echo    npm run electron:build:win
echo.
echo 3. Find installer in:
echo    dist-electron\
echo.
echo 📚 Documentation:
echo    - QUICKSTART.md    - Quick start guide
echo    - README-DESKTOP.md - User documentation
echo    - BUILDING.md       - Build instructions
echo.
echo 🎉 Happy building!
echo.
pause
