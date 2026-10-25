@echo off
title SENTRIX — AICTE Integrated Complaint & Overlap Tracking System (SIH26264)
echo ======================================================================
echo    SENTRIX - AICTE Inter-Bureau Grievance & Overlap Intelligence System
echo    SIH Problem Statement: SIH26264
echo ======================================================================
echo.
echo [1/3] Starting Backend API (FastAPI) on Port 8000...
start "SENTRIX Backend API" "%~dp0run_backend.bat"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Frontend Portal (Vite + React) on Port 5173...
start "SENTRIX Frontend Portal" "%~dp0run_frontend.bat"

timeout /t 2 /nobreak >nul

echo.
echo [3/3] Opening Web Browser to Login Portal...
echo ======================================================================
echo  Web Application:   http://localhost:5173
echo  API Documentation: http://127.0.0.1:8000/docs
echo ======================================================================
start http://localhost:5173
echo.
echo SENTRIX services are running. To stop, close the respective service terminal windows.
pause
