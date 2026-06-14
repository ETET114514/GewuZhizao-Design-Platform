@echo off
cd /d "%~dp0"
echo Starting AI/CV floor-plan test server...
if exist "%USERPROFILE%\miniforge3\_conda.exe" if exist "%~dp0..\.conda-cubicasa" (
  "%USERPROFILE%\miniforge3\_conda.exe" run -p "%~dp0..\.conda-cubicasa" python server.py
  goto :done
)
py server.py
if %errorlevel% neq 0 python server.py
:done
pause
