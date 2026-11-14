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
import re
import pathlib
from datetime import datetime, timezone

def clean_ai_output(text):
    """Clean AI output by removing artifacts and unwanted tokens"""
    if not text:
        return text
    
    # Remove common AI artifacts and tokens
    artifacts = [
        r'<\|redacted_begin_of_sentence\|>',
        r'<\|redacted_end_of_sentence\|>',
        r'<\|endoftext\|>',
        r'<\|startoftext\|>',
        r'<\|pad\|>',
        r'<\|unk\|>',
        r'\.<\|redacted_begin_of_sentence\|>',
        r'\.<\|redacted_end_of_sentence\|>',
        r'\.<\|endoftext\|>',
        r'\.<\|startoftext\|>',
        r'\.<\|pad\|>',
        r'\.<\|unk\|>',
        r'<｜begin▁of▁sentence｜>',
        r'<｜end▁of▁sentence｜>',
        r'<｜begin_of_text｜>',
        r'<｜end_of_text｜>',
    ]
    
    for artifact in artifacts:
        text = re.sub(artifact, '', text, flags=re.IGNORECASE)
    
    # Clean up any double periods or trailing periods
    text = re.sub(r'\.\.+', '.', text)
    text = re.sub(r'\.\s*$', '.', text)
    
    # Remove any remaining artifacts that might look like tokens (including unicode variants)
    text = re.sub(r'<\|[^>]*\|>', '', text)
    text = re.sub(r'<｜[^｜]*｜>', '', text)
    
    return text.strip()

try:
    load_dotenv()
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")

# Get the absolute path to this script's directory
SCRIPT_DIR = pathlib.Path(__file__).parent.absolute()
# Vercel can only write to /tmp. Local runs keep the database beside the app.
if os.environ.get("VERCEL"):
    INSTANCE_DIR = pathlib.Path("/tmp/insulin-tracker")
else:
    INSTANCE_DIR = SCRIPT_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)

# Set the API key (either from .env or as fallback)
if not os.getenv('OPENAI_API_KEY'):
    os.environ['OPENAI_API_KEY'] = 'API_KEY_HERE'

# Initialize OpenAI client with the API key
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)


app = Flask(__name__, static_folder=str(SCRIPT_DIR), static_url_path='')

# Require SECRET_KEY from environment - generate with: python -c "import secrets; print(secrets.token_hex(32))"
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    raise ValueError("SECRET_KEY environment variable must be set. Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\"")
app.config['SECRET_KEY'] = secret_key

# Configure database



if os.environ.get('DATABASE_URL'):
    # Use PostgreSQL on Heroku
    db_url = os.environ.get('DATABASE_URL')
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
else:
    # Use SQLite locally
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{INSTANCE_DIR / "users.db"}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['LOAD_DOTENV'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Ensure database tables are created
with app.app_context():
    db.create_all()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    height = db.Column(db.Float)  # cm
    weight = db.Column(db.Float)  # kg
    age = db.Column(db.Integer)
    sex = db.Column(db.String(10))  # 'male'/'female'
    activity_level = db.Column(db.String(20))  # 'sedentary'/'light'/'moderate'/'active'/'very_active'
    carb_ratio = db.Column(db.Float)  # grams per unit
    daily_calorie_target = db.Column(db.Integer)
    tdd = db.Column(db.Float)  # Total Daily Dose
    diabetes_type = db.Column(db.String(10))  # 'type1' or 'type2'
    meal_logs = db.relationship('MealLog', backref='user', lazy=True)
    insulin_logs = db.relationship('InsulinLog', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class MealLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meal_text = db.Column(db.String(500), nullable=False)
    calories = db.Column(db.String(50))
    carbs = db.Column(db.String(50))
    fiber = db.Column(db.String(50))
    sugar = db.Column(db.String(50))
    effect = db.Column(db.String(50))
    insulin_suggestion = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class InsulinLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    units_taken = db.Column(db.Float, nullable=False)
    insulin_type = db.Column(db.String(20), nullable=False)  # 'basal'/'bolus'
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
        print(f"Login successful for user: {username}")
        return jsonify({"message": "Logged in successfully"})
    
    print(f"Login failed for username: {username}, user exists: {user is not None}")
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
        'id': meal.id,
        'meal_text': meal.meal_text,
        'calories': meal.calories,
        'carbs': meal.carbs,
        'fiber': meal.fiber,
        'sugar': meal.sugar,
        'effect': meal.effect,
        'insulin_suggestion': meal.insulin_suggestion,
        'timestamp': meal.timestamp.isoformat()
    } for meal in meals]
    return jsonify({"meals": meal_list})

@app.route('/delete-meal/<int:meal_id>', methods=['DELETE'])
@login_required
def delete_meal(meal_id):
    meal = MealLog.query.filter_by(id=meal_id, user_id=current_user.id).first()
    if not meal:
        return jsonify({'error': 'Meal not found'}), 404
    
    db.session.delete(meal)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/')
def serve_index():
    return send_from_directory(str(SCRIPT_DIR), 'index.html')

@app.route('/login')
def serve_login():
    return send_from_directory(str(SCRIPT_DIR), 'login.html')

@app.route('/analyze-meal', methods=['POST'])
@login_required
def analyze_meal():
    data = request.get_json()
    meal_text = data.get('meal', '')
    
    analysis_prompt = f"""Analyze this meal: "{meal_text}"
    Please provide the analysis in the following JSON format exactly:
    {{
        "calories": 350,
        "carbs": 45,
        "fiber": 8,
        "sugar": 12,
        "effect": "medium",
        "insulin_suggestion": "Consider a moderate insulin adjustment based on carb content."
    }}
    
    Instructions:
    - Return ONLY NUMERIC VALUES for calories, carbs, fiber, and sugar (no quotes, no text)
    - Estimate realistic nutrition values based on typical serving sizes
    - Use typical ranges: apple (80 cal, 20g carbs, 4g fiber, 15g sugar), sandwich (350 cal, 45g carbs, 3g fiber, 8g sugar)
    - Effect should be exactly "low", "medium", or "high"
    - Give practical insulin suggestions
    - Example: For "apple and yogurt" return calories: 150, carbs: 25, fiber: 3, sugar: 18"""
    
    try:
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a nutrition expert that provides accurate meal analysis in JSON format. Always respond with valid JSON containing actual calorie estimates, blood sugar impact assessment, and insulin recommendations."},
                {"role": "user", "content": analysis_prompt}
            ]
        )
        
        ai_response = completion.choices[0].message.content
        # Try to parse the JSON response
        import json
        try:
            parsed_response = json.loads(ai_response)
            # Ensure calories is a number, not text
            if isinstance(parsed_response.get('calories'), str):
                # Try to extract number from string
                import re
                calorie_match = re.search(r'\d+', parsed_response.get('calories', ''))
                if calorie_match:
                    parsed_response['calories'] = calorie_match.group()
                else:
                    parsed_response['calories'] = "300"  # Default estimate
        except json.JSONDecodeError:
            # If JSON parsing fails, create a structured response from the text
            import re
            calorie_match = re.search(r'\d+', ai_response)
            default_calories = calorie_match.group() if calorie_match else "300"
            
            parsed_response = {
                "calories": default_calories,
                "effect": "medium",
                "insulin_suggestion": ai_response
            }
        
        # Create a new meal log entry
        # Extract numeric values safely
        calories = parsed_response.get('calories', 0)
        carbs = parsed_response.get('carbs', 0)
        fiber = parsed_response.get('fiber', 0)
        sugar = parsed_response.get('sugar', 0)
        
        # Convert to numbers if they're strings
        try:
            calories = float(calories) if calories != 'N/A' else 0
            carbs = float(carbs) if carbs != 'N/A' else 0
            fiber = float(fiber) if fiber != 'N/A' else 0
            sugar = float(sugar) if sugar != 'N/A' else 0
        except (ValueError, TypeError):
            calories = carbs = fiber = sugar = 0
        
        meal_log = MealLog(
            meal_text=meal_text,
            user_id=current_user.id,
            calories=str(calories),
            carbs=str(carbs),
            fiber=str(fiber),
            sugar=str(sugar),
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
    
    try:
        completion = client.chat.completions.create(
            model="deepseek/deepseek-chat-v3.1:free",
            messages=[
                {"role": "system", "content": "You are a helpful assistant for diabetes management and insulin tracking. Provide helpful, accurate information about diabetes, insulin, blood sugar management, and nutrition."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        reply = completion.choices[0].message.content
        # Clean up AI artifacts and unwanted tokens
        reply = clean_ai_output(reply)
        return jsonify({"reply": reply})
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"reply": f"Sorry, I'm having trouble connecting right now. Error: {str(e)}"}), 500

@app.route('/get-profile', methods=['GET'])
@login_required
def get_profile():
    return jsonify({
        'height': current_user.height,
        'weight': current_user.weight,
        'age': current_user.age,
        'sex': current_user.sex,
        'activity_level': current_user.activity_level,
        'daily_calorie_target': current_user.daily_calorie_target,
        'carb_ratio': current_user.carb_ratio,
        'tdd': current_user.tdd,
        'diabetes_type': current_user.diabetes_type
    })

@app.route('/update-profile', methods=['POST'])
@login_required
def update_profile():
    data = request.get_json()
    
    try:
        current_user.height = data.get('height')
        current_user.weight = data.get('weight')
        current_user.age = data.get('age')
        current_user.sex = data.get('sex')
        current_user.activity_level = data.get('activity_level')
        current_user.diabetes_type = data.get('diabetes_type')
        
        # Auto-calculate TDD based on weight (weight in kg / 2)
        if current_user.weight:
            current_user.tdd = current_user.weight / 2
        
        db.session.commit()
        return jsonify({"message": "Profile updated successfully", "tdd": current_user.tdd})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/calculate-daily-needs', methods=['POST'])
@login_required
def calculate_daily_needs():
    try:
        user = current_user
        
        # Basic calculations
        weight = user.weight or 70  # Default weight if not set
        height = user.height or 170  # Default height if not set
        age = user.age or 30  # Default age if not set
        sex = user.sex or 'male'
        activity_level = user.activity_level or 'moderate'
        
        # Mifflin-St Jeor BMR calculation
        if sex.lower() == 'male':
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        
        # Activity multipliers
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        }
        
        multiplier = activity_multipliers.get(activity_level, 1.55)
        daily_calories = int(bmr * multiplier)
        
        # Insulin calculations
        tdd = weight * 0.5  # Total Daily Dose
        carb_ratio = 500 / tdd if tdd > 0 else 15  # grams per unit
        
        # Update user profile with calculated values
        user.daily_calorie_target = daily_calories
        user.carb_ratio = carb_ratio
        user.tdd = tdd
        db.session.commit()
        
        # Use AI to validate and provide recommendations
        try:
            ai_prompt = f"""Given these health metrics:
- Height: {height} cm
- Weight: {weight} kg  
- Age: {age} years
- Sex: {sex}
- Activity Level: {activity_level}

I calculated:
- BMR: {bmr:.0f} calories
- Daily Calorie Target: {daily_calories} calories
- Total Daily Dose (TDD): {tdd:.1f} units
- Carb-to-Insulin Ratio: {carb_ratio:.1f} grams per unit

Please validate these calculations and provide personalized recommendations for diabetes management. Keep response concise (under 200 words)."""

            completion = client.chat.completions.create(
                model="deepseek/deepseek-chat-v3.1:free",
                messages=[
                    {"role": "system", "content": "You are a diabetes management expert. Validate calculations and provide personalized recommendations."},
                    {"role": "user", "content": ai_prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            ai_recommendations = completion.choices[0].message.content
            # Clean up AI artifacts and unwanted tokens
            ai_recommendations = clean_ai_output(ai_recommendations)
        except Exception as e:
            ai_recommendations = f"Calculations completed. Please consult your healthcare provider for personalized recommendations."
        
        return jsonify({
            "daily_calories": daily_calories,
            "tdd": round(tdd, 1),
            "carb_ratio": round(carb_ratio, 1),
            "ai_recommendations": ai_recommendations
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/log-insulin', methods=['POST'])
@login_required
def log_insulin():
    data = request.get_json()
    
    try:
        # Create timestamp in UTC
        timestamp = datetime.now(timezone.utc)
        
        insulin_log = InsulinLog(
            units_taken=data.get('units_taken'),
            insulin_type=data.get('insulin_type'),
            user_id=current_user.id,
            timestamp=timestamp
        )
        
        db.session.add(insulin_log)
        db.session.commit()
        
        return jsonify({"message": "Insulin logged successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-insulin-history', methods=['GET'])
@login_required
def get_insulin_history():
    from datetime import datetime, timedelta
    
    try:
        date_str = request.args.get('date')
        if date_str:
            # Parse the date string and create start/end of day in UTC
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            # Create datetime range for the day in UTC
            start_of_day = datetime.combine(target_date, datetime.min.time().replace(tzinfo=timezone.utc))
            end_of_day = start_of_day + timedelta(days=1)
        else:
            # Use today in UTC
            target_date = datetime.now(timezone.utc).date()
            start_of_day = datetime.combine(target_date, datetime.min.time().replace(tzinfo=timezone.utc))
            end_of_day = start_of_day + timedelta(days=1)
        
        # Get insulin logs for the specified date
        insulin_logs = InsulinLog.query.filter(
            InsulinLog.user_id == current_user.id,
            InsulinLog.timestamp >= start_of_day,
            InsulinLog.timestamp < end_of_day
        ).order_by(InsulinLog.timestamp.desc()).all()
        
        logs_list = [{
            'id': log.id,
            'units_taken': log.units_taken,
            'insulin_type': log.insulin_type,
            'timestamp': log.timestamp.isoformat()
        } for log in insulin_logs]
        
        # Calculate total units for the day
        total_units = sum(log.units_taken for log in insulin_logs)
        
        return jsonify({
            "logs": logs_list,
            "total_units": total_units
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/daily-analytics', methods=['GET'])
@login_required
def daily_analytics():
    try:
        from datetime import datetime, date
        
        # Get today's date in UTC
        today = datetime.now(timezone.utc).date()
        
        # Get today's meals (considering UTC)
        start_of_day = datetime.combine(today, datetime.min.time().replace(tzinfo=timezone.utc))
        end_of_day = start_of_day + timedelta(days=1)
        
        today_meals = MealLog.query.filter(
            MealLog.user_id == current_user.id,
            MealLog.timestamp >= start_of_day,
            MealLog.timestamp < end_of_day
        ).all()
        
        # Calculate totals from meals
        total_calories = 0
        total_carbs = 0
        total_insulin_recommended = 0
        
        for meal in today_meals:
            try:
                # Parse calories - handle various formats
                if meal.calories:
                    calories_str = str(meal.calories).replace(' calories', '').replace(',', '').strip()
                    total_calories += float(calories_str)
                
                # Parse carbs - handle various formats and ensure proper extraction
                if meal.carbs:
                    carbs_str = str(meal.carbs).replace('g', '').replace(',', '').strip()
                    # Extract numeric value from string (handle cases like "45g" or "45")
                    import re
                    carbs_match = re.search(r'(\d+\.?\d*)', carbs_str)
                    if carbs_match:
                        total_carbs += float(carbs_match.group(1))
                
                # Parse insulin suggestion
                if meal.insulin_suggestion:
                    # Extract insulin units from suggestion text
                    import re
                    insulin_match = re.search(r'(\d+\.?\d*)\s*units?', meal.insulin_suggestion.lower())
                    if insulin_match:
                        total_insulin_recommended += float(insulin_match.group(1))
            except (ValueError, AttributeError, TypeError) as e:
                print(f"Error parsing meal data: {e}, meal.carbs: {meal.carbs}, meal.calories: {meal.calories}")
                continue
        
        # Get today's insulin logs (considering UTC)
        today_insulin_logs = InsulinLog.query.filter(
            InsulinLog.user_id == current_user.id,
            InsulinLog.timestamp >= start_of_day,
            InsulinLog.timestamp < end_of_day
        ).all()
        
        total_insulin_taken = sum(log.units_taken for log in today_insulin_logs)
        
        # Get user targets
        calorie_target = current_user.daily_calorie_target or 2000
        
        # Calculate carb target based on user's carb ratio if available, otherwise use 50% of calories
        if current_user.carb_ratio and current_user.carb_ratio > 0:
            # If user has a carb ratio, calculate target based on their insulin needs
            insulin_target = current_user.tdd or (current_user.weight * 0.5 if current_user.weight else 35)
            carb_target = insulin_target * current_user.carb_ratio
        else:
            # Fallback to 50% of calories as carbs (4 cal/g)
            carb_target = (calorie_target * 0.5) / 4
            
        insulin_target = current_user.tdd or (current_user.weight * 0.5 if current_user.weight else 35)
        
        # Calculate remaining needs
        calories_remaining = max(0, calorie_target - total_calories)
        carbs_remaining = max(0, carb_target - total_carbs)
        insulin_remaining = max(0, insulin_target - total_insulin_taken)
        
        # Use AI to analyze progress
        try:
            ai_prompt = f"""Today's diabetes management summary:
- Calories: {total_calories:.0f}/{calorie_target} ({total_calories/calorie_target*100:.1f}% of target)
- Carbs: {total_carbs:.0f}g/{carb_target:.0f}g ({total_carbs/carb_target*100:.1f}% of target)
- Insulin: {total_insulin_taken:.1f}/{insulin_target:.1f} units ({total_insulin_taken/insulin_target*100:.1f}% of target)

Provide brief insights on progress and recommendations. Keep under 150 words."""

            completion = client.chat.completions.create(
                model="deepseek/deepseek-chat-v3.1:free",
                messages=[
                    {"role": "system", "content": "You are a diabetes management expert. Analyze daily progress and provide brief insights."},
                    {"role": "user", "content": ai_prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            ai_insights = completion.choices[0].message.content
            
            # Clean up AI artifacts and unwanted tokens
            ai_insights = clean_ai_output(ai_insights)
        except Exception as e:
            ai_insights = "Track your progress daily and consult your healthcare provider for personalized guidance."
        
        return jsonify({
            "calories": {
                "consumed": total_calories,
                "target": calorie_target,
                "remaining": calories_remaining
            },
            "carbs": {
                "consumed": total_carbs,
                "target": carb_target,
                "remaining": carbs_remaining
            },
            "insulin": {
                "recommended": total_insulin_recommended,
                "taken": total_insulin_taken,
                "target": insulin_target,
                "remaining": insulin_remaining
            },
            "ai_insights": ai_insights
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Add missing columns if they don't exist
        try:
            # Check if carbs column exists in meal_log
            with db.engine.connect() as conn:
                result = conn.execute(db.text("PRAGMA table_info(meal_log)"))
                columns = [row[1] for row in result]
                
                if 'carbs' not in columns:
                    conn.execute(db.text("ALTER TABLE meal_log ADD COLUMN carbs VARCHAR(50)"))
                    conn.commit()
                    print("Added carbs column")
                
                if 'fiber' not in columns:
                    conn.execute(db.text("ALTER TABLE meal_log ADD COLUMN fiber VARCHAR(50)"))
                    conn.commit()
                    print("Added fiber column")
                    
                if 'sugar' not in columns:
                    conn.execute(db.text("ALTER TABLE meal_log ADD COLUMN sugar VARCHAR(50)"))
                    conn.commit()
                    print("Added sugar column")
            
            # Check if diabetes_type column exists in user table
            with db.engine.connect() as conn:
                result = conn.execute(db.text("PRAGMA table_info(user)"))
                columns = [row[1] for row in result]
                
                if 'diabetes_type' not in columns:
                    conn.execute(db.text("ALTER TABLE user ADD COLUMN diabetes_type VARCHAR(10)"))
                    conn.commit()
                    print("Added diabetes_type column")
                    
        except Exception as e:
            print(f"Database migration error: {e}")
    
    # Use Heroku's PORT environment variable if it exists, otherwise default to 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
