# from openai import OpenAI
# import os 
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# response = client.responses.create(
#     model="gpt-5",
#     input="Write a one-sentence bedtime story about a unicorn."
# )

# print(response.output_text)




from flask import Flask, request, jsonify, send_from_directory, redirect, url_for, session, flash # pyright: ignore[reportMissingImports]
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()
app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = 'dev_key_123'  # Temporary key for testing - change in production!
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    meal_logs = db.relationship('MealLog', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class MealLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meal_text = db.Column(db.String(500), nullable=False)
    calories = db.Column(db.String(50))
    effect = db.Column(db.String(50))
    insulin_suggestion = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        return jsonify({"message": "Logged in successfully"})
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"})

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"})

@app.route('/meal-history')
@login_required
def get_meal_history():
    meals = MealLog.query.filter_by(user_id=current_user.id).order_by(MealLog.timestamp.desc()).all()
    meal_list = [{
        'meal_text': meal.meal_text,
        'calories': meal.calories,
        'effect': meal.effect,
        'insulin_suggestion': meal.insulin_suggestion,
        'timestamp': meal.timestamp.isoformat()
    } for meal in meals]
    return jsonify({"meals": meal_list})

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

@app.route('/analyze-meal', methods=['POST'])
@login_required
def analyze_meal():
    data = request.get_json()
    meal_text = data.get('meal', '')
    
    analysis_prompt = f"""Analyze this meal: "{meal_text}"
    Please provide the analysis in the following JSON format exactly:
    {{
        "calories": "estimated calories here",
        "effect": "blood sugar effect (low/medium/high)",
        "insulin_suggestion": "insulin adjustment suggestion"
    }}"""
    
    try:
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides meal analysis in JSON format. Always respond with valid JSON."},
                {"role": "user", "content": analysis_prompt}
            ]
        )
        
        ai_response = completion.choices[0].message.content
        # Try to parse the JSON response
        import json
        try:
            parsed_response = json.loads(ai_response)
        except json.JSONDecodeError:
            # If JSON parsing fails, create a structured response from the text
            parsed_response = {
                "calories": "Unable to parse",
                "effect": "Unable to parse",
                "insulin_suggestion": ai_response
            }
        
        # Create a new meal log entry
        meal_log = MealLog(
            meal_text=meal_text,
            user_id=current_user.id,
            calories=str(parsed_response.get('calories', 'N/A')),
            effect=str(parsed_response.get('effect', 'N/A')),
            insulin_suggestion=str(parsed_response.get('insulin_suggestion', 'N/A'))
        )
        db.session.add(meal_log)
        db.session.commit()
        
        return jsonify({"analysis": parsed_response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
@login_required
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    completion = client.chat.completions.create(
        extra_headers={
            "HTTP-Referer": "http://localhost:5000",  
            "X-Title": "Insulin Tracker",             
        },
        extra_body={},
        model="deepseek/deepseek-chat-v3.1:free",
        messages=[
            {"role": "user", "content": user_message}
        ]
    )
    bot_reply = completion.choices[0].message.content
    return jsonify({"reply": bot_reply})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
