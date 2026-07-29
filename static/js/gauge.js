/**
 * gauge.js
 * --------
 * Renders the "Safety Shield" radial gauge — the platform's signature
 * visual motif. Takes a 0-100 score and draws an SVG arc that fades
 * from coral (red, low safety) through gold to mint (green, high
 * safety), with a shield-shaped inner glyph and the numeric score.
 *
 * Usage: renderShieldGauge(containerEl, score)
 */
function renderShieldGauge(container, score) {
  if (!container) return;
  score = Math.max(0, Math.min(100, score));

  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // We draw a 270-degree arc (leaving a 90-degree gap at the bottom)
  // for a "gauge" feel rather than a full circle.
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const dashOffset = arcLength - (arcLength * score) / 100;

  const color = score >= 70 ? 'var(--mint)' : score >= 40 ? 'var(--gold)' : 'var(--coral)';

  container.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="var(--coral)" />
          <stop offset="50%" stop-color="var(--gold)" />
          <stop offset="100%" stop-color="var(--mint)" />
        </linearGradient>
      </defs>
      <g transform="rotate(135 ${size/2} ${size/2})">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}"
          fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${strokeWidth}"
          stroke-dasharray="${arcLength} ${circumference}" stroke-linecap="round" />
        <circle cx="${size/2}" cy="${size/2}" r="${radius}"
          fill="none" stroke="url(#shieldGrad)" stroke-width="${strokeWidth}"
          stroke-dasharray="${arcLength} ${circumference}"
          stroke-dashoffset="${dashOffset}" stroke-linecap="round"
          style="transition: stroke-dashoffset .6s ease;" />
      </g>
      <text x="50%" y="46%" text-anchor="middle" font-family="Fraunces, serif"
        font-size="42" font-weight="600" fill="${color}">${Math.round(score)}</text>
      <text x="50%" y="60%" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif"
        font-size="11" letter-spacing="2" fill="var(--ink-muted)">SAFETY SCORE</text>
    </svg>
  `;
}