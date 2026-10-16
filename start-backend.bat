@echo off
title Plant Scientist - FastAPI Backend Server
echo ============================================
echo   Plant Scientist - FastAPI Backend Server
echo ============================================
echo.
echo Binding to 0.0.0.0:8000 (accessible locally and over LAN / USB)
echo Press Ctrl+C to stop the server.
echo.
cd /d "%~dp0Backend"
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
