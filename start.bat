@echo off
echo ========================================
echo   Library Management System
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo Please install Node.js v16+ from https://nodejs.org
    pause
    exit /b 1
)

echo [Pre-check] Installing dependencies if needed...
echo.

if not exist "bms-backend\node_modules" (
    echo Installing backend dependencies...
    cd /d "%~dp0bms-backend"
    call npm install
    cd /d "%~dp0"
    echo Backend dependencies installed.
    echo.
)

if not exist "bms-frontend\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%~dp0bms-frontend"
    call npm install
    cd /d "%~dp0"
    echo Frontend dependencies installed.
    echo.
)

echo [1/2] Starting backend...
start "BMS Backend" cmd /k "cd /d %~dp0bms-backend && npm start"

timeout /t 2 /nobreak >nul

echo [2/2] Starting frontend...
start "BMS Frontend" cmd /k "cd /d %~dp0bms-frontend && npm run dev"

echo.
echo ========================================
echo   Started!
echo.
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   Admin:  admin / 123456
echo   Reader: 2026001 / 123456
echo.
echo   Do NOT close the two cmd windows!
echo ========================================
pause
