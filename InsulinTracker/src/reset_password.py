# Password Reset Utility for Insulin Tracker
# This script allows you to reset a user's password

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import os

# Initialize Flask app (same config as main app)
app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev_key_123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User model (basic version to avoid schema issues)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

def reset_password():
    print("=== Insulin Tracker Password Reset Utility ===")
    print()
    
    # List all users
    users = User.query.all()
    if not users:
        print("No users found in the database.")
        return
    
    print("Current users in the database:")
    for i, user in enumerate(users, 1):
        print(f"{i}. {user.username}")
    print()
    
    # Get username to reset
    username = input("Enter the username to reset password: ").strip()
    
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"User '{username}' not found!")
        return
    
    # Get new password
    new_password = input("Enter new password: ").strip()
    if not new_password:
        print("Password cannot be empty!")
        return
    
    # Confirm password
    confirm_password = input("Confirm new password: ").strip()
    if new_password != confirm_password:
        print("Passwords do not match!")
        return
    
    # Update password
    user.set_password(new_password)
    db.session.commit()
    
    print(f"Password successfully reset for user '{username}'!")
    print("You can now log in with the new password.")

if __name__ == '__main__':
    with app.app_context():
        reset_password()
