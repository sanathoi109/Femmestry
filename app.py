from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.secret_key = 'herwealth_secret_key'

# Question bank mapped to concepts learned by the user
QUESTION_BANK = [
    {
        "id": 1,
        "question": "Anjali wants to send 5 lakhs to her brother for a house down payment immediately. Which transfer mode should she use?",
        "options": ["UPI", "IMPS", "RTGS", "NEFT"],
        "correct": 2,
        "explanation": "RTGS is designed for high-value transactions above 2 lakhs and offers real-time fund settlement. Other methods like NEFT or IMPS often have lower transaction limits per day."
    },
    {
        "id": 2,
        "question": "Priya is starting her first investment journey and wants to buy a small piece of ownership in a large, established company. What is she purchasing?",
        "options": ["A stock", "A fixed deposit", "A savings account", "A currency note"],
        "correct": 0,
        "explanation": "Buying a stock represents owning a fractional share of a company. Please remember that stock prices fluctuate based on market conditions, and there is always a risk of loss."
    },
    {
        "id": 3,
        "question": "Kavita wants to set aside money for an emergency fund that she can access immediately at any hour. Where should she keep it?",
        "options": ["Real Estate", "Liquid Mutual Fund / High-Yield Savings", "Gold Jewelry", "5-Year Lock-in FD"],
        "correct": 1,
        "explanation": "Emergency funds require high liquidity. High-yield savings accounts or liquid funds allow instant access without lock-in penalties."
    },
    {
        "id": 4,
        "question": "Sneha receives a message asking for her UPI PIN to receive a prize reward of ₹10,000. What should she do?",
        "options": ["Enter the PIN quickly", "Ignore/Block, UPI PIN is only required to send money", "Share PIN over phone", "Send ₹1 first"],
        "correct": 1,
        "explanation": "You NEVER need to enter your UPI PIN to receive money. Entering a PIN always deducts money from your bank account."
    },
    {
        "id": 5,
        "question": "Which financial tool helps track monthly expenses and prevents overspending?",
        "options": ["Credit Card limit upgrade", "A monthly budget plan", "Personal Loan", "Crypto Trading"],
        "correct": 1,
        "explanation": "Creating a structured budget helps categorize needs, wants, and savings goals systematically before spending."
    }
]

@app.route('/')
def home():
    user_data = {
        "display_name": "Anonymous Saver",
        "user_id": "FEM-FTC333",
        "streak_days": 0,
        "savings_balance": 0,
        "savings_goal": 50000,
        "topics_learned": 0
    }
    return render_template('dashboard.html', user=user_data)

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

@app.route('/api/quiz/questions', methods=['GET'])
def get_quiz_questions():
    return jsonify({
        "success": True,
        "learned_topics_count": 5,
        "questions": QUESTION_BANK
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)