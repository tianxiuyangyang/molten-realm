@echo off
cd /d "%~dp0"
start "Molten Realm Server" cmd /k "python -m http.server 4173"
timeout /t 1 /nobreak >nul
start "" "http://localhost:4173/?region=portal"
