@echo off
cd /d "%~dp0"
set PYTHON=%~dp0.venv\Scripts\python.exe
if not exist "%PYTHON%" (
  echo Refined1 runtime is not installed. Run setup.bat first.
  pause
  exit /b 1
)
echo Starting Refined1 floor-plan service...
"%PYTHON%" server.py
pause
