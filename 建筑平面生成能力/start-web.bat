@echo off
cd /d "%~dp0"
set URL=http://127.0.0.1:8010/index.html

where py >nul 2>nul
if %errorlevel%==0 (
  start "建筑平面生成能力" cmd /k py server.py
  timeout /t 2 /nobreak >nul
  start "" "%URL%"
  exit /b
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "建筑平面生成能力" cmd /k python server.py
  timeout /t 2 /nobreak >nul
  start "" "%URL%"
  exit /b
)

echo Python was not found. Please install Python, then run this file again.
pause
