@echo off
setlocal
cd /d "%~dp0"
echo Starting floor-plan AI inference service on http://127.0.0.1:8787
python floorplan_server.py

