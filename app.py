import os
import secrets
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from groq import Groq

# 1. Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super-secret-femmestry-key")

# 2. Initialize Groq API Client
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("⚠️ Warning: GROQ_API_KEY is missing from your .env file!")

groq_client = Groq(api_key=groq_api_key)

# 3. Initialize ChromaDB (Persistent local vector storage)
chroma_client = chromadb.PersistentClient(path="./chroma_db")
emb_fn = embedding_functions.DefaultEmbeddingFunction()

# Get or create vector collection
collection = chroma_client.get_or_create_collection(
    name="femmestry_curriculum",
    embedding_function=emb_fn
)

# ---------------------------------------------------------
# Web Page Navigation & Auth Routes
# ---------------------------------------------------------

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
        # Auth logic goes here; redirecting to overview upon login
        return redirect(url_for('overview'))

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Retrieve form data submitted from register.html
        nickname = request.form.get('nickname', 'Anonymous Saver').strip() or 'Anonymous Saver'
        password = request.form.get('password')

        # Generate a unique anonymous ID (e.g., FEM-FTC333)
        random_suffix = secrets.token_hex(2).upper()
        generated_id = f"FEM-FTC{random_suffix}"

        print(f"Registered User: {nickname} | ID: {generated_id}")

        flash(f"Welcome, {nickname}! Your anonymous ID is {generated_id}.", "success")

        # Redirect to overview page after successful registration
        return redirect(url_for('overview'))

    # If request is GET, render the register page
    return render_template('register.html')


# ---------------------------------------------------------
# RAG API Endpoint for the AI Money Coach
# ---------------------------------------------------------

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

        # Step 1: Search ChromaDB for matching curriculum context
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

        # Step 2: Formulate System & User Prompts
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

        # Step 3: Send request to Groq API (Llama 3.3 70B)
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
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


# ---------------------------------------------------------
# Debug route to inspect registered endpoints
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# App entry point
# ---------------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True, port=5000)