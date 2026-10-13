# Insulin-Tracker

This is an Insulin Tracker utilizing DeepSeek AI to estimate information regarding food and drinks.

**⚠️ IMPORTANT DISCLAIMER:** This program is designed to provide ESTIMATES, not absolute values. Do not rely on this code for medical decisions. Always consult with healthcare professionals.

## Setup Instructions

### Prerequisites
- Python 3.8+
- pip

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/The-John-Man/Insulin-Tracker.git
   cd Insulin-Tracker
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   
   **Option A: Use the automated setup script (recommended)**
   ```bash
   python setup_local_env.py
   ```
   This will automatically generate a secure SECRET_KEY and create a `.env` file.

   **Option B: Manual setup**
   ```bash
   # Generate a secure SECRET_KEY
   python -c "import secrets; print(secrets.token_hex(32))"
   
   # Create .env file with your keys
   cp .env.example .env
   # Edit .env and add your generated SECRET_KEY and OPENAI_API_KEY
   ```

4. **Run the application**
   ```bash
   cd InsulinTracker/src
   python app.py
   ```

The application will automatically create the database on first run.

### Environment Variables

- `SECRET_KEY` (required): Used for session management and security. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
- `OPENAI_API_KEY` (required): Your OpenAI API key for AI features
- `DATABASE_URL` (optional): PostgreSQL connection string. If not set, uses SQLite locally
- `PORT` (optional): Server port. Defaults to 5000

### Heroku Deployment

Make sure to set the following config vars on Heroku:
```bash
heroku config:set SECRET_KEY=<your_generated_key>
heroku config:set OPENAI_API_KEY=<your_openai_key>
```

The `DATABASE_URL` is automatically set by Heroku when you add the PostgreSQL addon.
