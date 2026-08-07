import base64
from datetime import date
import json
import os
import secrets

import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
from flask import Flask, flash, jsonify, redirect, render_template, request, session, url_for
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from groq import Groq
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super-secret-femmestry-key")

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

VISION_MODEL = "qwen/qwen3.6-27b"
TEXT_MODEL = "llama-3.3-70b-versatile"

chroma_client = chromadb.PersistentClient(path="./chroma_db")
emb_fn = embedding_functions.DefaultEmbeddingFunction()

collection = chroma_client.get_or_create_collection(
    name="femmestry_curriculum", embedding_function=emb_fn
)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/overview")
@app.route("/dashboard")
def overview():
    return render_template("overview.html")


@app.route("/budget")
def budget():
    return render_template("budget.html")


@app.route("/savings")
def savings():
    return render_template("savings.html")


@app.route("/learn")
def learn():
    return render_template("learn.html")


@app.route("/coach")
def coach():
    return render_template("coach.html")


@app.route("/play")
def play():
    return render_template("play.html")


@app.route("/quiz")
def quiz():
    return render_template("quiz.html")


@app.route("/circle")
def circle():
    return render_template("circle.html")


@app.route("/login", methods=["GET", "POST"])
@limiter.limit("10 per minute")
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if not email or not password:
            flash("Please provide both email and password.", "error")
            return render_template("login.html")

        stored_email = session.get("user_email")
        stored_hash = session.get("user_password_hash")

        if stored_email and stored_hash:
            if email == stored_email and check_password_hash(stored_hash, password):
                session["user_logged_in"] = True
                return redirect(url_for("overview"))
            else:
                flash("Invalid email or password.", "error")
                return render_template("login.html")

        session["user_logged_in"] = True
        return redirect(url_for("overview"))

    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
@limiter.limit("10 per minute")
def register():
    if request.method == "POST":
        nickname = (
            request.form.get("nickname", "Anonymous Saver").strip()
            or "Anonymous Saver"
        )
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if password:
            session["user_password_hash"] = generate_password_hash(password)
        if email:
            session["user_email"] = email

        random_suffix = secrets.token_hex(2).upper()
        generated_id = f"FEM-FTC{random_suffix}"
        session["user_id"] = generated_id
        session["nickname"] = nickname

        flash(
            f"Welcome, {nickname}! Your anonymous ID is {generated_id}.",
            "success",
        )
        return redirect(url_for("overview"))

    return render_template("register.html")


@app.route("/scan-receipt", methods=["POST"])
@limiter.limit("20 per minute")
def scan_receipt():
    if not groq_client:
        return jsonify({"error": "GROQ API Key missing on server"}), 500

    if "receipt_image" not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    file = request.files["receipt_image"]
    if file.filename == "":
        return jsonify({"error": "No image selected"}), 400

    try:
        base64_image = base64.b64encode(file.read()).decode("utf-8")
        today_str = date.today().strftime("%Y-%m-%d")

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
"""

        completion = groq_client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{
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
            }],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        raw_response = completion.choices[0].message.content.strip()
        parsed_data = json.loads(raw_response)
        items = parsed_data.get("items", [])

        if not items:
            return (
                jsonify({
                    "error": (
                        "Could not extract valid transaction items from this"
                        " receipt."
                    )
                }),
                400,
            )

        return jsonify({
            "success": True,
            "items": items,
            "message": f"Successfully parsed {len(items)} items!",
        })

    except Exception as e:
        print(f"Error in scan_receipt: {e}")
        return (
            jsonify({"error": "Failed to process receipt image."}),
            500,
        )


@app.route("/api/rag/explain", methods=["POST"])
@app.route("/api/coach/chat", methods=["POST"])
@limiter.limit("30 per minute")
def rag_explain():
    if not groq_client:
        return jsonify({"success": False, "error": "GROQ API Key missing on server"}), 500

    try:
        data = request.json or {}
        user_query = data.get("query") or data.get("prompt") or ""
        user_query = user_query.strip()
        user_level = int(data.get("level", 5))

        if not user_query:
            return (
                jsonify({"success": False, "error": "Query cannot be empty."}),
                400,
            )

        retrieved_docs = []
        try:
            results = collection.query(
                query_texts=[user_query],
                n_results=2,
                where={"level": {"$lte": user_level}},
            )
            if results and results.get("documents") and results["documents"][0]:
                retrieved_docs = results["documents"][0]
        except Exception as chroma_err:
            print(f"ChromaDB Query Exception: {chroma_err}")

        context_text = (
            "\n---\n".join(retrieved_docs)
            if retrieved_docs
            else "General Indian financial knowledge."
        )

        system_prompt = (
            "You are 'Femmestry Money Coach', a supportive, empathetic financial"
            " mentor for women in India. You speak in simple, clear language, use"
            " one practical example from daily Indian life, and you never show your"
            " internal reasoning or thinking steps. You only return the final"
            " explanation and guidance."
        )

        user_prompt = f"""
Use the following verified educational context from official sources (RBI/SEBI/NISM) to explain the topic clearly.

[CONTEXT]
{context_text}

[USER QUESTION]
{user_query}

Instructions:
- Explain in simple, encouraging, jargon-free language.
- Give ONE short, relatable example from everyday Indian life.
- Explain both benefits and risks if relevant.
- End with a gentle, empowering tip for financial confidence.
"""

        response = groq_client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )

        answer = response.choices[0].message.content

        return jsonify({
            "success": True,
            "query": user_query,
            "answer": answer,
            "response": answer,
            "sources_found": len(retrieved_docs),
        })

    except Exception as e:
        print(f"Error in coach/chat: {e}")
        return jsonify({"success": False, "error": "Failed to process chat request."}), 500


@app.route("/api/coach/translate", methods=["POST"])
@limiter.limit("30 per minute")
def translate_news():
    if not groq_client:
        return jsonify({"success": False, "error": "GROQ API Key missing on server"}), 500

    try:
        data = request.json or {}
        news_text = data.get("news", "").strip()
        persona = data.get("persona", "I'm new to investing")

        if not news_text:
            return (
                jsonify({
                    "success": False,
                    "error": "News text cannot be empty.",
                }),
                400,
            )

        retrieved_docs = []
        try:
            results = collection.query(query_texts=[news_text], n_results=2)
            if results and results.get("documents") and results["documents"][0]:
                retrieved_docs = results["documents"][0]
        except Exception as chroma_err:
            print(f"ChromaDB Translate Error: {chroma_err}")

        context_text = (
            "\n---\n".join(retrieved_docs)
            if retrieved_docs
            else "General financial market background."
        )

        rag_sources = [
            "RBI / SEBI Knowledge Base",
            f"Level Profile: {persona}",
        ]

        prompt = f"""
You are an expert financial translator for women investors.
Translate and decode the following news story into a simple, non-intimidating breakdown.

Target Persona: "{persona}"

[NEWS HEADLINE OR STORY]
{news_text}

[RETRIEVED KNOWLEDGE BASE CONTEXT]
{context_text}

Return strictly a valid JSON object with EXACTLY these key names:
{{
  "what_happened": "A 1-2 sentence plain-English summary of what actually happened.",
  "why_it_matters": "Why this matters specifically for a normal individual or everyday investor like the user.",
  "terms_decoded": "Clear, 1-sentence definitions for 1 to 2 technical financial terms/jargon found in the text.",
  "one_thing_to_watch": "One key risk, market trend, or upcoming event to keep an eye on related to this news."
}}
"""

        completion = groq_client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise financial news translator. Output ONLY"
                        " JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        raw_content = completion.choices[0].message.content.strip()
        parsed_result = json.loads(raw_content)

        return jsonify({
            "success": True,
            "what_happened": parsed_result.get(
                "what_happened", "Summary unavailable."
            ),
            "why_it_matters": parsed_result.get(
                "why_it_matters", "Impact analysis unavailable."
            ),
            "terms_decoded": parsed_result.get(
                "terms_decoded", "No specific terms flagged."
            ),
            "one_thing_to_watch": parsed_result.get(
                "one_thing_to_watch", "Keep an eye on official updates."
            ),
            "sources": rag_sources,
        })

    except Exception as e:
        print(f"Error in translate_news: {e}")
        return jsonify({"success": False, "error": "Failed to translate news."}), 500


@app.route("/api/coach/schemes", methods=["POST"])
@limiter.limit("30 per minute")
def discover_schemes():
    if not groq_client:
        return jsonify({"success": False, "error": "GROQ API Key missing on server"}), 500

    try:
        data = request.json or {}
        user_age = int(data.get("age", 21))
        category = data.get("category", "All")

        query_text = (
            f"Government financial schemes for women in India age {user_age}"
            f" category {category}"
        )

        retrieved_docs = []
        try:
            results = collection.query(query_texts=[query_text], n_results=4)
            if results and results.get("documents") and results["documents"][0]:
                retrieved_docs = results["documents"][0]
        except Exception as chroma_err:
            print(f"ChromaDB Schemes Error: {chroma_err}")

        context_text = (
            "\n---\n".join(retrieved_docs)
            if retrieved_docs
            else "Official government schemes database for Indian women."
        )

        prompt = f"""
You are an expert advisor on Indian Government and RBI financial schemes for women.
Analyze the user's profile and retrieve matching schemes from official context.

USER PROFILE:
- Age: {user_age} years old
- Goal Category: {category}

OFFICIAL SCHEME KNOWLEDGE BASE CONTEXT:
{context_text}

Instructions:
1. Filter and identify schemes for which an Indian woman aged {user_age} is strictly eligible.
2. If category is not "All", restrict matches to that goal category (e.g. Savings or Entrepreneurship).
3. Return strictly a JSON object containing an array called "schemes".

Return structure MUST be exactly:
{{
  "schemes": [
    {{
      "title": "Exact Scheme Name",
      "category": "Savings or Entrepreneurship",
      "benefit": "Core financial return or loan details",
      "criteria": "Specific eligibility conditions and age bounds",
      "deadline": "Application timelines or operational guidelines",
      "portal": "Official government website URL",
      "tag": "Short badge e.g. Govt Guaranteed or Micro Finance"
    }}
  ]
}}
"""

        completion = groq_client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise government scheme analyzer. Output ONLY"
                        " JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        raw_content = completion.choices[0].message.content.strip()
        parsed_result = json.loads(raw_content)

        return jsonify({
            "success": True,
            "schemes": parsed_result.get("schemes", []),
            "sources": [
                "RBI & Ministry of Finance Knowledge Base",
                f"Filtered for Age {user_age}",
            ],
        })

    except Exception as e:
        print(f"Error in discover_schemes: {e}")
        return jsonify({"success": False, "error": "Failed to retrieve schemes."}), 500


@app.route("/debug-routes")
def debug_routes():
    lines = []
    for rule in app.url_map.iter_rules():
        lines.append(f"{rule.endpoint} -> {rule}")
    return "<br>".join(lines)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)