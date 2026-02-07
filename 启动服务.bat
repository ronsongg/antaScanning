@echo off
echo ======================================
echo   Starting Development Server
echo ======================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting server...
echo.

npx vite

pause
