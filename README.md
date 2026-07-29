# FinLit — Women's Financial Literacy & Goal Tracking Platform

An interactive, gamified financial literacy platform built around active
learning (not textbook reading), tactile UI, and zero-knowledge-style
privacy.

## Quick start

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Generate a persistent AES-256 encryption key (32 bytes, base64-encoded).
# IMPORTANT: if you don't set this, a random key is generated each time
# the app restarts and you will NOT be able to decrypt previously-saved
# goals/notes. Always set this in any environment you want data to
# survive a restart.
export FINLIT_ENC_KEY=$(python3 -c "import os,base64;print(base64.b64encode(os.urandom(32)).decode())")

# Flask session signing key
export FINLIT_SECRET_KEY=$(python3 -c "import secrets;print(secrets.token_hex(32))")

python3 app.py
```

Then open **http://127.0.0.1:5000**

The SQLite database is created automatically on first run at
`instance/finlit.db`, along with three starter flashcard decks.

## What's implemented

**Active learning**
- Swipe & Learn: drag (or use the on-screen buttons) to swipe flashcards
  right ("Save/Invest") or left ("Skip/Risk"); tap to flip for the
  1-sentence explanation; each card ends with a 1-question instant check.
- Teach-Back: free-text explanation graded against target keywords with
  supportive, non-judgmental feedback (`/api/teach-back`).
- Interactive budgeting sliders with a live "Safety Shield" radial gauge
  that recomputes on every drag.
- Zero-risk SIP / Fixed Deposit simulator with a live Chart.js line chart.

**Women-centric tools**
- Life-Stage & Gap-Adjusted Wealth Engine: projects savings growth
  while honestly modeling a career-break window with paused
  contributions, and shows the "gap cost" vs. an uninterrupted timeline.
- Impulse Purchase Neutralizer: converts an item's cost into hours of
  work and future invested value.
- Panic-Shield: a button (and the Space-bar hotkey) that instantly masks
  the whole screen behind an innocuous recipe page. Tap/click or Esc to
  return. Purely client-side — no network round trip, so it's instant.
- Anonymous community Q&A board — posts show a rotating anonymous label,
  never the poster's identity.

## Security implementation

| Requirement | Where |
|---|---|
| HTTPS/TLS 1.3 enforcement | `Strict-Transport-Security` header in `app.py`; enable `SESSION_COOKIE_SECURE` behind real TLS termination |
| Secure cookies | `SESSION_COOKIE_HTTPONLY`, `SESSION_COOKIE_SAMESITE="Strict"` in `app.py` |
| AES-256-GCM field encryption | `crypto_utils.py` — used by `Goal.title/notes`, `JournalNote.body`, `CommunityPost.body` in `models.py` |
| Argon2id password hashing | `auth.py` |
| Zero-knowledge accounts | `User.pseudo_id` is the only identifier; no name/email/phone fields exist anywhere in the schema |
| SQL injection safeguards | All queries go through SQLAlchemy's ORM/parameterized query layer — no raw string-built SQL anywhere |
| XSS safeguards | Jinja2 autoescaping on every template; frontend JS uses `textContent`, not `innerHTML`, for any user-supplied text (see `community.js`); CSP header restricts script/style sources |

**Honest caveat on "zero-knowledge":** this reference implementation
encrypts sensitive fields server-side with one application master key
(`FINLIT_ENC_KEY`), which protects against database leaks, backups, and
insider snooping — but the server process itself can still decrypt data
in memory. A stricter, literal zero-knowledge design would derive a
per-user encryption key from the user's own password (via HKDF/Argon2)
so that not even the server operator could ever decrypt it. That
tradeoff is called out directly in `crypto_utils.py` if you want to take
it further.

## Project structure

```
app.py                 Flask app + all routes
models.py               SQLAlchemy models (encrypted fields via @property)
crypto_utils.py          AES-256-GCM encrypt/decrypt + pseudonymous ID generator
auth.py                 Argon2id password hashing
calculators.py           SIP / lumpsum / life-gap / impulse-neutralizer math
seed_data.py             Starter flashcard decks
requirements.txt
templates/               Jinja2 templates (one per page)
static/css/style.css      Design system ("Dusk Ledger" palette)
static/js/               gauge.js, swipe.js, simulator.js, budget-sliders.js,
                        panic-shield.js, tools.js, community.js
```

## Notes on production-readiness

This is a fully functional reference build, not a hardened production
deployment. Before shipping to real users you'd want to add: rate
limiting on auth endpoints, CSRF tokens on state-changing form posts,
a production WSGI server (gunicorn/uwsgi) behind real TLS, a managed
Postgres database instead of SQLite, a secrets manager for
`FINLIT_ENC_KEY`, and automated backups with the encryption key stored
separately from the database backups.