// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupAuthListeners();
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
            document.getElementById('main-content').style.display = 'block';
            loadMealHistory();
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
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginForm.addEventListener('submit', async (e) => {
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
                document.getElementById('main-content').style.display = 'block';
                loadMealHistory(); // Load user's meal history after login
            } else {
                document.getElementById('login-error').textContent = data.error;
            }
        } catch (error) {
            document.getElementById('login-error').textContent = 'An error occurred. Please try again.';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
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
                document.getElementById('register-error').textContent = data.error;
            }
        } catch (error) {
            document.getElementById('register-error').textContent = 'An error occurred. Please try again.';
        }
    });
});

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
            const foodLog = document.getElementById('foodLog');
            foodLog.innerHTML = ''; // Clear existing entries
            
            data.meals.forEach(meal => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'food-entry';
                const date = new Date(meal.timestamp);
                const timeStr = date.toLocaleString();
                
                entryDiv.innerHTML = `
                    <span class="time">${timeStr}</span>
                    <span class="description">${meal.meal_text}</span>
                    <span class="calories">${meal.calories}</span>
                    <span class="effect">Effect: ${meal.effect}</span>
                    <span class="insulin">Insulin: ${meal.insulin_suggestion}</span>
                `;
                
                foodLog.appendChild(entryDiv);
            });
        }
    } catch (error) {
        console.error('Error loading meal history:', error);
    }
}

function addToFoodLog() {
    if (!currentAnalysis) return;

    const foodLog = document.getElementById('foodLog');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'food-entry';
    entryDiv.innerHTML = `
        <span class="time">${timeStr}</span>
        <span class="description">${document.getElementById('mealInput').value}</span>
        <span class="calories">${currentAnalysis.calories}</span>
    `;
    
    
    foodLog.insertBefore(entryDiv, foodLog.firstChild);
    
    document.getElementById('mealInput').value = '';
    document.getElementById('mealResults').style.display = 'none';
    document.getElementById('addToLogBtn').disabled = true;
    currentAnalysis = null;
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
        document.getElementById('caloriesResult').textContent = `Calories: ${analysis.calories}`;
        document.getElementById('insulinEffect').textContent = `Effect on Blood Sugar: ${analysis.effect}`;
        document.getElementById('lastReading').textContent = `Insulin Suggestion: ${analysis.insulin_suggestion}`;
        
        addToLogBtn.disabled = false;
    } catch (error) {
        alert('Error analyzing meal: ' + error.message);
        console.error('Error:', error);
    }
}