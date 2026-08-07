import base64
from datetime import date
import json
import os
import secrets

import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
from flask import Flask, flash, jsonify, redirect, render_template, request, url_for
from groq import Groq

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super-secret-femmestry-key")

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
  print("⚠️ Warning: GROQ_API_KEY is missing from your .env file!")

groq_client = Groq(api_key=groq_api_key)

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
def login():
  if request.method == "POST":
    return redirect(url_for("overview"))
  return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
  if request.method == "POST":
    nickname = (
        request.form.get("nickname", "Anonymous Saver").strip()
        or "Anonymous Saver"
    )
    _password = request.form.get("password")
    random_suffix = secrets.token_hex(2).upper()
    generated_id = f"FEM-FTC{random_suffix}"

    print(f"Registered User: {nickname} | ID: {generated_id}")
    flash(
        f"Welcome, {nickname}! Your anonymous ID is {generated_id}.", "success"
    )
    return redirect(url_for("overview"))

  return render_template("register.html")


@app.route("/scan-receipt", methods=["POST"])
def scan_receipt():
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
    print(f"Error in /scan-receipt: {e}")
    return (
        jsonify({"error": f"Failed to process receipt image: {str(e)}"}),
        500,
    )


@app.route("/api/rag/explain", methods=["POST"])
@app.route("/api/coach/chat", methods=["POST"])
def rag_explain():
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

    print("Coach Chat Query:", repr(user_query))

    retrieved_docs = []
    try:
      results = collection.query(
          query_texts=[user_query],
          n_results=2,
          where={"level": {"$lte": user_level}},
      )
      if results and results.get("documents") and results["documents"][0]:
        retrieved_docs = results["documents"][0]
    except Exception as query_err:
      print("ChromaDB query warning:", query_err)

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
    print(f"Error in /api/coach/chat: {e}")
    return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/coach/translate", methods=["POST"])
def translate_news():
  try:
    data = request.json or {}
    news_text = data.get("news", "").strip()
    persona = data.get("persona", "I'm new to investing")

    if not news_text:
      return (
          jsonify({"success": False, "error": "News text cannot be empty."}),
          400,
      )

    print(f"Translate News Query: '{news_text[:50]}...' | Persona: '{persona}'")

    retrieved_docs = []
    try:
      results = collection.query(query_texts=[news_text], n_results=2)
      if results and results.get("documents") and results["documents"][0]:
        retrieved_docs = results["documents"][0]
    except Exception as chroma_err:
      print("ChromaDB query warning in translate:", chroma_err)

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
    print(f"Error in /api/coach/translate: {e}")
    return jsonify({"success": False, "error": str(e)}), 500


@app.route("/debug-routes")
def debug_routes():
  lines = []
  for rule in app.url_map.iter_rules():
    lines.append(f"{rule.endpoint} -> {rule}")
  return "<br>".join(lines)


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000, debug=True)