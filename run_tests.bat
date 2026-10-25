@echo off
title SENTRIX Automated Test Suite
echo ======================================================================
echo    Running SENTRIX Automated Test Suites
echo ======================================================================
echo.

cd /d "%~dp0"
set PYTHONPATH=%~dp0backend
if exist "%~dp0tools\node-v20.18.0-win-x64\node.exe" (
    set "PATH=%~dp0tools\node-v20.18.0-win-x64;%PATH%"
)

echo [1/2] Running Python Backend Pytest Suite (30 Tests)...
python -m pytest backend/tests -v
if errorlevel 1 (
    echo [ERROR] Backend tests failed.
    pause
    exit /b 1
)

echo.
echo [2/2] Running Frontend Code & Asset Integrity Verification...
cd /d "%~dp0frontend"
node tests/app.test.js
if errorlevel 1 (
    echo [ERROR] Frontend tests failed.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo  All Backend (30) and Frontend Integrity Tests PASSED!
echo ======================================================================
pause
