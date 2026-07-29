// static/js/learn.js

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    function updateProgress() {
        const totalCards = document.querySelectorAll('.topic-card').length;
        const learnedCards = document.querySelectorAll('.topic-card .check-circle.active').length;
        
        const activeTab = document.querySelector('.tab-btn.active');
        const categoryName = activeTab ? activeTab.innerText.trim().replace(/^[\s\S]*?\s/, '') : 'this section';

        const percentage = totalCards > 0 ? (learnedCards / totalCards) * 100 : 0;

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${learnedCards} of ${totalCards} learned in ${categoryName}`;
        }
    }

    // Toggle Learned / Unlearned status
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        const card = btn.closest('.topic-card');
        const checkCircle = card.querySelector('.check-circle');

        if (btn.classList.contains('mark-btn')) {
            btn.className = 'action-btn learned-btn';
            btn.innerHTML = 'Learned <i data-feather="check"></i> — tap to unmark';
            if (checkCircle) checkCircle.classList.add('active');
        } else {
            btn.className = 'action-btn mark-btn';
            btn.innerHTML = 'Mark as learned';
            if (checkCircle) checkCircle.classList.remove('active');
        }

        feather.replace();
        updateProgress();
    });

    // Category Tabs Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateProgress();
        });
    });

    // Initial calculation
    updateProgress();
});X    