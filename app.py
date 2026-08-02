import os
import json
import secrets
import base64
from datetime import date
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from groq import Groq
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super-secret-femmestry-key")

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("⚠️ Warning: GROQ_API_KEY is missing from your .env file!")

groq_client = Groq(api_key=groq_api_key)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
emb_fn = embedding_functions.DefaultEmbeddingFunction()

collection = chroma_client.get_or_create_collection(
    name="femmestry_curriculum",
    embedding_function=emb_fn
)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/overview')
@app.route('/dashboard')
def overview():
    return render_template('overview.html')


@app.route('/budget')
def budget():
    """Budget route to render the interactive budget template."""
    return render_template('budget.html')


@app.route('/savings')
def savings():
    return render_template('savings.html')


@app.route('/learn')
def learn():
    return render_template('learn.html')


@app.route('/coach')
def coach():
    return render_template('coach.html')


@app.route('/play')
def play():
    return render_template('play.html')


@app.route('/quiz')
def quiz():
    return render_template('quiz.html')


@app.route('/circle')
def circle():
    return render_template('circle.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return redirect(url_for('overview'))

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        nickname = request.form.get('nickname', 'Anonymous Saver').strip() or 'Anonymous Saver'
        password = request.form.get('password')
        random_suffix = secrets.token_hex(2).upper()
        generated_id = f"FEM-FTC{random_suffix}"

        print(f"Registered User: {nickname} | ID: {generated_id}")

        flash(f"Welcome, {nickname}! Your anonymous ID is {generated_id}.", "success")

        return redirect(url_for('overview'))

    return render_template('register.html')


@app.route('/scan-receipt', methods=['POST'])
def scan_receipt():
    """
    Processes uploaded receipt images using Groq's Vision AI model.
    Extracts itemized expenses, dates, and amounts in strict JSON format.
    """
    if 'receipt_image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400

    file = request.files['receipt_image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    try:
        base64_image = base64.b64encode(file.read()).decode('utf-8')
        today_str = date.today().strftime('%Y-%m-%d')

        prompt = f"""
        You are an intelligent financial receipt parser. 
        Analyze this receipt/bill image and extract all individual line item expenses.

        Categorize each item into EXACTLY ONE of these categories:
        - Housing
        - Food
        - Fun
        - Health
        - Beauty
        - Education
        - Subscriptions
        - Transport
        - Other

        Today's date default is "{today_str}".

        Return ONLY a strictly valid JSON object structured like this:
        {{
            "items": [
                {{
                    "description": "Item or store name",
                    "amount": 250.00,
                    "category": "Food",
                    "date": "YYYY-MM-DD"
                }}
            ]
        }}

        Rules:
        1. "amount" must be a clean numeric float/int value (do not include currency symbols like ₹ or $).
        2. Extract individual itemized purchases if listed clearly on the receipt.
        3. If dates are not clearly visible on the receipt, use "{today_str}".
        """

        completion = groq_client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        raw_response = completion.choices[0].message.content.strip()
        parsed_data = json.loads(raw_response)
        items = parsed_data.get("items", [])

        if not items:
            return jsonify({'error': 'Could not extract valid transaction items from this receipt.'}), 400

        return jsonify({
            'success': True,
            'items': items,
            'message': f"Successfully parsed {len(items)} items!"
        })

    except Exception as e:
        print(f"Error in /scan-receipt: {e}")
        return jsonify({'error': f'Failed to process receipt image: {str(e)}'}), 500



@app.route('/api/rag/explain', methods=['POST'])
def rag_explain():
    try:
        data = request.json or {}
        user_query = data.get('query', '').strip()
        user_level = int(data.get('level', 5))

        if not user_query:
            return jsonify({
                "success": False,
                "error": "Query cannot be empty."
            }), 400

        results = collection.query(
            query_texts=[user_query],
            n_results=2,
            where={"level": {"$lte": user_level}}
        )

        retrieved_docs = (
            results['documents'][0]
            if (results and results.get('documents') and results['documents'][0])
            else []
        )

        context_text = (
            "\n---\n".join(retrieved_docs)
            if retrieved_docs
            else "General Indian financial knowledge."
        )

        system_prompt = (
            "You are 'Femmestry Money Coach', a supportive, empathetic financial mentor for women in India. "
            "Your goal is to build financial confidence using clear, simple language, practical real-life examples, "
            "and zero product pushing or judgement."
        )

        user_prompt = f"""
Use the following verified educational context from official sources (RBI/SEBI/NISM) to explain the topic clearly.

[VERIFIED CURRICULUM CONTEXT]
{context_text}

[USER QUESTION / DOUBT]
{user_query}

Formatting & Tone Guidelines:
- Keep language simple, encouraging, and jargon-free.
- Provide 1 relatable, practical example from daily Indian life.
- Present a balanced perspective (explain both upsides and risks).
- End with a gentle, empowering tip for financial confidence.
"""

        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.2-11b-vision-instruct",
            temperature=0.3
        )

        answer = response.choices[0].message.content

        return jsonify({
            "success": True,
            "query": user_query,
            "answer": answer,
            "sources_found": len(retrieved_docs)
        })

    except Exception as e:
        print(f"Error in /api/rag/explain: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500




@app.route('/debug-routes')
def debug_routes():
    """
    Visit /debug-routes in your browser to see all endpoints
    currently registered in this running Flask app.
    """
    lines = []
    for rule in app.url_map.iter_rules():
        lines.append(f"{rule.endpoint} -> {rule}")
    return "<br>".join(lines)



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)