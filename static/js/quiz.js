document.addEventListener("DOMContentLoaded", () => {
    const startState = document.getElementById("startState");
    const loadingState = document.getElementById("loadingState");
    const questionState = document.getElementById("questionState");
    const completedState = document.getElementById("completedState");

    const startQuizBtn = document.getElementById("startQuizBtn");
    const restartQuizBtn = document.getElementById("restartQuizBtn");
    const nextBtn = document.getElementById("nextBtn");

    const currentQNum = document.getElementById("currentQNum");
    const totalQNum = document.getElementById("totalQNum");
    const questionText = document.getElementById("questionText");
    const optionsContainer = document.getElementById("optionsContainer");
    const explanationBox = document.getElementById("explanationBox");
    const explanationText = document.getElementById("explanationText");

    let questions = [];
    let currentIdx = 0;
    let score = 0;

    startQuizBtn.addEventListener("click", () => {
        startState.classList.add("hidden");
        loadingState.classList.remove("hidden");

        fetch("/api/quiz/questions")
            .then(res => res.json())
            .then(data => {
                setTimeout(() => {
                    questions = data.questions;
                    currentIdx = 0;
                    score = 0;
                    loadingState.classList.add("hidden");
                    questionState.classList.remove("hidden");
                    loadQuestion();
                }, 1200);
            });
    });

    function loadQuestion() {
        explanationBox.classList.add("hidden");
        optionsContainer.innerHTML = "";

        const q = questions[currentIdx];
        currentQNum.innerText = currentIdx + 1;
        totalQNum.innerText = questions.length;
        questionText.innerText = q.question;

        // Dynamic button text: "See result" on final question, "Next" otherwise
        if (currentIdx === questions.length - 1) {
            nextBtn.innerText = "See result";
        } else {
            nextBtn.innerText = "Next";
        }

        q.options.forEach((optText, index) => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerHTML = `<span class="icon-placeholder"></span> <span>${optText}</span>`;
            btn.addEventListener("click", () => handleOptionClick(index, q.correct, q.explanation));
            optionsContainer.appendChild(btn);
        });
    }

    function handleOptionClick(selectedIndex, correctIndex, explanation) {
        const optionBtns = optionsContainer.querySelectorAll(".option-btn");
        
        optionBtns.forEach(btn => btn.classList.add("disabled"));

        if (selectedIndex === correctIndex) {
            score++;
            optionBtns[selectedIndex].classList.add("correct");
            optionBtns[selectedIndex].querySelector(".icon-placeholder").innerHTML = `<span class="icon">✓</span>`;
        } else {
            optionBtns[selectedIndex].classList.add("wrong");
            optionBtns[selectedIndex].querySelector(".icon-placeholder").innerHTML = `<span class="icon">✕</span>`;
            
            optionBtns[correctIndex].classList.add("correct");
            optionBtns[correctIndex].querySelector(".icon-placeholder").innerHTML = `<span class="icon">✓</span>`;
        }

        explanationText.innerText = explanation;
        explanationBox.classList.remove("hidden");
    }

    nextBtn.addEventListener("click", () => {
        currentIdx++;
        if (currentIdx < questions.length) {
            loadQuestion();
        } else {
            questionState.classList.add("hidden");
            completedState.classList.remove("hidden");
            document.getElementById("finalScore").innerText = score;
            document.getElementById("finalTotal").innerText = questions.length;
        }
    });

    if (restartQuizBtn) {
        restartQuizBtn.addEventListener("click", () => {
            completedState.classList.add("hidden");
            startState.classList.remove("hidden");
        });
    }
});