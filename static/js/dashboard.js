document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // 1. Dynamic Weekday Streak Highlighting
    // ----------------------------------------------------
    // Get current day index from browser: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const todayIndex = new Date().getDay(); 
    const dayBubbles = document.querySelectorAll('.day-bubble');

    dayBubbles.forEach((bubble) => {
        const dayNum = parseInt(bubble.getAttribute('data-day'), 10);
        
        // Highlight active day with the solid white pill style
        if (dayNum === todayIndex) {
            bubble.classList.add('active');
        }
    });

    // ----------------------------------------------------
    // 2. Savings Tracker Logic (Save / Spend Calculations)
    // ----------------------------------------------------
    let balance = 2880;
    const goal = 50000;

    const balanceEl = document.getElementById("currentBalance");
    const progressFill = document.getElementById("progressFill");
    const progressPercent = document.getElementById("progressPercent");
    const remainingEl = document.getElementById("remainingAmount");
    const amountInput = document.getElementById("transAmount");

    function updateTracker() {
        balanceEl.innerText = balance.toLocaleString('en-IN');
        const percentage = Math.min((balance / goal) * 100, 100).toFixed(1);
        const remaining = Math.max(goal - balance, 0);

        progressFill.style.width = `${percentage}%`;
        progressPercent.innerText = `${Math.round(percentage)}%`;
        remainingEl.innerText = remaining.toLocaleString('en-IN');
    }

    // Helper function to format date for the chart (e.g. "29 Jul")
    function getTodayFormatted() {
        const now = new Date();
        const day = now.getDate();
        const month = now.toLocaleString('default', { month: 'short' });
        return `${day} ${month}`;
    }

    // Save Action (+ Balance)
    document.getElementById("btnSave").addEventListener("click", () => {
        const val = parseFloat(amountInput.value);
        if (val && val > 0) {
            balance += val;
            updateTracker();
            addChartData(getTodayFormatted(), balance);
            amountInput.value = "";
        }
    });

    // Spend Action (- Balance)
    document.getElementById("btnSpend").addEventListener("click", () => {
        const val = parseFloat(amountInput.value);
        if (val && val > 0) {
            balance = Math.max(0, balance - val);
            updateTracker();
            addChartData(getTodayFormatted(), balance);
            amountInput.value = "";
        }
    });

    // Toggle Name Button Interaction
    const toggleNameBtn = document.getElementById("toggleNameBtn");
    if (toggleNameBtn) {
        let showingRealName = false;
        toggleNameBtn.addEventListener("click", () => {
            const nameHeading = document.querySelector(".profile-info h2");
            if (!showingRealName) {
                nameHeading.innerText = "User";
                toggleNameBtn.innerText = "👤 Hide my name";
                showingRealName = true;
            } else {
                nameHeading.innerText = "Anonymous Saver";
                toggleNameBtn.innerText = "👤 Show my name";
                showingRealName = false;
            }
        });
    }

    // ----------------------------------------------------
    // 3. Growth Over Time Chart (Chart.js)
    // ----------------------------------------------------
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    // Smooth purple fill gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(108, 92, 231, 0.25)');
    gradient.addColorStop(1, 'rgba(108, 92, 231, 0.0)');

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['28 Jul', '28 Jul', '29 Jul', '29 Jul'],
            datasets: [{
                label: 'Balance',
                data: [0, 1500, 2380, 2880],
                borderColor: '#6c5ce7',
                borderWidth: 3,
                fill: true,
                backgroundColor: gradient,
                tension: 0.1,
                pointBackgroundColor: '#6c5ce7',
                pointRadius: [0, 0, 4, 4]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Balance : ₹${context.parsed.y.toLocaleString('en-IN')}`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#f0f2f8' } }
            }
        }
    });

    function addChartData(label, amount) {
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(amount);
        chart.update();
    }
});