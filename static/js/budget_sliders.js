 /**
 * budget-sliders.js
 * ------------------
 * Three linked sliders (Needs / Wants / Savings) that always sum to
 * 100%: moving one slider proportionally redistributes the remaining
 * two, and the Safety Shield gauge recomputes instantly on every drag
 * using the same heuristic as the backend (mirrored client-side for
 * a lag-free feel, then persisted server-side on Save).
 */
(function () {
  const needs = document.getElementById('needs');
  const wants = document.getElementById('wants');
  const savings = document.getElementById('savings');
  const needsVal = document.getElementById('needs-value');
  const wantsVal = document.getElementById('wants-value');
  const savingsVal = document.getElementById('savings-value');
  const totalNote = document.getElementById('total-note');
  const shieldCopy = document.getElementById('shield-copy');

  function safetyScore(n, w, s) {
    const score = (s * 2.2) + Math.max(0, (60 - n)) * 0.4;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function shieldMessage(score) {
    if (score >= 70) return "Strong cushion — you're well protected against surprises.";
    if (score >= 40) return "Decent balance — consider nudging savings up a little.";
    return "Thin safety net — try trimming wants to grow your savings share.";
  }

  // When one slider moves, redistribute the delta across the other two
  // proportionally so all three always sum to 100.
  function rebalance(changed) {
    let n = parseFloat(needs.value), w = parseFloat(wants.value), s = parseFloat(savings.value);
    const total = n + w + s;
    const diff = 100 - total;

    if (Math.abs(diff) > 0.01) {
      const others = ['needs', 'wants', 'savings'].filter(id => id !== changed);
      const otherEls = { needs, wants, savings };
      const otherTotal = others.reduce((sum, id) => sum + parseFloat(otherEls[id].value), 0) || 1;
      others.forEach(id => {
        const el = otherEls[id];
        const share = parseFloat(el.value) / otherTotal;
        el.value = Math.max(0, Math.min(100, parseFloat(el.value) + diff * share)).toFixed(0);
      });
    }
    n = parseFloat(needs.value); w = parseFloat(wants.value); s = parseFloat(savings.value);
    needsVal.textContent = Math.round(n) + '%';
    wantsVal.textContent = Math.round(w) + '%';
    savingsVal.textContent = Math.round(s) + '%';
    totalNote.textContent = `Total: ${Math.round(n + w + s)}%`;

    const score = safetyScore(n, w, s);
    renderShieldGauge(document.getElementById('budget-shield'), score);
    shieldCopy.textContent = shieldMessage(score);
  }

  needs.addEventListener('input', () => rebalance('needs'));
  wants.addEventListener('input', () => rebalance('wants'));
  savings.addEventListener('input', () => rebalance('savings'));

  document.getElementById('save-budget').addEventListener('click', async () => {
    const payload = {
      needs: parseFloat(needs.value), wants: parseFloat(wants.value), savings: parseFloat(savings.value),
    };
    const res = await fetch('/api/budget', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      const btn = document.getElementById('save-budget');
      const original = btn.textContent;
      btn.textContent = 'Saved ✓';
      setTimeout(() => (btn.textContent = original), 1500);
    }
  });

  rebalance('needs'); // initial render
})();