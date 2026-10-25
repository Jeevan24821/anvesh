@echo off
title SENTRIX Backend API (Port 8000)
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0backend
echo ======================================================================
echo    SENTRIX - AICTE Backend API Service (SIH26264)
echo    Port: 8000 | Swagger Docs: http://127.0.0.1:8000/docs
echo ======================================================================
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
