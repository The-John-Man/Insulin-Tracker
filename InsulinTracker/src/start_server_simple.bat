@echo off
echo ========================================
echo    Insulin Tracker Server
echo ========================================
echo.
echo Starting server...
echo Server will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

C:\code\Insulin-Tracker\Insulin-Tracker\venv\Scripts\python.exe C:\code\Insulin-Tracker\Insulin-Tracker\InsulinTracker\src\app.py

echo.
echo Server stopped.
pause
