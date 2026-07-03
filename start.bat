@echo off
echo Starting Book Management System...
start "Backend" cmd /c "cd /d %~dp0bms-backend && npm install && npm start"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /c "cd /d %~dp0bms-frontend && npm install && npm run dev"
echo Started.
echo Backend : http://localhost:3001
echo Frontend: http://localhost:5173
pause
