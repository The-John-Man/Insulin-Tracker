# Insulin Tracker Setup Instructions

## Virtual Environment Setup Complete! ✅

Your virtual environment has been created and configured. Here's what was done:

### 1. Virtual Environment Created
- Created `venv` folder in the project root
- Installed all required dependencies from `requirements.txt`

### 2. Dependencies Installed
- Flask 2.3.3
- Flask-SQLAlchemy 3.0.5
- Flask-Login 0.6.3
- Werkzeug 2.3.7
- python-dotenv 1.0.0
- openai 1.3.0

### 3. Run Script Updated
- Updated `run_server.bat` to use the new virtual environment

## How to Run the Application

### Option 1: Using the Batch File (Recommended)
1. Double-click `InsulinTracker/src/run_server.bat`
2. The server will start automatically

### Option 2: Manual Command Line
1. Open PowerShell/Command Prompt
2. Navigate to the project directory:
   ```bash
   cd "C:\code\Insulin-Tracker\Insulin-Tracker"
   ```
3. Activate the virtual environment:
   ```bash
   .\venv\Scripts\Activate.ps1
   ```
4. Navigate to the src directory:
   ```bash
   cd InsulinTracker\src
   ```
5. Run the application:
   ```bash
   python app.py
   ```

## Important: API Key Setup Required

The application requires an OpenAI API key to function. You need to:

1. Get an API key from [OpenRouter.ai](https://openrouter.ai/) (the app uses OpenRouter as the API provider)
2. Edit the `.env` file in `InsulinTracker/src/` directory
3. Replace `your_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

## Accessing the Application

Once running, the application will be available at:
- **Main Application**: http://localhost:5000
- **Login Page**: http://localhost:5000/login.html

## Features

- User registration and login
- Meal logging and analysis
- AI-powered meal analysis for insulin suggestions
- Chat functionality with AI assistant
- Meal history tracking

## Troubleshooting

If you encounter any issues:
1. Make sure the virtual environment is activated
2. Ensure you have a valid OpenAI API key in the `.env` file
3. Check that all dependencies are installed correctly
4. Verify the server is running on port 5000

Enjoy using your Insulin Tracker application! 🩸📊
