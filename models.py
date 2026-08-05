"""
models.py
---------
SQLAlchemy models for FinLit (women's financial literacy platform).

Security-relevant design choices:
  - User.pseudo_id is the ONLY identifier we generate/store - no real
    names, emails, or phone numbers are collected anywhere in this schema.
  - User.password_hash stores an Argon2id hash (see auth.py) - never a
    plaintext or reversibly-encrypted password.
  - Goal.title_enc / Goal.notes_enc, JournalNote.body_enc, and
    CommunityPost.body_enc are stored ENCRYPTED at rest via
    crypto_utils.encrypt_field(). We expose plaintext to the app layer
    through Python @property getters/setters so the rest of the codebase
    never has to think about encryption - it just does `goal.title = "x"`
    and `goal.title` and the model handles encrypt/decrypt transparently.
  - CommunityPost intentionally has NO foreign key rendered to the UI
    layer as "author identity" - posts are displayed anonymously even
    though we keep a nullable author_id server-side for moderation.
"""

from datetime import datetime, date
from flask_sqlalchemy import SQLAlchemy
from crypto_utils import encrypt_field, decrypt_field, generate_pseudonymous_id

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    pseudo_id = db.Column(db.String(32), unique=True, nullable=False, index=True,
                           default=generate_pseudonymous_id)
    display_name = db.Column(db.String(40), nullable=False, default="Anonymous")
    password_hash = db.Column(db.String(255), nullable=False)  # Argon2id hash
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    streak_days = db.Column(db.Integer, default=0)
    last_activity_date = db.Column(db.Date, default=None)
    xp_points = db.Column(db.Integer, default=0)

    monthly_income = db.Column(db.Float, default=0.0)
    career_break_months = db.Column(db.Integer, default=0)

    goals = db.relationship("Goal", backref="user", lazy=True, cascade="all, delete-orphan")
    notes = db.relationship("JournalNote", backref="user", lazy=True, cascade="all, delete-orphan")
    progress = db.relationship("FlashcardProgress", backref="user", lazy=True, cascade="all, delete-orphan")
    budget = db.relationship("BudgetAllocation", backref="user", uselist=False, cascade="all, delete-orphan")

    def touch_streak(self):
        """Update the daily streak counter - called once per active day."""
        today = date.today()
        if self.last_activity_date == today:
            return  # already counted today
        if self.last_activity_date and (today - self.last_activity_date).days == 1:
            self.streak_days += 1
        else:
            self.streak_days = 1
        self.last_activity_date = today


class Goal(db.Model):
    """A financial goal (e.g. 'Emergency Fund', 'Home Down Payment').
    title and notes are ENCRYPTED at rest - only decrypted in-process
    when read through the Python property."""
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    _title_enc = db.Column("title_enc", db.Text, nullable=False)
    _notes_enc = db.Column("notes_enc", db.Text, nullable=True)

    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0)
    target_date = db.Column(db.Date, nullable=True)
    category = db.Column(db.String(50), default="general")  # e.g. emergency, retirement
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def title(self):
        return decrypt_field(self._title_enc)

    @title.setter
    def title(self, value):
        self._title_enc = encrypt_field(value)

    @property
    def notes(self):
        return decrypt_field(self._notes_enc) if self._notes_enc else ""

    @notes.setter
    def notes(self, value):
        self._notes_enc = encrypt_field(value) if value else None

    @property
    def progress_pct(self):
        if not self.target_amount:
            return 0
        return min(100, round((self.current_amount / self.target_amount) * 100, 1))


class JournalNote(db.Model):
    """Private personal notes/logs - fully encrypted, never shown to
    anyone but the owning user."""
    __tablename__ = "journal_notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    _body_enc = db.Column("body_enc", db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def body(self):
        return decrypt_field(self._body_enc)

    @body.setter
    def body(self, value):
        self._body_enc = encrypt_field(value)


class BudgetAllocation(db.Model):
    """Stores the user's latest budgeting-slider allocation, used to
    drive the 'Safety Shield' gauge on the dashboard."""
    __tablename__ = "budget_allocations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    needs_pct = db.Column(db.Float, default=50.0)
    wants_pct = db.Column(db.Float, default=30.0)
    savings_pct = db.Column(db.Float, default=20.0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def safety_score(self):
        """0-100 'Safety Shield' score. Rewards higher savings_pct and
        penalizes needs+wants that leave too little cushion. This is a
        simple, transparent heuristic (not financial advice)."""
        score = (self.savings_pct * 2.2) + max(0, (60 - self.needs_pct)) * 0.4
        return max(0, min(100, round(score)))


class FlashcardDeck(db.Model):
    """A themed deck of Swipe & Learn micro-concept cards."""
    __tablename__ = "flashcard_decks"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    icon = db.Column(db.String(10), default="💡")
    cards = db.relationship("Flashcard", backref="deck", lazy=True, order_by="Flashcard.order_index")


class Flashcard(db.Model):
    """A single micro-concept card. front = the swipe prompt,
    explanation = revealed on tap, quiz_question/quiz_answer power the
    1-question instant check. correct_swipe is 'right' or 'left' and
    tags whether the concept is a 'good habit' (save/invest) vs a
    'caution' (risk/skip) concept for the swipe interaction."""
    __tablename__ = "flashcards"

    id = db.Column(db.Integer, primary_key=True)
    deck_id = db.Column(db.Integer, db.ForeignKey("flashcard_decks.id"), nullable=False)
    order_index = db.Column(db.Integer, default=0)
    front_text = db.Column(db.String(200), nullable=False)
    explanation = db.Column(db.String(400), nullable=False)
    correct_swipe = db.Column(db.String(5), nullable=False)  
    quiz_question = db.Column(db.String(200), nullable=False)
    quiz_options = db.Column(db.Text, nullable=False)  
    quiz_answer = db.Column(db.String(100), nullable=False)
    teach_back_keywords = db.Column(db.Text, default="")


class FlashcardProgress(db.Model):
    """Tracks which cards a user has completed, for streaks/XP."""
    __tablename__ = "flashcard_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    flashcard_id = db.Column(db.Integer, db.ForeignKey("flashcards.id"), nullable=False)
    got_it_right = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)


class CommunityPost(db.Model):
    """Anonymous Q&A board post. author_id is kept server-side only for
    abuse moderation; it is NEVER serialized to the frontend, so posts
    render with zero identity metrics (no name, no avatar, no join
    date) - just a rotating anonymous label like 'Anonymous Saver #482'
    generated deterministically from the post id at render time."""
    __tablename__ = "community_posts"

    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    _body_enc = db.Column("body_enc", db.Text, nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("community_posts.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    upvotes = db.Column(db.Integer, default=0)

    replies = db.relationship("CommunityPost", backref=db.backref("parent", remote_side=[id]))

    @property
    def body(self):
        return decrypt_field(self._body_enc)

    @body.setter
    def body(self, value):
        self._body_enc = encrypt_field(value)

    @property
    def anon_label(self):
        return f"Anonymous Saver #{(self.id * 37) % 900 + 100}"