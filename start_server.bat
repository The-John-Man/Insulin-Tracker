@echo off
echo ========================================
echo    Insulin Tracker - Quick Start
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "InsulinTracker\src\app.py" (
    echo ERROR: Please run this script from the project root directory
    echo Current directory: %CD%
    echo Expected to find: InsulinTracker\src\app.py
    pause
    exit /b 1
)

echo Starting Insulin Tracker server...
echo.

REM Navigate to the source directory and run the server
cd InsulinTracker\src
call run_server.bat



