@echo off
setlocal

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-windows.ps1"

if errorlevel 1 (
  echo.
  echo Failed to start the local demo server.
  echo You can also run this from PowerShell:
  echo powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-windows.ps1"
  echo.
  pause
)
