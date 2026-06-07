@echo off
cd /d "%~dp0"
set URL=http://127.0.0.1:8000/index.html

where py >nul 2>nul
if %errorlevel%==0 (
  start "住造 DFC 本地服务" cmd /k py floorplan_server.py
  timeout /t 2 /nobreak >nul
  start "" "%URL%"
  exit /b
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "住造 DFC 本地服务" cmd /k python floorplan_server.py
  timeout /t 2 /nobreak >nul
  start "" "%URL%"
  exit /b
)

echo Python was not found. Please install Python, then run this file again.
pause
