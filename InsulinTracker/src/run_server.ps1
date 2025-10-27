# PowerShell script to run the Insulin Tracker server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Insulin Tracker Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to the script directory
Set-Location $PSScriptRoot
Write-Host "Current directory: $PWD" -ForegroundColor Green

# Check if virtual environment exists
$venvPath = "..\..\venv\Scripts\Activate.ps1"
if (-not (Test-Path $venvPath)) {
    Write-Host "ERROR: Virtual environment not found at $venvPath" -ForegroundColor Red
    Write-Host "Please ensure the virtual environment is properly set up." -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
try {
    & $venvPath
    Write-Host "Virtual environment activated successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to activate virtual environment" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Host "Python version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found in virtual environment" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "Starting Insulin Tracker server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    python app.py
} catch {
    Write-Host "ERROR: Failed to start server" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to continue..."
