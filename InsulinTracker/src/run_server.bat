@echo off
echo ========================================
echo    Insulin Tracker Server Startup
echo ========================================
echo.

REM Change to the script directory
cd /d "%~dp0"
echo Current directory: %CD%

REM Check if virtual environment exists
if not exist "..\..\venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found at ..\..\venv\Scripts\activate.bat
    echo Please ensure the virtual environment is properly set up.
    pause
    exit /b 1
)

echo Activating virtual environment...
call "..\..\venv\Scripts\activate.bat"

REM Check if activation was successful
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo Virtual environment activated successfully!
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in virtual environment
    pause
    exit /b 1
)

echo Starting Insulin Tracker server...
echo Server will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

python app.py

echo.
echo Server stopped.
pause