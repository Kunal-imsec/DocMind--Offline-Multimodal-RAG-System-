@echo off
setlocal

REM ============================================================
REM ========== WINDOWS → WSL (UBUNTU) PATHS ====================
REM NOTE: Convert Windows path (C:\foo\bar) → WSL path (/mnt/c/foo/bar)
REM ============================================================

REM --- CHANGE THESE 3 PATHS ---
set DJANGO_WIN=\\wsl.localhost\Ubuntu\home\nitin\sih\backend
set FASTAPI_WIN=
set ELECTRON_WIN=\\wsl.localhost\Ubuntu\home\nitin\sih\frontend


REM --- Convert Windows paths to WSL paths automatically ---
for /f "tokens=* usebackq" %%i in (`wsl wslpath "%DJANGO_WIN%"`) do set DJANGO_WSL=%%i
for /f "tokens=* usebackq" %%i in (`wsl wslpath "%FASTAPI_WIN%"`) do set FASTAPI_WSL=%%i

echo Django (WSL): %DJANGO_WSL%
echo FastAPI (WSL): %FASTAPI_WSL%
echo Electron (Win): %ELECTRON_WIN%
echo.
echo Starting all services...
echo.

REM ============================================================
REM ========== START DJANGO (inside WSL Ubuntu) ================
REM ============================================================

start "DJANGO (WSL)" cmd.exe /k ^
"wsl bash -lc \"cd %DJANGO_WSL% && source ai-venv/bin/activate && python manage.py runserver 0.0.0.0:8000\""

REM ============================================================
REM ========== START FASTAPI (inside WSL Ubuntu) ===============
REM ============================================================

start "FASTAPI (WSL)" cmd.exe /k ^
"wsl bash -lc \"cd %FASTAPI_WSL% && chmod +x run.sh && ./run.sh\""

REM ============================================================
REM ========== START ELECTRON (WINDOWS NODE) ===================
REM ============================================================

start "ELECTRON (WIN)" cmd.exe /k ^
"cd /d %ELECTRON_WIN% && npm start"

echo -------------------------------------------------------------
echo All servers started successfully.
echo Close this window anytime; servers run in their own terminals.
echo -------------------------------------------------------------
pause
