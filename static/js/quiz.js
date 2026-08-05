document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startState = document.getElementById('startState');
    const loadingState = document.getElementById('loadingState');
    const questionState = document.getElementById('questionState');
    const completedState = document.getElementById('completedState');

    const startQuizBtn = document.getElementById('startQuizBtn');
    const restartQuizBtn = document.getElementById('restartQuizBtn');
    const nextBtn = document.getElementById('nextBtn');

    const topicCountSpan = document.getElementById('topicCount');
    const loadingTopicCountSpan = document.getElementById('loadingTopicCount');
    const currentQNum = document.getElementById('currentQNum');
    const totalQNum = document.getElementById('totalQNum');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const explanationBox = document.getElementById('explanationBox');
    const explanationText = document.getElementById('explanationText');
    const finalScore = document.getElementById('finalScore');
    const finalTotal = document.getElementById('finalTotal');

    // --- State Variables ---
    let completedLessonIds = [];
    let activeQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedOptionIndex = null;

    // --- Master Question Bank (10 Scenarios Total, 4 Options Each) ---
    const rawQuestionBank = [
        {
            lessonId: 1,
            scenario: "Your rent increases to 60% of your net income due to a lease renewal. What is the soundest financial response?",
            correctIndex: 1,
            options: [
                "Stop saving entirely until rent decreases.",
                "Shift to a 60/20/20 ratio, maintaining 20% for future/savings while trimming wants.",
                "Put extra living expenses on credit cards to maintain 30% for wants.",
                "Take out a short-term personal loan to bridge the monthly gap."
            ],
            explanations: [
                "What might go wrong: Completely pausing savings abandons long-term compounding and leaves you vulnerable.",
                "Great choice! Adapting ratios while protecting the future/savings bucket keeps your long-term choices intact.",
                "What might go wrong: Carrying consumer debt at high interest rates creates a severe debt trap.",
                "What might go wrong: Personal loans carry high interest and add debt service on top of already inflated living costs."
            ]
        },
        {
            lessonId: 2,
            scenario: "You have $2,000 in credit card debt at 22% interest and $500 in savings. What should you prioritize?",
            correctIndex: 1,
            options: [
                "Put all extra funds into debt payoff and ignore cash savings.",
                "Maintain a mini $1,000 emergency buffer first, then aggressively pay down the 22% debt.",
                "Invest all spare cash in index funds for higher potential returns.",
                "Apply for a balance transfer card and double your discretionary spending."
            ],
            explanations: [
                "What might go wrong: Without any cash buffer, an unexpected bill forces you back onto credit cards.",
                "Great choice! A small emergency cushion prevents relapse into high-interest debt during minor emergencies.",
                "What might go wrong: Market returns average 8-10%, which cannot beat a guaranteed negative 22% interest rate.",
                "What might go wrong: Opening new credit lines without fixing spending habits usually doubles total debt loads."
            ]
        },
        {
            lessonId: 5,
            scenario: "During your review, you present revenue metrics and ask for a 12% raise. Your manager says 'The budget is tight.' What should you do?",
            correctIndex: 1,
            options: [
                "Apologize for asking and accept the status quo.",
                "Ask what specific benchmarks are needed for 12%, and agree on a clear follow-up date in 6 months.",
                "Immediately quit without another offer in place.",
                "Stop taking on new project tasks to protest the manager's decision."
            ],
            explanations: [
                "What might go wrong: Apologizing signals your request was negotiable or unfounded.",
                "Great choice! Establishing objective milestones and a documented timeline keeps career momentum on track.",
                "What might go wrong: Resigning spontaneously without a cash runway or job offer compromises financial safety.",
                "What might go wrong: Quiet quitting lowers your performance review standing and hurts future negotiation leverage."
            ]
        },
        {
            lessonId: 8,
            scenario: "You plan to take 1 year off from paid employment for caregiving. How do you protect your retirement momentum?",
            correctIndex: 1,
            options: [
                "Pause all retirement growth completely until you re-enter the workforce.",
                "Utilize a Spousal IRA if married, or set up automated micro-contributions from savings.",
                "Withdraw existing 401(k) funds to cover living expenses during the break.",
                "Invest exclusively in high-risk crypto coins hoping to multiply savings fast."
            ],
            explanations: [
                "What might go wrong: Taking a complete break stops compound interest during critical growth years.",
                "Great choice! A Spousal IRA allows working partners to fund non-earning spouses' accounts, avoiding gaps.",
                "What might go wrong: Early retirement withdrawals trigger hefty tax penalties and permanent loss of compounding.",
                "What might go wrong: Speculative high-volatility assets risk total loss during a period with no primary income."
            ]
        },
        {
            lessonId: "WHAT_IF_1",
            scenario: "WHAT IF you accept a job offer with a 20% higher base salary, but no company 401(k) match program? What should you evaluate?",
            correctIndex: 1,
            options: [
                "The match loss does not matter because base salary is higher.",
                "Calculate total compensation: Ensure salary gain exceeds lost employer matching funds and extra tax benefits.",
                "Refuse the job offer immediately.",
                "Assume the new employer will add a retirement match next year."
            ],
            explanations: [
                "What might go wrong: Ignoring benefit matches might leave your net total compensation lower overall.",
                "Great choice! Total compensation includes base salary + matches + health benefits. Always evaluate the full picture.",
                "What might go wrong: Turning down a job without doing the math could mean missing a net financial gain.",
                "What might go wrong: Financial planning shouldn't rely on unpromised future corporate benefits."
            ]
        },
        {
            lessonId: "WHAT_IF_2",
            scenario: "WHAT IF the stock market drops 25% right after you start investing in broad index funds? What is the best strategy?",
            correctIndex: 1,
            options: [
                "Sell all holdings immediately to preserve remaining cash.",
                "Maintain recurring contributions—market drops allow buying fund shares at lower prices.",
                "Stop checking account balances for 10 years without contributing.",
                "Move all investments into single high-volatility individual stocks."
            ],
            explanations: [
                "What might go wrong: Selling during a market dip locks in paper losses permanently.",
                "Great choice! Staying continuous captures market recovery and lowers your average purchase price per share.",
                "What might go wrong: Stopping contributions forfeits buying opportunities when prices are low.",
                "What might go wrong: Concentrating into single stocks increases risk significantly during broad market downturns."
            ]
        },
        {
            lessonId: "WHAT_IF_3",
            scenario: "WHAT IF you receive an unexpected $5,000 annual bonus? What prevents lifestyle inflation?",
            correctIndex: 1,
            options: [
                "Upgrade daily spending to match your new higher baseline income.",
                "Automate 50%+ of the bonus immediately toward savings/debt goals before spending.",
                "Leave it in your primary checking account indefinitely.",
                "Lend the full amount to friends or acquaintances."
            ],
            explanations: [
                "What might go wrong: Permanently raising daily expenses eats away the bonus without building long-term wealth.",
                "Great choice! Directing windfall money straight into wealth accounts secures real progress before lifestyle creep sets in.",
                "What might go wrong: Leaving excess money in daily checking leads to unmonitored routine spending.",
                "What might go wrong: Unstructured personal loans often result in uncollected funds and strained relationships."
            ]
        },
        {
            lessonId: "WHAT_IF_4",
            scenario: "WHAT IF inflation rises to 7% while your savings account pays 0.5% interest? What should you do with excess cash beyond emergency savings?",
            correctIndex: 1,
            options: [
                "Keep all long-term savings in checking so cash is instantly accessible.",
                "Move long-term funds into low-cost index funds or high-yield vehicles to outpace inflation.",
                "Buy luxury assets expecting their value to double rapidly.",
                "Stop saving money entirely since inflation diminishes purchasing power."
            ],
            explanations: [
                "What might go wrong: Keeping cash in low-interest accounts causes purchasing power to decline every year.",
                "Great choice! Broad index funds historically generate returns that comfortably beat average inflation rates.",
                "What might go wrong: Consumer luxury items depreciate quickly and rarely protect against inflation.",
                "What might go wrong: Ceasing savings stops compounding completely and ruins long-term stability."
            ]
        },
        {
            lessonId: "WHAT_IF_5",
            scenario: "WHAT IF your laptop breaks down unexpectedly and costs $1,200 to replace, but you only have $800 in your emergency fund?",
            correctIndex: 1,
            options: [
                "Use a high-interest payday loan to cover the full $1,200 immediately.",
                "Use the $800 cash buffer, trim discretionary wants this month, or look for a refurbished model.",
                "Ignore the expense and stop working until you save cash from scratch.",
                "Apply for 3 new credit cards at once to maximize credit access."
            ],
            explanations: [
                "What might go wrong: Payday loans carry predatory 300%+ interest rates that lead to severe debt spirals.",
                "Great choice! Combining existing emergency funds with temporary spending trims prevents toxic high-interest debt.",
                "What might go wrong: Pausing work interrupts income generation and worsens financial strain.",
                "What might go wrong: Opening multiple credit lines harms credit scores and encourages overspending."
            ]
        },
        {
            lessonId: "WHAT_IF_6",
            scenario: "WHAT IF you want to subscribe to 4 different streaming platforms costing $70/month total? What is the smartest approach?",
            correctIndex: 1,
            options: [
                "Subscribe to all 4 permanently and ignore the monthly charge.",
                "Rotate subscriptions: Keep 1 active service at a time and swap when you finish watching.",
                "Put all subscriptions on a credit card and pay only minimum monthly balances.",
                "Cancel internet access entirely to save money for streaming."
            ],
            explanations: [
                "What might go wrong: Recurring minor subscriptions create silent leaks that accumulate to $800+ per year.",
                "Great choice! Subscription rotation gives access to all content without compounding monthly fixed costs.",
                "What might go wrong: Paying minimum balances on recurring expenses incurs heavy interest charges.",
                "What might go wrong: Canceling essential utilities creates unnecessary operational disruptions."
            ]
        }
    ];

    // --- Helper function to shuffle options while preserving explanation links ---
    function shuffleQuestion(q) {
        let combined = q.options.map((opt, i) => ({
            option: opt,
            explanation: q.explanations[i],
            isCorrect: i === q.correctIndex
        }));

        // Fisher-Yates Shuffle for option order
        for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        return {
            scenario: q.scenario,
            options: combined.map(item => item.option),
            explanations: combined.map(item => item.explanation),
            correctIndex: combined.findIndex(item => item.isCorrect)
        };
    }

    // --- Initialization ---
    function init() {
        try {
            const rawData = localStorage.getItem('hw_completed_lessons');
            completedLessonIds = rawData ? JSON.parse(rawData) : [];
        } catch (e) {
            completedLessonIds = [];
        }

        const count = completedLessonIds.length || 5;
        if (topicCountSpan) topicCountSpan.textContent = count;
        if (loadingTopicCountSpan) loadingTopicCountSpan.textContent = count;

        showState(startState);
    }

    function showState(targetState) {
        [startState, loadingState, questionState, completedState].forEach(el => {
            if (el) el.classList.add('hidden');
        });
        if (targetState) targetState.classList.remove('hidden');
    }

    function startQuiz() {
        showState(loadingState);

        // Filter matched lesson questions + situational questions
        let pool = rawQuestionBank.filter(q => 
            typeof q.lessonId === 'string' || completedLessonIds.includes(q.lessonId)
        );

        if (pool.length < 7) {
            pool = [...rawQuestionBank];
        }

        // Shuffle master pool to pick 7 unique questions every time
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // Take exactly 7 questions and shuffle option order for each
        activeQuestions = pool.slice(0, 7).map(q => shuffleQuestion(q));

        currentQuestionIndex = 0;
        score = 0;

        setTimeout(() => {
            showState(questionState);
            renderQuestion();
        }, 600);
    }

    function renderQuestion() {
        selectedOptionIndex = null;
        explanationBox.classList.add('hidden');
        optionsContainer.innerHTML = '';

        const q = activeQuestions[currentQuestionIndex];
        currentQNum.textContent = currentQuestionIndex + 1;
        totalQNum.textContent = activeQuestions.length; // Always 7
        questionText.textContent = q.scenario;

        q.options.forEach((optText, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = optText;
            btn.addEventListener('click', () => handleOptionClick(idx));
            optionsContainer.appendChild(btn);
        });
    }

    function handleOptionClick(index) {
        if (selectedOptionIndex !== null) return;

        selectedOptionIndex = index;
        const q = activeQuestions[currentQuestionIndex];
        const buttons = optionsContainer.querySelectorAll('.option-btn');

        buttons.forEach((btn, idx) => {
            btn.disabled = true;

            // 1. Highlight Correct Answer Green
            if (idx === q.correctIndex) {
                btn.classList.add('correct');
                btn.style.backgroundColor = '#E8F5E9';
                btn.style.borderColor = '#2E6F40';
                btn.style.color = '#1B5E20';
            }

            // 2. Highlight Pressed Wrong Option Red
            if (idx === index && index !== q.correctIndex) {
                btn.classList.add('incorrect');
                btn.style.backgroundColor = '#FFEBEE';
                btn.style.borderColor = '#9A2B2B';
                btn.style.color = '#7F1D1D';
            }
        });

        if (index === q.correctIndex) {
            score++;
        }

        explanationText.textContent = q.explanations[index];
        explanationBox.classList.remove('hidden');
    }

    function handleNext() {
        if (currentQuestionIndex < activeQuestions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        } else {
            finalScore.textContent = score;
            finalTotal.textContent = activeQuestions.length;
            showState(completedState);
        }
    }

    if (startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
    if (restartQuizBtn) restartQuizBtn.addEventListener('click', startQuiz);
    if (nextBtn) nextBtn.addEventListener('click', handleNext);

    init();
});