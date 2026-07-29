// static/js/play.js

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // GAME 1: MATCH THE MEANING
    // -------------------------------------------------------------
    const cardPool = [
        { term: "NEFT", def: "Batch bank transfer" },
        { term: "RTGS", def: "Large-value, real-time transfer" },
        { term: "IMPS", def: "24x7 instant transfer" },
        { term: "UPI", def: "Instant phone-to-phone payments" },
        { term: "Stock", def: "A slice of a company" },
        { term: "SIP", def: "Investing a fixed amount on schedule" },
        { term: "Bond", def: "Lending money for fixed interest" },
        { term: "Mutual Fund", def: "A shared basket managed for you" }
    ];

    const termsCol = document.getElementById('terms-column');
    const defsCol = document.getElementById('definitions-column');
    const refreshBtn = document.getElementById('refresh-match-btn');

    let selectedTerm = null;
    let selectedDef = null;

    function shuffleArray(array) {
        return [...array].sort(() => Math.random() - 0.5);
    }

    function initMatchingGame() {
        termsCol.innerHTML = '';
        defsCol.innerHTML = '';
        selectedTerm = null;
        selectedDef = null;

        // Pick 5 random items
        const selectedPairs = shuffleArray(cardPool).slice(0, 5);
        const shuffledDefs = shuffleArray(selectedPairs);

        selectedPairs.forEach(pair => {
            const termEl = document.createElement('div');
            termEl.className = 'match-item term';
            termEl.textContent = pair.term;
            termEl.dataset.matchKey = pair.term;
            termEl.addEventListener('click', () => handleSelectTerm(termEl));
            termsCol.appendChild(termEl);
        });

        shuffledDefs.forEach(pair => {
            const defEl = document.createElement('div');
            defEl.className = 'match-item definition';
            defEl.textContent = pair.def;
            defEl.dataset.matchKey = pair.term;
            defEl.addEventListener('click', () => handleSelectDef(defEl));
            defsCol.appendChild(defEl);
        });
    }

    function handleSelectTerm(el) {
        if (el.classList.contains('matched')) return;
        document.querySelectorAll('.term').forEach(t => t.classList.remove('selected'));
        el.classList.add('selected');
        selectedTerm = el;
        checkMatch();
    }

    function handleSelectDef(el) {
        if (el.classList.contains('matched')) return;
        document.querySelectorAll('.definition').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
        selectedDef = el;
        checkMatch();
    }

    function checkMatch() {
        if (selectedTerm && selectedDef) {
            if (selectedTerm.dataset.matchKey === selectedDef.dataset.matchKey) {
                selectedTerm.className = 'match-item term matched';
                selectedDef.className = 'match-item definition matched';
                selectedTerm = null;
                selectedDef = null;
            } else {
                const t = selectedTerm;
                const d = selectedDef;
                t.classList.add('wrong');
                d.classList.add('wrong');
                setTimeout(() => {
                    t.classList.remove('wrong', 'selected');
                    d.classList.remove('wrong', 'selected');
                }, 500);
                selectedTerm = null;
                selectedDef = null;
            }
        }
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', initMatchingGame);
    }

    initMatchingGame();

    // -------------------------------------------------------------
    // GAME 2: SPLIT THE SALARY
    // -------------------------------------------------------------
    const TOTAL_SALARY = 50000;

    const sliderNeeds = document.getElementById('slider-needs');
    const sliderWants = document.getElementById('slider-wants');
    const sliderSavings = document.getElementById('slider-savings');

    const fillNeeds = document.getElementById('fill-needs');
    const fillWants = document.getElementById('fill-wants');
    const fillSavings = document.getElementById('fill-savings');

    const valNeeds = document.getElementById('needs-val');
    const valWants = document.getElementById('wants-val');
    const valSavings = document.getElementById('savings-val');

    const scoreFeedback = document.getElementById('score-feedback');

    function formatRupee(amount) {
        return '₹' + Math.round(amount).toLocaleString('en-IN');
    }

    function updateSalarySplit(activeSlider) {
        let needs = parseInt(sliderNeeds.value);
        let wants = parseInt(sliderWants.value);
        let savings = parseInt(sliderSavings.value);

        // Calculate score comparing against 50% Needs / 30% Wants / 20% Savings benchmark
        let needsDiff = Math.abs(needs - 50);
        let wantsDiff = Math.abs(wants - 30);
        let savingsDiff = Math.abs(savings - 20);
        let totalDiff = needsDiff + wantsDiff + savingsDiff;

        let score = Math.max(0, Math.round(100 - (totalDiff * 0.8)));

        // Text feedback generator based on allocations
        let feedbackText = "";
        if (score >= 85) {
            feedbackText = `Score ${score}/100. Excellent balance! You are following the 50/30/20 guideline closely to build long-term financial security.`;
        } else if (score >= 60) {
            feedbackText = `Score ${score}/100. Workable. The 50/30/20 guide is a starting point, not a rule — adjust for rent-heavy cities.`;
        } else {
            feedbackText = `Score ${score}/100. Highly unbalanced. Consider adjusting allocations so savings stay above 20% and fixed costs don't overwhelm.`;
        }

        // Render UI
        fillNeeds.style.width = `${needs}%`;
        fillWants.style.width = `${wants}%`;
        fillSavings.style.width = `${savings}%`;

        valNeeds.textContent = `${needs}% • ${formatRupee((needs / 100) * TOTAL_SALARY)}`;
        valWants.textContent = `${wants}% • ${formatRupee((wants / 100) * TOTAL_SALARY)}`;
        valSavings.textContent = `${savings}% • ${formatRupee((savings / 100) * TOTAL_SALARY)}`;

        scoreFeedback.textContent = feedbackText;
    }

    [sliderNeeds, sliderWants, sliderSavings].forEach(slider => {
        if (slider) {
            slider.addEventListener('input', (e) => updateSalarySplit(e.target));
        }
    });

    updateSalarySplit();
});