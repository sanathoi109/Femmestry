"""
seed_data.py
------------
Populates the FlashcardDeck / Flashcard tables with starter content for
the Swipe & Learn engine. Run automatically on first app startup if the
decks table is empty (see app.py `init_db`).
"""

from models import db, FlashcardDeck, Flashcard

DECKS = [
    {
        "slug": "money-basics",
        "title": "Money Basics",
        "description": "The building blocks everyone should know first.",
        "icon": "🌱",
        "cards": [
            dict(front_text="Emergency Fund", correct_swipe="right",
                 explanation="A cash cushion (ideally 3–6 months of expenses) kept aside for surprises like job loss or medical bills.",
                 quiz_question="An emergency fund should typically cover:",
                 quiz_options="1 week of expenses,3–6 months of expenses,10 years of expenses",
                 quiz_answer="3–6 months of expenses",
                 teach_back_keywords="emergency,cushion,unexpected,months,expenses,save"),
            dict(front_text="Credit Card Minimum Due", correct_swipe="left",
                 explanation="Paying only the 'minimum due' lets interest pile up fast — it's a trap that keeps you in debt longer.",
                 quiz_question="Paying only the minimum due on a credit card mainly:",
                 quiz_options="Saves you money,Increases interest owed over time,Improves your credit instantly",
                 quiz_answer="Increases interest owed over time",
                 teach_back_keywords="interest,debt,minimum,trap,credit card"),
            dict(front_text="Systematic Investment Plan (SIP)", correct_swipe="right",
                 explanation="Investing a fixed amount regularly (e.g. monthly) so you buy more units when prices are low and fewer when high — smoothing out market ups and downs.",
                 quiz_question="SIP works best because it:",
                 quiz_options="Times the market perfectly,Averages your purchase cost over time,Guarantees profit",
                 quiz_answer="Averages your purchase cost over time",
                 teach_back_keywords="regular,monthly,average,invest,fixed,compound"),
            dict(front_text="Payday Loans", correct_swipe="left",
                 explanation="Short-term loans with extremely high interest rates — often 300%+ APR — designed to trap borrowers in repeat borrowing.",
                 quiz_question="Payday loans are risky mainly because of their:",
                 quiz_options="Long repayment terms,Extremely high interest rates,Low borrowing limits",
                 quiz_answer="Extremely high interest rates",
                 teach_back_keywords="high interest,short term,debt trap,risky"),
        ],
    },
    {
        "slug": "investing-101",
        "title": "Investing 101",
        "description": "Grow your money with confidence.",
        "icon": "📈",
        "cards": [
            dict(front_text="Mutual Fund", correct_swipe="right",
                 explanation="A pool of money from many investors, professionally managed and invested across stocks/bonds — an easy way to diversify without picking individual stocks.",
                 quiz_question="A mutual fund helps you mainly by:",
                 quiz_options="Diversifying your investment,Guaranteeing fixed returns,Avoiding all risk",
                 quiz_answer="Diversifying your investment",
                 teach_back_keywords="pool,diversify,manager,stocks,bonds,professionally managed"),
            dict(front_text="Index Fund", correct_swipe="right",
                 explanation="A low-cost fund that simply tracks a market index (like Nifty 50 or S&P 500) instead of trying to beat it — historically hard to outperform.",
                 quiz_question="Index funds are popular because they typically have:",
                 quiz_options="High fees and active trading,Low fees and broad market tracking,Guaranteed high returns",
                 quiz_answer="Low fees and broad market tracking",
                 teach_back_keywords="track,index,low cost,passive,market"),
            dict(front_text="'Get Rich Quick' Trading Tips", correct_swipe="left",
                 explanation="Promises of fast, guaranteed high returns are a major red flag for scams or extremely high-risk speculation — real investing compounds slowly.",
                 quiz_question="A 'guaranteed high return, fast' investment tip is usually:",
                 quiz_options="A safe bet,A major red flag,Standard practice",
                 quiz_answer="A major red flag",
                 teach_back_keywords="scam,red flag,guaranteed,risky,too good"),
            dict(front_text="Diversification", correct_swipe="right",
                 explanation="Spreading your money across different assets (stocks, bonds, gold, cash) so one bad investment doesn't sink your whole portfolio.",
                 quiz_question="Diversification mainly helps you:",
                 quiz_options="Reduce overall risk,Guarantee profits,Avoid paying taxes",
                 quiz_answer="Reduce overall risk",
                 teach_back_keywords="spread,risk,different assets,portfolio,eggs,basket"),
        ],
    },
    {
        "slug": "life-planning",
        "title": "Life-Stage Planning",
        "description": "Money moves for career breaks, income gaps & big life events.",
        "icon": "🌸",
        "cards": [
            dict(front_text="Career Break Buffer", correct_swipe="right",
                 explanation="Building extra savings before a planned career break (maternity leave, sabbatical) so your investments keep growing even when contributions pause.",
                 quiz_question="A career-break buffer is designed to:",
                 quiz_options="Replace your salary forever,Cover the gap while contributions pause,Avoid ever working again",
                 quiz_answer="Cover the gap while contributions pause",
                 teach_back_keywords="buffer,break,pause,maternity,gap,cushion"),
            dict(front_text="Ignoring Retirement Until Age 40", correct_swipe="left",
                 explanation="Delaying retirement investing means losing years of compounding — starting even small amounts early beats larger amounts started late.",
                 quiz_question="Delaying retirement savings mostly costs you:",
                 quiz_options="Nothing significant,Years of compound growth,Only a small amount",
                 quiz_answer="Years of compound growth",
                 teach_back_keywords="compound,early,delay,time,growth"),
            dict(front_text="Health & Term Insurance", correct_swipe="right",
                 explanation="Insurance transfers big, unpredictable financial risks (medical bills, loss of income) to an insurer for a small predictable premium.",
                 quiz_question="The main purpose of insurance is to:",
                 quiz_options="Grow your wealth fast,Transfer large unpredictable risk for a small premium,Avoid saving altogether",
                 quiz_answer="Transfer large unpredictable risk for a small premium",
                 teach_back_keywords="risk,premium,protect,transfer,cover"),
        ],
    },
]


def seed_if_empty():
    if FlashcardDeck.query.first():
        return  # already seeded
    for deck_data in DECKS:
        cards = deck_data.pop("cards")
        deck = FlashcardDeck(**deck_data)
        db.session.add(deck)
        db.session.flush()  # get deck.id
        for idx, card in enumerate(cards):
            db.session.add(Flashcard(deck_id=deck.id, order_index=idx, **card))
    db.session.commit()