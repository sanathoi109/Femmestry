/**
 * swipe.js
 * --------
 * Powers the Tinder-style "Swipe & Learn" flashcard engine.
 *   - Drag (mouse or touch) left/right to answer Skip/Risk vs Save/Invest.
 *   - Tap the card (without dragging) to flip it and reveal the
 *     1-sentence explanation.
 *   - After each swipe, a 1-question instant check appears.
 *   - A Teach-Back box lets the user explain the concept in their own
 *     words and get keyword-based feedback from /api/teach-back.
 */
(function () {
  const deckPicker = document.getElementById('deck-picker');
  const session = document.getElementById('swipe-session');
  const stage = document.getElementById('swipe-stage');
  const completeScreen = document.getElementById('deck-complete');
  const progressLabel = document.getElementById('progress-label');
  const quizBox = document.getElementById('quiz-box');
  const teachBackBox = document.querySelector('.teach-back-box');

  let cards = [];
  let index = 0;
  let currentCardEl = null;
  let dragging = false;
  let startX = 0;
  let currentX = 0;
  let hasDraggedPastThreshold = false;

  document.querySelectorAll('.deck-card').forEach(el => {
    el.addEventListener('click', () => loadDeck(el.dataset.slug));
  });

  document.getElementById('back-to-decks').addEventListener('click', showDeckPicker);
  document.getElementById('complete-back').addEventListener('click', showDeckPicker);

  function showDeckPicker() {
    deckPicker.style.display = 'block';
    session.style.display = 'none';
    completeScreen.style.display = 'none';
  }

  async function loadDeck(slug) {
    const res = await fetch(`/api/decks/${slug}/cards`);
    const data = await res.json();
    cards = data.cards;
    index = 0;
    deckPicker.style.display = 'none';
    completeScreen.style.display = 'none';
    session.style.display = 'block';
    renderCurrentCard();
  }

  function renderCurrentCard() {
    quizBox.style.display = 'none';
    teachBackBox.style.display = 'none';
    document.getElementById('tb-feedback').style.display = 'none';
    document.getElementById('teach-back-input').value = '';

    if (index >= cards.length) {
      session.style.display = 'none';
      completeScreen.style.display = 'block';
      return;
    }
    progressLabel.textContent = `Card ${index + 1} of ${cards.length}`;
    const card = cards[index];

    stage.innerHTML = `
      <div class="swipe-card" id="active-card">
        <span class="swipe-badge save">SAVE / INVEST</span>
        <span class="swipe-badge skip">SKIP / RISK</span>
        <div class="front-face">
          <div class="front-text">${escapeHtml(card.front_text)}</div>
          <div class="hint">Tap to flip · drag to answer</div>
        </div>
        <div class="flip-face">
          <p style="font-size:.95rem; line-height:1.5;">${escapeHtml(card.explanation)}</p>
        </div>
      </div>
    `;
    currentCardEl = document.getElementById('active-card');
    attachGestureHandlers(currentCardEl, card);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function attachGestureHandlers(el, card) {
    let flipped = false;

    function onDown(clientX) {
      dragging = true;
      hasDraggedPastThreshold = false;
      startX = clientX;
      currentX = clientX;
      el.style.transition = 'none';
    }
    function onMove(clientX) {
      if (!dragging) return;
      currentX = clientX;
      const dx = currentX - startX;
      if (Math.abs(dx) > 8) hasDraggedPastThreshold = true;
      const rotate = dx / 14;
      el.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
      const saveBadge = el.querySelector('.swipe-badge.save');
      const skipBadge = el.querySelector('.swipe-badge.skip');
      saveBadge.style.opacity = Math.max(0, dx / 100);
      skipBadge.style.opacity = Math.max(0, -dx / 100);
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      el.style.transition = 'transform .25s ease';
      const dx = currentX - startX;

      if (Math.abs(dx) > 90) {
        const direction = dx > 0 ? 'right' : 'left';
        el.style.transform = `translateX(${dx > 0 ? 600 : -600}px) rotate(${dx > 0 ? 30 : -30}deg)`;
        el.style.opacity = '0';
        setTimeout(() => handleSwipe(card, direction), 200);
      } else {
        el.style.transform = 'translateX(0) rotate(0)';
        el.querySelector('.swipe-badge.save').style.opacity = 0;
        el.querySelector('.swipe-badge.skip').style.opacity = 0;
        if (!hasDraggedPastThreshold) {
          flipped = !flipped;
          el.classList.toggle('flipped', flipped);
        }
      }
    }

    el.addEventListener('mousedown', (e) => onDown(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onUp);

    el.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchend', onUp);
  }

  // Manual buttons mirror drag gestures for accessibility / no-touch use.
  document.getElementById('fab-left').addEventListener('click', () => triggerSwipe('left'));
  document.getElementById('fab-right').addEventListener('click', () => triggerSwipe('right'));
  document.getElementById('fab-flip').addEventListener('click', () => {
    if (currentCardEl) currentCardEl.classList.toggle('flipped');
  });

  function triggerSwipe(direction) {
    if (!currentCardEl || index >= cards.length) return;
    const card = cards[index];
    currentCardEl.style.transition = 'transform .25s ease';
    currentCardEl.style.transform = `translateX(${direction === 'right' ? 600 : -600}px) rotate(${direction === 'right' ? 30 : -30}deg)`;
    currentCardEl.style.opacity = '0';
    setTimeout(() => handleSwipe(card, direction), 200);
  }

  async function handleSwipe(card, direction) {
    const res = await fetch(`/api/cards/${card.id}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swipe: direction, quiz_answer: '' }),
    });
    // We don't grade the quiz yet - show it now as the instant check.
    showQuiz(card);
  }

  function showQuiz(card) {
    quizBox.style.display = 'block';
    teachBackBox.style.display = 'block';
    document.getElementById('quiz-question').textContent = card.quiz_question;
    const optionsEl = document.getElementById('quiz-options');
    optionsEl.innerHTML = '';
    card.quiz_options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt.trim();
      btn.addEventListener('click', () => gradeQuiz(card, opt.trim(), btn, optionsEl));
      optionsEl.appendChild(btn);
    });

    document.getElementById('teach-back-submit').onclick = () => submitTeachBack(card);
  }

  async function gradeQuiz(card, chosen, btnEl, optionsEl) {
    await fetch(`/api/cards/${card.id}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swipe: 'right', quiz_answer: chosen }),
    });
    const correct = chosen === card.quiz_answer;
    optionsEl.querySelectorAll('.quiz-option').forEach(b => {
      b.disabled = true;
      if (b.textContent === card.quiz_answer) b.classList.add('correct');
      else if (b === btnEl) b.classList.add('wrong');
    });
    setTimeout(() => { index++; renderCurrentCard(); }, 1100);
  }

  async function submitTeachBack(card) {
    const answer = document.getElementById('teach-back-input').value.trim();
    if (!answer) return;
    const res = await fetch('/api/teach-back', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, answer }),
    });
    const data = await res.json();
    const box = document.getElementById('tb-feedback');
    box.className = `tb-feedback ${data.level}`;
    box.textContent = data.feedback;
    box.style.display = 'block';
  }
})();