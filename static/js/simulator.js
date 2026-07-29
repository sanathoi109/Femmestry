/**
 * simulator.js
 * ------------
 * Drives the Investment Playground: reads slider values, calls the
 * backend calculators (/api/calc/sip or /api/calc/lumpsum) with a
 * debounce, and renders the year-by-year growth as a Chart.js
 * stacked-area style chart (invested vs. gains).
 */
(function () {
  const amountSlider = document.getElementById('amount-slider');
  const rateSlider = document.getElementById('rate-slider');
  const yearsSlider = document.getElementById('years-slider');
  const amountLabel = document.getElementById('amount-label');
  const amountValue = document.getElementById('amount-value');
  const rateValue = document.getElementById('rate-value');
  const yearsValue = document.getElementById('years-value');
  const modeSipBtn = document.getElementById('mode-sip');
  const modeLumpBtn = document.getElementById('mode-lump');

  let mode = 'sip';
  let debounceTimer = null;
  let chart = null;

  const ctx = document.getElementById('growth-chart');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Amount invested',
          data: [],
          borderColor: '#A79FC2',
          backgroundColor: 'rgba(167,159,194,.08)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Projected value',
          data: [],
          borderColor: '#E8B75D',
          backgroundColor: 'rgba(232,183,93,.18)',
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#F5F1EC' } },
      },
      scales: {
        x: { ticks: { color: '#A79FC2' }, grid: { color: 'rgba(255,255,255,.06)' } },
        y: { ticks: { color: '#A79FC2' }, grid: { color: 'rgba(255,255,255,.06)' } },
      },
    },
  });

  function fmt(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function setMode(newMode) {
    mode = newMode;
    modeSipBtn.style.opacity = mode === 'sip' ? '1' : '.55';
    modeLumpBtn.style.opacity = mode === 'lump' ? '1' : '.55';
    amountLabel.textContent = mode === 'sip' ? 'Monthly investment' : 'One-time (lumpsum) amount';
    amountSlider.max = mode === 'sip' ? 100000 : 2000000;
    amountSlider.step = mode === 'sip' ? 500 : 5000;
    amountSlider.value = mode === 'sip' ? 5000 : 100000;
    recalc();
  }

  modeSipBtn.addEventListener('click', () => setMode('sip'));
  modeLumpBtn.addEventListener('click', () => setMode('lump'));

  [amountSlider, rateSlider, yearsSlider].forEach(el => {
    el.addEventListener('input', () => {
      updateLabels();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(recalc, 150);
    });
  });

  function updateLabels() {
    amountValue.textContent = fmt(amountSlider.value);
    rateValue.textContent = rateSlider.value + '%';
    yearsValue.textContent = yearsSlider.value + (yearsSlider.value == 1 ? ' year' : ' years');
  }

  async function recalc() {
    updateLabels();
    const endpoint = mode === 'sip' ? '/api/calc/sip' : '/api/calc/lumpsum';
    const payload = mode === 'sip'
      ? { monthly_investment: parseFloat(amountSlider.value), annual_rate_pct: parseFloat(rateSlider.value), years: parseInt(yearsSlider.value) }
      : { principal: parseFloat(amountSlider.value), annual_rate_pct: parseFloat(rateSlider.value), years: parseInt(yearsSlider.value) };

    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();

    document.getElementById('total-invested').textContent = fmt(data.total_invested);
    document.getElementById('final-value').textContent = fmt(data.final_value);

    chart.data.labels = data.yearly.map(y => 'Yr ' + y.year);
    chart.data.datasets[0].data = data.yearly.map(y => y.invested);
    chart.data.datasets[1].data = data.yearly.map(y => y.value);
    chart.update();
  }

  updateLabels();
  recalc();
})();
