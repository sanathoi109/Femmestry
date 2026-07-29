/**
 * tools.js
 * --------
 * Wires the Life-Stage Gap engine and Impulse Purchase Neutralizer
 * forms to their backend endpoints.
 */
(function () {
  function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

  document.getElementById('lg-calc').addEventListener('click', async () => {
    const payload = {
      monthly_savings: parseFloat(document.getElementById('lg-savings').value || 0),
      annual_rate_pct: parseFloat(document.getElementById('lg-rate').value || 10),
      years: parseInt(document.getElementById('lg-years').value || 10),
      career_break_months: parseInt(document.getElementById('lg-break').value || 0),
    };
    const res = await fetch('/api/calc/life-gap', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    document.getElementById('lg-final').textContent = fmt(data.final_value);
    document.getElementById('lg-gap').textContent = fmt(data.gap_cost);
    document.getElementById('lg-copy').textContent =
      `A ${payload.career_break_months}-month break pauses contributions for that stretch, but compounding keeps working on what you've already saved.`;
    document.getElementById('lg-result').style.display = 'block';
  });

  document.getElementById('ip-calc').addEventListener('click', async () => {
    const payload = {
      item_cost: parseFloat(document.getElementById('ip-cost').value || 0),
      hourly_wage: parseFloat(document.getElementById('ip-wage').value || 0),
      years: parseInt(document.getElementById('ip-years').value || 5),
    };
    const res = await fetch('/api/calc/impulse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    document.getElementById('ip-hours').textContent = data.hours_of_work != null ? data.hours_of_work + ' hrs' : '—';
    document.getElementById('ip-fv').textContent = fmt(data.future_value_if_invested);
    document.getElementById('ip-result').style.display = 'block';
  });
})();