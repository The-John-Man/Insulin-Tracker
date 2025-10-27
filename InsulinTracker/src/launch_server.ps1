# Insulin Tracker Server Launcher
# This script provides multiple ways to start the server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Insulin Tracker Server Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$venvPython = Join-Path $projectRoot "venv\Scripts\python.exe"
$appPath = Join-Path $scriptDir "app.py"

Write-Host "Script directory: $scriptDir" -ForegroundColor Green
Write-Host "Project root: $projectRoot" -ForegroundColor Green
Write-Host "Virtual environment Python: $venvPython" -ForegroundColor Green
Write-Host "App path: $appPath" -ForegroundColor Green
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path $venvPython)) {
    Write-Host "ERROR: Virtual environment not found at $venvPython" -ForegroundColor Red
    Write-Host "Please ensure the virtual environment is properly set up." -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

# Check if app.py exists
if (-not (Test-Path $appPath)) {
    Write-Host "ERROR: app.py not found at $appPath" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host "Starting Insulin Tracker server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to the app directory
Set-Location $scriptDir

# Start the server
try {
    & $venvPython $appPath
} catch {
    Write-Host "ERROR: Failed to start server" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to continue..."
