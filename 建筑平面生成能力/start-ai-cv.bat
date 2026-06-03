@echo off
cd /d "%~dp0"
echo Starting AI/CV floor-plan test server...
py server.py
if %errorlevel% neq 0 python server.py
pause
