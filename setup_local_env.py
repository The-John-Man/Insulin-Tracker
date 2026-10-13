#!/usr/bin/env python3
"""
Local development environment setup script for Insulin Tracker.
Generates a secure SECRET_KEY and creates a .env file if it doesn't exist.
"""

import secrets
import os
from pathlib import Path

def setup_local_env():
    env_path = Path('.env')
    env_example_path = Path('.env.example')
    
    if env_path.exists():
        print("✓ .env file already exists")
        with open(env_path, 'r') as f:
            content = f.read()
            if 'SECRET_KEY=' in content and 'your_secret_key_here' not in content:
                print("✓ SECRET_KEY is already configured")
                return
            else:
                print("⚠ .env exists but SECRET_KEY needs to be set")
    
    # Generate a secure SECRET_KEY
    secret_key = secrets.token_hex(32)
    
    print("\nGenerating secure SECRET_KEY...")
    print(f"SECRET_KEY={secret_key}\n")
    
    if env_path.exists():
        # Read existing content and update SECRET_KEY
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        with open(env_path, 'w') as f:
            found = False
            for line in lines:
                if line.startswith('SECRET_KEY='):
                    f.write(f'SECRET_KEY={secret_key}\n')
                    found = True
                else:
                    f.write(line)
            
            if not found:
                f.write(f'\nSECRET_KEY={secret_key}\n')
        
        print("✓ Updated SECRET_KEY in .env")
    else:
        # Create new .env from example
        if env_example_path.exists():
            with open(env_example_path, 'r') as f:
                content = f.read()
            content = content.replace('your_secret_key_here', secret_key)
        else:
            content = f'SECRET_KEY={secret_key}\n'
        
        with open(env_path, 'w') as f:
            f.write(content)
        
        print("✓ Created .env file with SECRET_KEY")
    
    print("\n⚠ Don't forget to set your OPENAI_API_KEY in .env as well!")
    print("\nYou can now run the application with:")
    print("  cd InsulinTracker/src")
    print("  python app.py")

if __name__ == '__main__':
    setup_local_env()
