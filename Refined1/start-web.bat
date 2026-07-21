@echo off
cd /d "%~dp0"
set URL=http://127.0.0.1:8010/index.html
set PYTHON=%~dp0.venv\Scripts\python.exe

if not exist "%PYTHON%" (
  echo Refined1 runtime is not installed.
  echo Run setup.bat first.
  pause
  exit /b 1
)

start "Refined1 FloorPlan" cmd /k ""%PYTHON%" server.py"
timeout /t 2 /nobreak >nul
start "" "%URL%"
