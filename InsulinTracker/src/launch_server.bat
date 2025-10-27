@echo off
echo ========================================
echo    Insulin Tracker Server Launcher
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\..\"
set "VENV_PYTHON=%PROJECT_ROOT%venv\Scripts\python.exe"
set "APP_PATH=%SCRIPT_DIR%app.py"

echo Script directory: %SCRIPT_DIR%
echo Project root: %PROJECT_ROOT%
echo Virtual environment Python: %VENV_PYTHON%
echo App path: %APP_PATH%
echo.

REM Check if virtual environment exists
if not exist "%VENV_PYTHON%" (
    echo ERROR: Virtual environment not found at %VENV_PYTHON%
    echo Please ensure the virtual environment is properly set up.
    pause
    exit /b 1
)

REM Check if app.py exists
if not exist "%APP_PATH%" (
    echo ERROR: app.py not found at %APP_PATH%
    pause
    exit /b 1
)

echo Starting Insulin Tracker server...
echo Server will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

REM Change to the app directory
cd /d "%SCRIPT_DIR%"

REM Start the server
"%VENV_PYTHON%" "%APP_PATH%"

echo.
echo Server stopped.
pause
