@echo off
title SENTRIX Frontend Portal (Port 5173)
cd /d "%~dp0frontend"
if exist "%~dp0tools\node-v20.18.0-win-x64\npm.cmd" (
    set "PATH=%~dp0tools\node-v20.18.0-win-x64;%PATH%"
)
echo ======================================================================
echo    SENTRIX - AICTE Web Portal (React 18 + Vite)
echo    URL: http://localhost:5173
echo ======================================================================
echo.
npm run dev -- --host 127.0.0.1 --port 5173
pause
