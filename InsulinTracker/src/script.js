// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupAuthListeners();
    initNavigation(); // Add navigation initialization
    initializeCalendar();
    initializeFoodLogNavigation();
    initializeDashboard();
});

async function checkAuthStatus() {
    // Show login form by default
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
}

function setupAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('main-sidebar').style.display = 'flex';
            document.getElementById('app-content').style.display = 'block';
            navigateToPage('home'); // Load home by default
            loadMealHistory();
            loadUserProfile(); // Load user profile data
        } else {
            document.getElementById('login-error').textContent = data.error || 'Login failed';
        }
    } catch (error) {
        document.getElementById('login-error').textContent = 'An error occurred. Please try again.';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        document.getElementById('register-error').textContent = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAuthForm('login');
            document.getElementById('register-error').textContent = '';
            document.getElementById('login-error').textContent = 'Registration successful! Please login.';
        } else {
            document.getElementById('register-error').textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        document.getElementById('register-error').textContent = 'An error occurred. Please try again.';
    }
}

function showAuthForm(formType) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.querySelector('.auth-tab:first-child');
    const registerTab = document.querySelector('.auth-tab:last-child');

    if (formType === 'login') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }
}

// Add event listeners for forms
async function logout() {
    try {
        const response = await fetch('/logout');
        if (response.ok) {
            document.getElementById('auth-container').style.display = 'flex';
            document.getElementById('main-content').style.display = 'none';
        }
    } catch (error) {
        alert('Error logging out. Please try again.');
    }
}

function calculateInsulinNeeded(){
  const bodyWeight = document.getElementById("bodyWeight").value;
  const insulinNeeded = bodyWeight * 0.5;
  document.getElementById('insulinNeeded').textContent = `Insulin Needed: ${insulinNeeded} units`;
}
function calculateCarbRatio(){
  const bodyWeight = document.getElementById("bodyWeight").value;
  const carbRatio = (450 / bodyWeight).toFixed(2);
  document.getElementById('carbRatio').textContent = `Carb Ratio: 1 unit per ${carbRatio} grams of carbs`;
}
async function sendMessage(inputId, messagesId) {
  const input = document.getElementById(inputId);
  const messages = document.getElementById(messagesId);
  const userMsg = input.value.trim();
  if (userMsg) {
    messages.innerHTML += `<div><b>You:</b> ${userMsg}</div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    // Send message to backend
    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      messages.innerHTML += `<div><b>Bot:</b> ${data.reply}</div>`;
      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      messages.innerHTML += `<div><b>Bot:</b> Sorry, there was an error connecting to the server.</div>`;
      messages.scrollTop = messages.scrollHeight;
    }
  }
}

function sendMainMessage() {
  sendMessage('main-chatbot-input', 'main-chatbot-messages');
}

function sendCornerMessage() {
  sendMessage('corner-chatbot-input', 'chatbot-messages');
}

function toggleCornerChat() {
  const chatbox = document.getElementById('chatbot-box');
  chatbox.classList.toggle('show');
  const button = document.getElementById('toggle-chat');
  if (chatbox.classList.contains('show')) {
    button.textContent = 'Hide Corner Chat';
  } else {
    button.textContent = 'Show Corner Chat';
  }
}

function clearChat(messagesId) {
  const messages = document.getElementById(messagesId);
  messages.innerHTML = '';
}

async function loadMealHistory() {
    try {
        const response = await fetch('/meal-history');
        if (response.ok) {
            const data = await response.json();
            mealHistory = data.meals;
            
            // Update food log display
            const foodLog = document.getElementById('foodLog');
            if (foodLog) {
                foodLog.innerHTML = '';
                
                data.meals.forEach(meal => {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'food-entry';
                    const date = new Date(meal.timestamp);
                    const timeStr = date.toLocaleString();
                    
                    entryDiv.innerHTML = `
                        <span class="time">${timeStr}</span>
                        <span class="description">${meal.meal_text}</span>
                        <span class="calories">${meal.calories} cal</span>
                        <span class="effect">Effect: ${meal.effect}</span>
                        <button class="insulin-toggle" onclick="toggleInsulinSuggestion(this)">💉</button>
                        <button class="delete-btn" onclick="deleteMealEntry(this, ${meal.id})" title="Delete meal">🗑️</button>
                        <div class="insulin-suggestion">${meal.insulin_suggestion}</div>
                    `;
                    
                    foodLog.appendChild(entryDiv);
                });
            }
            
            // Render calendar with updated data
            renderCalendar();
            
            // Update food log display
            updateFoodLogDisplay();
            
            // Update dashboard with new data
            updateDashboard();
            
            // Generate new AI tips
            generateAITips();
        }
    } catch (error) {
        console.error('Error loading meal history:', error);
    }
}

// Food Log Navigation
let currentFoodLogDate = new Date();

function initializeFoodLogNavigation() {
    const prevBtn = document.getElementById('prev-day-btn');
    const nextBtn = document.getElementById('next-day-btn');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentFoodLogDate.setDate(currentFoodLogDate.getDate() - 1);
            updateFoodLogDisplay();
        });
        
        nextBtn.addEventListener('click', () => {
            currentFoodLogDate.setDate(currentFoodLogDate.getDate() + 1);
            updateFoodLogDisplay();
        });
    }
}

function updateFoodLogDisplay() {
    const foodLogTitle = document.getElementById('food-log-title');
    const foodLog = document.getElementById('foodLog');
    
    if (!foodLogTitle || !foodLog) return;
    
    const today = new Date();
    const isToday = currentFoodLogDate.toDateString() === today.toDateString();
    
    if (isToday) {
        foodLogTitle.textContent = "Today's Food Log";
    } else {
        foodLogTitle.textContent = `Food Log - ${currentFoodLogDate.toLocaleDateString()}`;
    }
    
    // Filter meals for the selected date
    const dateStr = currentFoodLogDate.toISOString().split('T')[0];
    const dayMeals = mealHistory.filter(meal => 
        meal.timestamp.split('T')[0] === dateStr
    );
    
    foodLog.innerHTML = '';
    
    if (dayMeals.length === 0) {
        foodLog.innerHTML = '<p>No meals logged for this day.</p>';
    } else {
        dayMeals.forEach(meal => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'food-entry';
            const mealDate = new Date(meal.timestamp);
            entryDiv.innerHTML = `
                <span class="time">${mealDate.toLocaleTimeString()}</span>
                <span class="description">${meal.meal_text}</span>
                <span class="calories">${meal.calories} cal</span>
                <span class="effect">Effect: ${meal.effect}</span>
                <button class="insulin-toggle" onclick="toggleInsulinSuggestion(this)">💉</button>
                <button class="delete-btn" onclick="deleteMealEntry(this, ${meal.id})" title="Delete meal">🗑️</button>
                <div class="insulin-suggestion">${meal.insulin_suggestion}</div>
            `;
            foodLog.appendChild(entryDiv);
        });
    }
    
    // Update dashboard
    updateDashboard();
}

// Dashboard functionality
function initializeDashboard() {
    updateDashboard();
}

function updateDashboard() {
    const dateStr = currentFoodLogDate.toISOString().split('T')[0];
    const dayMeals = mealHistory.filter(meal => 
        meal.timestamp.split('T')[0] === dateStr
    );
    
    // Calculate nutrition totals
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let bloodSugarScore = 0;
    
    dayMeals.forEach(meal => {
        // Extract nutrition values from AI analysis - handle both string and number values
        const calories = parseFloat(meal.calories) || 0;
        const carbs = parseFloat(meal.carbs) || 0;
        const fiber = parseFloat(meal.fiber) || 0;
        const sugar = parseFloat(meal.sugar) || 0;
        
        totalCalories += calories;
        totalCarbs += carbs;
        totalFiber += fiber;
        totalSugar += sugar;
        
        // Calculate blood sugar score based on effect
        if (meal.effect.toLowerCase().includes('high')) {
            bloodSugarScore += 3;
        } else if (meal.effect.toLowerCase().includes('medium')) {
            bloodSugarScore += 2;
        } else {
            bloodSugarScore += 1;
        }
    });
    
    // Update nutrition display with proper formatting (reverted to original format)
    document.getElementById('total-calories').textContent = Math.round(totalCalories);
    document.getElementById('total-carbs').textContent = `${Math.round(totalCarbs)}g`;
    document.getElementById('total-fiber').textContent = `${Math.round(totalFiber)}g`;
    document.getElementById('total-sugar').textContent = `${Math.round(totalSugar)}g`;
    
    // Update analytics dashboard carb intake to match nutrition totals
    updateAnalyticsCarbIntake(totalCarbs);
    
    // Update blood sugar rating
    updateBloodSugarRating(bloodSugarScore);
    
    // Update alerts
    updateAlerts(totalCalories, totalCarbs, totalSugar);
}

function updateAnalyticsCarbIntake(totalCarbs) {
    // Update the carb intake display in analytics dashboard to match nutrition totals
    const carbsCenterText = document.getElementById('carbsCenterText');
    if (carbsCenterText) {
        // Get the target from the existing display or use default
        const currentText = carbsCenterText.textContent;
        const targetMatch = currentText.match(/\/(\d+)g?$/);
        const target = targetMatch ? targetMatch[1] : '250';
        
        // Update with the same carb total as nutrition totals
        carbsCenterText.textContent = `${Math.round(totalCarbs)}/${target}g`;
        
        // Update the chart if it exists
        if (carbsChart) {
            createPieChart('carbsChart', 'carbsCenterText', totalCarbs, parseInt(target), 'g');
        }
    }
}

function updateBloodSugarRating(score) {
    const ratingCircle = document.getElementById('blood-sugar-rating');
    const ratingText = document.getElementById('rating-text');
    const explanation = document.getElementById('blood-sugar-explanation');
    
    if (score <= 3) {
        ratingCircle.className = 'rating-circle low';
        ratingText.textContent = 'Low';
        explanation.textContent = 'Minimal impact on blood sugar';
    } else if (score <= 6) {
        ratingCircle.className = 'rating-circle medium';
        ratingText.textContent = 'Medium';
        explanation.textContent = 'Moderate impact on blood sugar';
    } else {
        ratingCircle.className = 'rating-circle high';
        ratingText.textContent = 'High';
        explanation.textContent = 'Significant impact on blood sugar';
    }
}

function updateAlerts(calories, carbs, sugar) {
    const alertsContainer = document.getElementById('alerts-container');
    const alerts = [];
    
    // Calorie alerts
    if (calories > 2500) {
        alerts.push({ type: 'warning', message: 'High calorie intake today' });
    } else if (calories < 1200) {
        alerts.push({ type: 'warning', message: 'Low calorie intake - consider eating more' });
    }
    
    // Carb alerts
    if (carbs > 300) {
        alerts.push({ type: 'danger', message: 'Very high carb intake - monitor blood sugar closely' });
    } else if (carbs > 200) {
        alerts.push({ type: 'warning', message: 'High carb intake today' });
    }
    
    // Sugar alerts
    if (sugar > 50) {
        alerts.push({ type: 'danger', message: 'High sugar intake - check blood sugar levels' });
    } else if (sugar > 30) {
        alerts.push({ type: 'warning', message: 'Moderate sugar intake' });
    }
    
    // Display alerts
    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<p class="no-alerts">No alerts for today</p>';
    } else {
        alertsContainer.innerHTML = '';
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert-item ${alert.type}`;
            alertDiv.textContent = alert.message;
            alertsContainer.appendChild(alertDiv);
        });
    }
}

async function addToFoodLog() {
    if (!currentAnalysis) return;

    const mealInput = document.getElementById('mealInput');
    const mealText = mealInput.value.trim();
    
    if (!mealText) {
        alert('Please enter meal details first');
        return;
    }

    try {
        // Save meal to backend database
        const response = await fetch('/analyze-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meal: mealText })
        });

        const data = await response.json();
        
        if (data.error) {
            alert('Error saving meal: ' + data.error);
            return;
        }

        // Clear the meal input
        mealInput.value = '';
        
        // Hide the meal results
        document.getElementById('mealResults').style.display = 'none';
        
        // Disable the add to log button
        document.getElementById('addToLogBtn').disabled = true;
        
        // Clear current analysis
        currentAnalysis = null;
        
        // Reload the food log to show the new entry
        loadMealHistory();
        
        // Update dashboard with new totals
        updateDashboard();
        
        alert('Meal added to food log successfully!');
        
    } catch (error) {
        alert('Error saving meal: ' + error.message);
        console.error('Error:', error);
    }
}

let lastReading = null;

let currentAnalysis = null;

async function analyzeMeal() {
    const mealInput = document.getElementById('mealInput');
    const resultsDiv = document.getElementById('mealResults');
    const addToLogBtn = document.getElementById('addToLogBtn');
    const meal = mealInput.value.trim();

    if (!meal) {
        alert('Please enter your meal details');
        return;
    }

    try {
        const response = await fetch('/analyze-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meal: meal })
        });

        const data = await response.json();
        
        if (data.error) {
            alert('Error analyzing meal: ' + data.error);
            return;
        }

        const analysis = data.analysis;
        currentAnalysis = analysis;

        resultsDiv.style.display = 'block';
        document.getElementById('caloriesResult').textContent = analysis.calories;
        document.getElementById('insulinEffect').textContent = analysis.effect;
        document.getElementById('lastReading').textContent = lastReading || 'No previous reading';
        document.getElementById('insulinSuggestion').textContent = analysis.insulin_suggestion;
        
        addToLogBtn.disabled = false;
    } catch (error) {
        alert('Error analyzing meal: ' + error.message);
        console.error('Error:', error);
    }
}

// Calendar functionality
let currentDate = new Date();
let selectedDate = null;
let mealHistory = [];

function initializeCalendar() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Render calendar immediately on page load
    renderCalendar();
}

function renderCalendar() {
    const monthYearElement = document.getElementById('current-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    
    if (!monthYearElement || !calendarGrid) return;
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthYearElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'calendar-day-header';
        headerDiv.textContent = day;
        calendarGrid.appendChild(headerDiv);
    });
    
    // Add calendar days
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.className = 'day-number';
        dayNumberSpan.textContent = current.getDate();
        dayDiv.appendChild(dayNumberSpan);
        
        const dateStr = current.toISOString().split('T')[0];
        
        // Check if this day has meals AND if it's today
        const today = new Date().toISOString().split('T')[0];
        const hasMeals = mealHistory.some(meal => 
            meal.timestamp.split('T')[0] === dateStr
        );
        
        // Only add green highlight if it has meals AND it's today
        if (hasMeals && dateStr === today) {
            dayDiv.classList.add('has-meals');
        }
        
        if (current.getMonth() !== currentDate.getMonth()) {
            dayDiv.classList.add('other-month');
        }
        
        if (selectedDate && current.toDateString() === selectedDate.toDateString()) {
            dayDiv.classList.add('selected');
        }
        
        // Remove the old click handler - we'll use our new navigation system
        
        calendarGrid.appendChild(dayDiv);
        current.setDate(current.getDate() + 1);
    }
}

function showDayMeals(date) {
    const dateTitle = document.getElementById('selected-date-title');
    const mealsList = document.getElementById('day-meals-list');
    
    if (!dateTitle || !mealsList) return;
    
    // Update food log to show this date
    currentFoodLogDate = new Date(date);
    updateFoodLogDisplay();
    
    // Scroll to food log section
    const foodLogSection = document.querySelector('.food-log-section');
    if (foodLogSection) {
        foodLogSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const dayMeals = mealHistory.filter(meal => 
        meal.timestamp.split('T')[0] === dateStr
    );
    
    dateTitle.textContent = `Meals for ${date.toLocaleDateString()}`;
    
    if (dayMeals.length === 0) {
        mealsList.innerHTML = '<p>No meals logged for this day.</p>';
    } else {
        mealsList.innerHTML = '';
        dayMeals.forEach(meal => {
            const mealDiv = document.createElement('div');
            mealDiv.className = 'meal-item';
            const mealDate = new Date(meal.timestamp);
            mealDiv.innerHTML = `
                <strong>${mealDate.toLocaleTimeString()}</strong><br>
                <strong>Meal:</strong> ${meal.meal_text}<br>
                <strong>Calories:</strong> ${meal.calories}<br>
                <strong>Effect:</strong> ${meal.effect}<br>
                <strong>Suggestion:</strong> ${meal.insulin_suggestion}
            `;
            mealsList.appendChild(mealDiv);
        });
    }
}

// AI Tips functionality
function initializeAITips() {
    const toggleBtn = document.getElementById('toggle-tips-btn');
    const closeBtn = document.getElementById('close-tips');
    const refreshBtn = document.getElementById('refresh-tips');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const bubble = document.getElementById('ai-tips-bubble');
            bubble.style.display = bubble.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('ai-tips-bubble').style.display = 'none';
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', generateAITips);
    }
    
    // Generate initial tips
    setTimeout(generateAITips, 2000);
}

async function generateAITips() {
    const tipsContent = document.getElementById('tips-content');
    if (!tipsContent) return;
    
    tipsContent.innerHTML = '<p>Generating personalized meal suggestions...</p>';
    
    try {
        // Get recent meal history for context
        const recentMeals = mealHistory.slice(-5).map(meal => meal.meal_text).join(', ');
        
        const prompt = `Based on these recent meals: "${recentMeals}", provide 2-3 personalized meal suggestions for someone managing diabetes. Focus on balanced nutrition, blood sugar control, and practical tips. Keep each suggestion brief and actionable.`;
        
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt })
        });
        
        const data = await response.json();
        
        if (data.reply) {
            tipsContent.innerHTML = `<p>${data.reply}</p>`;
        } else {
            tipsContent.innerHTML = '<p>Here are some general tips: Focus on balanced meals with lean proteins, complex carbohydrates, and plenty of vegetables. Monitor your blood sugar regularly and stay hydrated.</p>';
        }
    } catch (error) {
        console.error('Error generating tips:', error);
        tipsContent.innerHTML = '<p>Here are some general tips: Focus on balanced meals with lean proteins, complex carbohydrates, and plenty of vegetables. Monitor your blood sugar regularly and stay hydrated.</p>';
    }
}

// Toggle insulin suggestion visibility
function toggleInsulinSuggestion(button) {
    const entry = button.closest('.food-entry');
    const suggestion = entry.querySelector('.insulin-suggestion');
    
    if (suggestion.classList.contains('show')) {
        suggestion.classList.remove('show');
        button.textContent = '💉';
    } else {
        suggestion.classList.add('show');
        button.textContent = '💉';
    }
}

// Delete meal entry
async function deleteMealEntry(button, mealId = null) {
    if (!confirm('Are you sure you want to delete this meal entry?')) {
        return;
    }
    
    const entry = button.closest('.food-entry');
    
    // If it's a new entry (not saved to database yet)
    if (!mealId) {
        entry.remove();
        return;
    }
    
    try {
        const response = await fetch(`/delete-meal/${mealId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
                if (response.ok) {
                    entry.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => {
                        entry.remove();
                        // Reload meal history and update dashboard and calendar
                        loadMealHistory();
                        updateDashboard();
                        renderCalendar();
                    }, 300);
                } else {
            const error = await response.json();
            alert('Error deleting meal: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        alert('Error deleting meal. Please try again.');
    }
}

// Add slideOut animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-100%);
        }
    }
`;
document.head.appendChild(style);

// ===== NEW PROFILE AND ANALYTICS FUNCTIONS =====

// Global variables for charts
let caloriesChart = null;
let insulinChart = null;
let carbsChart = null;

// Save user profile
async function saveUserProfile() {
    const height = document.getElementById('height').value;
    const weight = document.getElementById('bodyWeight').value;
    const age = document.getElementById('age').value;
    const sex = document.getElementById('sex').value;
    const activityLevel = document.getElementById('activityLevel').value;
    
    if (!height || !weight || !age || !sex || !activityLevel) {
        alert('Please fill in all profile fields');
        return;
    }
    
    try {
        const response = await fetch('/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                height: parseFloat(height),
                weight: parseFloat(weight),
                age: parseInt(age),
                sex: sex,
                activity_level: activityLevel
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Profile saved successfully!');
            document.getElementById('insulinLogging').style.display = 'block';
        } else {
            alert('Error saving profile: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
    }
}

// Calculate daily needs
async function calculateDailyNeeds() {
    try {
        const response = await fetch('/calculate-daily-needs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update display
            document.getElementById('dailyCalories').textContent = data.daily_calories;
            document.getElementById('tdd').textContent = data.tdd + ' units';
            document.getElementById('carbRatio').textContent = data.carb_ratio + 'g/unit';
            
            // Show AI recommendations
            document.getElementById('aiRecommendations').innerHTML = 
                '<h4>AI Recommendations:</h4><p>' + data.ai_recommendations + '</p>';
            
            // Show results section
            document.getElementById('calculationResults').style.display = 'block';
            
            // Load analytics
            loadDailyAnalytics();
        } else {
            alert('Error calculating needs: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error calculating needs:', error);
        alert('Error calculating needs. Please try again.');
    }
}

// Log insulin dose
async function logInsulin() {
    const units = document.getElementById('insulinUnits').value;
    const type = document.getElementById('insulinType').value;
    
    if (!units || units <= 0) {
        alert('Please enter a valid insulin amount');
        return;
    }
    
    if (!type) {
        alert('Please select insulin type');
        return;
    }
    
    try {
        const response = await fetch('/log-insulin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                units_taken: parseFloat(units),
                insulin_type: type
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Insulin logged successfully!');
            document.getElementById('insulinUnits').value = '';
            document.getElementById('insulinType').value = '';
            
            // Reload analytics (which includes insulin data)
            await loadDailyAnalytics();
            // Also reload insulin history for the log display
            await loadInsulinHistory();
        } else {
            alert('Error logging insulin: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error logging insulin:', error);
        alert('Error logging insulin. Please try again.');
    }
}

// Update insulin type dropdown based on diabetes type
function updateInsulinTypeOptions(diabetesType) {
    const insulinTypeSelect = document.getElementById('insulinType');
    if (!insulinTypeSelect) return;
    
    // Clear existing options except the first one
    insulinTypeSelect.innerHTML = '<option value="">Select Type...</option>';
    
    if (diabetesType === 'type1') {
        // Type 1: Show both basal and bolus
        insulinTypeSelect.innerHTML += '<option value="basal">Basal</option>';
        insulinTypeSelect.innerHTML += '<option value="bolus">Bolus</option>';
    } else if (diabetesType === 'type2') {
        // Type 2: Show only basal
        insulinTypeSelect.innerHTML += '<option value="basal">Basal</option>';
    } else {
        // Default: Show both
        insulinTypeSelect.innerHTML += '<option value="basal">Basal</option>';
        insulinTypeSelect.innerHTML += '<option value="bolus">Bolus</option>';
    }
}

// Load insulin history for current or specified date
async function loadInsulinHistory(dateStr) {
    try {
        const url = dateStr ? `/get-insulin-history?date=${dateStr}` : '/get-insulin-history';
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Insulin history response:', data);
        
        if (response.ok) {
            displayInsulinLog(data.logs);
            updateInsulinChart(data.total_units);
        }
    } catch (error) {
        console.error('Error loading insulin history:', error);
    }
}

// Display insulin log entries
function displayInsulinLog(logs) {
    const insulinLogDiv = document.getElementById('insulinLog');
    console.log('displayInsulinLog called with:', logs);
    console.log('insulinLogDiv element:', insulinLogDiv);
    
    if (!insulinLogDiv) {
        console.error('insulinLog element not found!');
        return;
    }
    
    if (!logs || logs.length === 0) {
        insulinLogDiv.innerHTML = '<p class="no-entries">No insulin doses logged for this day</p>';
        return;
    }
    
    const html = logs.map(log => {
        const timestamp = new Date(log.timestamp);
        const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const typeLabel = log.insulin_type.charAt(0).toUpperCase() + log.insulin_type.slice(1);
        
        return `
            <div class="insulin-entry">
                <div class="insulin-entry-header">
                    <span class="insulin-time">${timeStr}</span>
                    <span class="insulin-type-badge ${log.insulin_type}">${typeLabel}</span>
                </div>
                <div class="insulin-entry-body">
                    <span class="insulin-units">${log.units_taken} units</span>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Setting innerHTML to:', html);
    insulinLogDiv.innerHTML = html;
}

// Update insulin chart with current total
function updateInsulinChart(totalUnits) {
    const centerText = document.getElementById('insulinCenterText');
    console.log('updateInsulinChart called with totalUnits:', totalUnits);
    console.log('insulinCenterText element:', centerText);
    
    if (!centerText) {
        console.error('insulinCenterText element not found!');
        return;
    }
    
    const tdd = window.userProfile?.tdd || 35; // Default to 35 if not set
    console.log('TDD:', tdd, 'Setting text to:', `${Math.round(totalUnits)}/${Math.round(tdd)}`);
    centerText.textContent = `${Math.round(totalUnits)}/${Math.round(tdd)}`;
    
    // Update the chart if it exists
    if (window.insulinChart) {
        createPieChart('insulinChart', 'insulinCenterText', totalUnits, tdd, ' units');
    }
}

// Update insulin chart target based on TDD
function updateInsulinChartTarget(tdd) {
    const centerText = document.getElementById('insulinCenterText');
    if (!centerText) return;
    
    // Get current total from the text or default to 0
    const currentText = centerText.textContent;
    const currentTotal = parseInt(currentText.split('/')[0]) || 0;
    
    centerText.textContent = `${currentTotal}/${Math.round(tdd)}`;
}

// Load daily analytics and update charts
async function loadDailyAnalytics() {
    try {
        const response = await fetch('/daily-analytics');
        const data = await response.json();
        
        if (response.ok) {
            // Update AI insights
            const insightsEl = document.getElementById('aiInsights');
            if (insightsEl) {
                insightsEl.innerHTML = '<p>' + data.ai_insights + '</p>';
            }
            
            // Calculate local carb total to match nutrition totals
            const dateStr = currentFoodLogDate ? currentFoodLogDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const dayMeals = mealHistory ? mealHistory.filter(meal => 
                meal.timestamp.split('T')[0] === dateStr
            ) : [];
            
            let localTotalCarbs = 0;
            dayMeals.forEach(meal => {
                const carbs = parseFloat(meal.carbs) || 0;
                localTotalCarbs += carbs;
            });
            
            // Create or update charts
            createPieChart('caloriesChart', 'caloriesCenterText', 
                data.calories.consumed, data.calories.target, 'calories');
            createPieChart('insulinChart', 'insulinCenterText', 
                data.insulin.taken, data.insulin.target, 'units');
            // Use local carb calculation to match nutrition totals
            createPieChart('carbsChart', 'carbsCenterText', 
                localTotalCarbs, data.carbs.target, 'g');
            
            // Also update the insulin center text to ensure it shows correctly
            const insulinCenterText = document.getElementById('insulinCenterText');
            if (insulinCenterText) {
                insulinCenterText.textContent = `${Math.round(data.insulin.taken)}/${Math.round(data.insulin.target)}`;
            }
        } else {
            console.error('Error loading analytics:', data.error);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Create pie chart
function createPieChart(canvasId, centerTextId, consumed, target, unit) {
    const canvas = document.getElementById(canvasId);
    const centerText = document.getElementById(centerTextId);
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const consumedValue = Math.min(consumed, target);
    const remainingValue = Math.max(0, target - consumed);
    
    // Update center text
    centerText.textContent = `${consumedValue.toFixed(0)}/${target.toFixed(0)}${unit}`;
    
    // Destroy existing chart if it exists
    const chartName = canvasId.replace('Chart', 'Chart');
    if (window[chartName]) {
        window[chartName].destroy();
    }
    
    // Create new chart with dark theme colors
    window[chartName] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [consumedValue, remainingValue],
                backgroundColor: [
                    consumedValue >= target ? '#ef4444' : '#4a9eff',
                    'rgba(255, 255, 255, 0.1)'
                ],
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#b0b0b0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            if (context.dataIndex === 0) {
                                return `Consumed: ${value.toFixed(0)}${unit}`;
                            } else {
                                return `Remaining: ${value.toFixed(0)}${unit}`;
                            }
                        }
                    }
                }
            }
        }
    });
}

// Update existing analyzeMeal function to also load analytics
const originalAnalyzeMeal = analyzeMeal;
analyzeMeal = async function() {
    await originalAnalyzeMeal();
    // Load updated analytics after meal analysis
    loadDailyAnalytics();
};

// Initialize analytics on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load analytics after a short delay to ensure everything is loaded
    setTimeout(() => {
        loadDailyAnalytics();
    }, 1000);
});

// ===== CALENDAR NAVIGATION FUNCTIONS =====

// Make calendar days clickable to navigate to food log
function setupCalendarDayNavigation() {
    document.querySelectorAll('.calendar-day').forEach(day => {
        if (!day.classList.contains('other-month')) {
            day.addEventListener('click', function() {
                const dayNumber = this.querySelector('.day-number').textContent;
                const currentMonth = document.getElementById('current-month-year').textContent;
                
                // Navigate to the food log for this specific date
                navigateToFoodLog(dayNumber, currentMonth);
                
                // Scroll to food log section
                document.getElementById('MealAnalyzer').scrollIntoView({ behavior: 'smooth' });
            });
        }
    });
}

// Navigate food log to specific date
function navigateToFoodLog(day, monthYear) {
    // Parse the month and year
    const [month, year] = monthYear.split(' ');
    const monthIndex = new Date(Date.parse(month + " 1, " + year)).getMonth();
    
    // Set the food log to that specific date
    const targetDate = new Date(year, monthIndex, parseInt(day));
    currentFoodLogDate = targetDate;
    
    // Update the food log display
    updateFoodLogDisplay();
}

// Update calendar navigation to also update food log
function previousMonth() {
    // Get current month/year from calendar
    const currentMonthYear = document.getElementById('current-month-year').textContent;
    const [month, year] = currentMonthYear.split(' ');
    const currentDate = new Date(Date.parse(month + " 1, " + year));
    
    // Go to previous month
    currentDate.setMonth(currentDate.getMonth() - 1);
    
    // Update calendar
    generateCalendar();
    
    // Update food log to first day of new month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    currentFoodLogDate = firstDay;
    updateFoodLogDisplay();
}

function nextMonth() {
    // Get current month/year from calendar
    const currentMonthYear = document.getElementById('current-month-year').textContent;
    const [month, year] = currentMonthYear.split(' ');
    const currentDate = new Date(Date.parse(month + " 1, " + year));
    
    // Go to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    // Update calendar
    generateCalendar();
    
    // Update food log to first day of new month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    currentFoodLogDate = firstDay;
    updateFoodLogDisplay();
}

// Update the existing calendar generation to include navigation setup
const originalRenderCalendar = renderCalendar;
renderCalendar = function() {
    originalRenderCalendar();
    // Add click handlers after calendar is generated
    setTimeout(() => {
        setupCalendarDayNavigation();
    }, 100);
};

// Sidebar functionality
function toggleSidebar() {
    const sidebar = document.getElementById('profile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }
}

// Load user profile data from backend
async function loadUserProfile() {
    try {
        const response = await fetch('/get-profile');
        const data = await response.json();
        
        if (response.ok) {
            // Store user profile data globally
            window.userProfile = data;
            
            // Populate nav form fields
            if (document.getElementById('nav-height')) document.getElementById('nav-height').value = data.height || '';
            if (document.getElementById('nav-weight')) document.getElementById('nav-weight').value = data.weight || '';
            if (document.getElementById('nav-age')) document.getElementById('nav-age').value = data.age || '';
            if (document.getElementById('nav-sex')) document.getElementById('nav-sex').value = data.sex || '';
            if (document.getElementById('nav-activity')) document.getElementById('nav-activity').value = data.activity_level || '';
            if (document.getElementById('nav-diabetes-type')) document.getElementById('nav-diabetes-type').value = data.diabetes_type || '';
            
            // Update insulin type dropdown based on diabetes type
            updateInsulinTypeOptions(data.diabetes_type);
            
            // Update insulin chart target based on TDD
            if (data.tdd) {
                updateInsulinChartTarget(data.tdd);
            }
            
            // Display calculation results if they exist
            if (data.daily_calorie_target) {
                displayCalculationResults(data);
            }
            
            // Hide setup card if profile is configured
            if (data.height && data.weight && data.age && data.sex && data.activity_level) {
                const setupCard = document.getElementById('profile-setup-card');
                if (setupCard) setupCard.style.display = 'none';
            } else {
                const setupCard = document.getElementById('profile-setup-card');
                if (setupCard) setupCard.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Display calculation results in sidebar
function displayCalculationResults(data) {
    const resultsDiv = document.getElementById('sidebar-calculationResults');
    
    if (data.daily_calorie_target) {
        document.getElementById('sidebar-dailyCalories').textContent = data.daily_calorie_target;
        document.getElementById('sidebar-tdd').textContent = (data.tdd || 0) + ' units';
        document.getElementById('sidebar-carbRatio').textContent = (data.carb_ratio || 0) + 'g/unit';
        
        resultsDiv.style.display = 'block';
    }
}

// Save profile from sidebar
async function saveUserProfileFromSidebar() {
    const height = document.getElementById('sidebar-height').value;
    const weight = document.getElementById('sidebar-weight').value;
    const age = document.getElementById('sidebar-age').value;
    const sex = document.getElementById('sidebar-sex').value;
    const activityLevel = document.getElementById('sidebar-activity').value;
    
    if (!height || !weight || !age || !sex || !activityLevel) {
        alert('Please fill in all profile fields');
        return;
    }
    
    try {
        const response = await fetch('/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                height: parseFloat(height),
                weight: parseFloat(weight),
                age: parseInt(age),
                sex: sex,
                activity_level: activityLevel
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Profile saved successfully!');
            // Hide setup card
            document.getElementById('profile-setup-card').style.display = 'none';
        } else {
            alert('Error saving profile: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
    }
}

// Calculate daily needs from sidebar
async function calculateDailyNeedsFromSidebar() {
    try {
        const response = await fetch('/calculate-daily-needs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update sidebar display
            document.getElementById('sidebar-dailyCalories').textContent = data.daily_calories;
            document.getElementById('sidebar-tdd').textContent = data.tdd + ' units';
            document.getElementById('sidebar-carbRatio').textContent = data.carb_ratio + 'g/unit';
            
            // Show AI recommendations
            document.getElementById('sidebar-aiRecommendations').innerHTML = 
                '<h4>AI Recommendations:</h4><p>' + data.ai_recommendations + '</p>';
            
            // Show results section
            document.getElementById('sidebar-calculationResults').style.display = 'block';
            
            // Load analytics
            loadDailyAnalytics();
        } else {
            alert('Error calculating needs: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error calculating needs:', error);
        alert('Error calculating needs. Please try again.');
    }
}

// Update handleLogin to load profile after successful login
const originalHandleLogin = handleLogin;
handleLogin = async function(e) {
    await originalHandleLogin(e);
    
    // Load user profile after successful login
    if (document.getElementById('main-content').style.display === 'block') {
        await loadUserProfile();
    }
};

// Navigation Functions
function initNavigation() {
    // Sidebar collapse toggle
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', toggleSidebar);
    }
    
    // Navigation item clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
        });
    });
    
    // Profile dropdown toggle
    const profileToggle = document.getElementById('profile-dropdown-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', toggleProfileDropdown);
    }
    
    // Logout
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Load page-specific data
    if (pageName === 'home') {
        (async () => {
            await loadInsulinHistory();
            await loadDailyAnalytics();
        })();
    } else if (pageName === 'food-log') {
        (async () => {
            await loadInsulinHistory();
        })();
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`[data-page="${pageName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Load page-specific data
    if (pageName === 'home') {
        loadDashboardData();
    } else if (pageName === 'food-log') {
        loadFoodLogData();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function toggleProfileDropdown() {
    const dropdown = document.querySelector('.profile-dropdown-content');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (dropdown && arrow) {
        if (dropdown.style.display === 'none' || dropdown.style.display === '') {
            dropdown.style.display = 'block';
            arrow.textContent = '▲';
            loadProfileData(); // Populate form fields
        } else {
            dropdown.style.display = 'none';
            arrow.textContent = '▼';
        }
    }
}

function saveProfileFromNav() {
    const profileData = {
        height: document.getElementById('nav-height').value,
        weight: document.getElementById('nav-weight').value,
        age: document.getElementById('nav-age').value,
        sex: document.getElementById('nav-sex').value,
        activity_level: document.getElementById('nav-activity').value,
        diabetes_type: document.getElementById('nav-diabetes-type').value
    };
    
    fetch('/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Profile saved successfully!');
        toggleProfileDropdown(); // Close dropdown
        loadUserProfile(); // Reload profile to update TDD and other calculated values
    })
    .catch(error => {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
    });
}

function loadProfileData() {
    // Load current profile data into the navigation form
    fetch('/get-profile')
    .then(response => response.json())
    .then(data => {
        if (data.height) document.getElementById('nav-height').value = data.height;
        if (data.weight) document.getElementById('nav-weight').value = data.weight;
        if (data.age) document.getElementById('nav-age').value = data.age;
        if (data.sex) document.getElementById('nav-sex').value = data.sex;
        if (data.activityLevel) document.getElementById('nav-activity').value = data.activityLevel;
    })
    .catch(error => {
        console.error('Error loading profile:', error);
    });
}

function loadDashboardData() {
    // Load data for the home dashboard
    updateDashboard();
    loadDailyAnalytics();
}

function loadFoodLogData() {
    // Load food log data and calendar
    loadMealHistory();
    initializeCalendar();
    renderCalendar();
}

function loadCalendarData() {
    // Load calendar data
    initializeCalendar();
}

function sendChatMessage() {
    const input = document.getElementById('chatbot-input-main');
    const messages = document.getElementById('chatbot-messages-main');
    
    if (input && messages && input.value.trim()) {
        const userMsg = input.value.trim();
        messages.innerHTML += `<div><b>You:</b> ${userMsg}</div>`;
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        
        // Send message to backend
        fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg })
        })
        .then(response => response.json())
        .then(data => {
            messages.innerHTML += `<div><b>Bot:</b> ${data.reply}</div>`;
            messages.scrollTop = messages.scrollHeight;
        })
        .catch(err => {
            messages.innerHTML += `<div><b>Bot:</b> Sorry, there was an error connecting to the server.</div>`;
            messages.scrollTop = messages.scrollHeight;
        });
    }
}