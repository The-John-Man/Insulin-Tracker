# Simple Insulin Tracker Server Starter
# Run this script to start the server

# Get the current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Green

# Define paths
$venvPython = "C:\code\Insulin-Tracker\Insulin-Tracker\venv\Scripts\python.exe"
$appPath = "C:\code\Insulin-Tracker\Insulin-Tracker\InsulinTracker\src\app.py"

Write-Host "Virtual environment Python: $venvPython" -ForegroundColor Green
Write-Host "App path: $appPath" -ForegroundColor Green

# Check if files exist
if (-not (Test-Path $venvPython)) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

if (-not (Test-Path $appPath)) {
    Write-Host "ERROR: app.py not found!" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "Starting Insulin Tracker server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to the app directory
Set-Location "C:\code\Insulin-Tracker\Insulin-Tracker\InsulinTracker\src"

# Start the server
& $venvPython $appPath
