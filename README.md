# HERWORTH (Femmestry)
> **Money, Mastered** — A comprehensive financial management platform and learning ecosystem built for personal financial empowerment.

---

## 🎯 Key Highlights

* **📊 Complete Financial Dashboard:** Track monthly income, expenses, portfolio values, and total savings in one clean, unified overview.
* **🛡️ Dynamic Safety Net Calculator:** Automatically calculates your runway (in months) based on current savings versus average monthly expenses against set target goals.
* **🎯 Goal-Based Savings Engine:** Create, track, and manage target goals (e.g., Emergency Fund, Down Payment, Japan Trip) with progress visualizations and deposit/withdrawal management.
* **📸 Smart AI Bill & Receipt Scanner:** Scan physical bills and receipt uploads to extract total spending and automatically categorize expenses.
* **📚 Interactive Learning Hub:** Access bite-sized financial literacy modules covering budgeting (50/30/20 rule), career breaks, salary negotiations, and emergency funds.
* **🧠 Adaptive AI Scenario Quizzes:** Test financial knowledge with AI-generated real-life scenario questions dynamically generated from completed learning modules.
* **💱 Multi-Currency Support:** Seamlessly toggle display figures across major currencies including USD ($), INR (₹), EUR (€), and GBP (£).
* **🔥 Habit Building & Gamification:** Maintain continuous financial engagement using real-time login streaks and progress tracking.

---

## ✨ Features

### 📈 Financial Dashboard & Analytics
* **At-a-Glance Metrics:** Real-time visibility into Monthly Income, Expenses, Total Savings, and Investment Portfolio Values.
* **Expense Breakdown:** Visual spending breakdown by category (Housing, Food, Fun, Health, etc.).
* **Safety Net Calculation:** Automatically displays safety runway (e.g., `2.7 months of expenses covered` out of a target goal).

### 🎯 Savings & Goal Management
* **Custom Goal Creation:** Define target amounts, specific purpose tags (Emergency, Home, Freedom, Travel), and target dates.
* **Progress Tracking:** Circular progress bars showing exact percentages and required monthly savings rates to stay on target.
* **Fund Management Modal:** Deposit or withdraw funds directly into/from specific savings buckets with instant update logging.

### 🤖 AI Document Intelligence & Assistant
* **Receipt & Bill Scanner:** Upload images of receipts or invoices to extract key numbers and details automatically.
* **AI Financial Coach:** Integrated assistant for personalized advice and financial context answers.

### 📚 Learning & Interactive Quizzes
* **Micro-Lessons:** Categorized modules covering **Budgeting**, **Saving**, **Investing**, and **Independence**.
* **Real-World Scenarios:** Detailed guides on negotiating salary with evidence, managing money during career breaks, and sinking funds.
* **Dynamic Quiz Pool:** Interactive scenario-based quizzes that unlock and build questions dynamically as lessons are marked complete.

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│               HTML5 / CSS3 / Modern JavaScript              │
│         (Responsive UI, Modals, Dynamic Currency, Charts)   │
└────────────────────┬────────────────────────────────────────┘
│ HTTP / REST / Form Data
↓
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                           │
│                      Python / Flask                         │
│          (Routing, Logic Engine, Data Serialization)        │
└────────────────────┬────────────────────────────────────────┘
│
┌───────────┴───────────┐
↓                       ↓
┌──────────────────┐   ┌──────────────────────────────────────┐
│  AI Engine / OCR │   │            Data Storage              │
│ (Bill Processing │   │               SQLite                 │
│  & Dynamic Quiz) │   │ (Users, Budgets, Savings, Progress) │
└──────────────────┘   └──────────────────────────────────────┘

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Python / Flask | Web application framework and RESTful routing |
| **Database** | SQLite / DB Browser | Lightweight relational database storage |
| **Frontend** | JavaScript (ES6+), HTML5, CSS3 | Interactive UI components, modal flows, dynamic state updates |
| **AI / Document Processing** | Gemini / Vision Processing | Bill scanning, receipt parsing, and adaptive quiz generation |

---

## 🚀 Quick Start

### Prerequisites
* **Python 3.8+** installed on your system.
* **Git** installed.
