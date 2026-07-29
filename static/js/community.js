/**
 * community.js
 * ------------
 * Handles posting new anonymous questions and upvoting existing ones
 * without a page reload. All rendering uses textContent (never
 * innerHTML with user input) to prevent XSS from post bodies.
 */
(function () {
  const postBtn = document.getElementById('post-btn');
  const input = document.getElementById('new-post');
  const list = document.getElementById('posts-list');

  postBtn.addEventListener('click', async () => {
    const body = input.value.trim();
    if (!body) return;
    const res = await fetch('/api/community/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }),
    });
    if (!res.ok) return;
    const data = await res.json();

    const card = document.createElement('div');
    card.className = 'card post-card';
    card.dataset.id = data.id;

    const meta = document.createElement('div');
    meta.className = 'post-meta';
    const label = document.createElement('span');
    label.textContent = data.anon_label;
    const time = document.createElement('span');
    time.textContent = 'Just now';
    meta.appendChild(label);
    meta.appendChild(time);

    const bodyEl = document.createElement('p');
    bodyEl.textContent = data.body; // textContent - never trust HTML from user input

    const upvoteBtn = document.createElement('button');
    upvoteBtn.className = 'upvote-btn';
    upvoteBtn.dataset.id = data.id;
    upvoteBtn.innerHTML = '▲ <span class="upvote-count">0</span>';
    upvoteBtn.addEventListener('click', () => handleUpvote(upvoteBtn));

    card.appendChild(meta);
    card.appendChild(bodyEl);
    card.appendChild(upvoteBtn);
    list.prepend(card);
    input.value = '';
  });

  document.querySelectorAll('.upvote-btn').forEach(btn => {
    btn.addEventListener('click', () => handleUpvote(btn));
  });

  async function handleUpvote(btn) {
    const id = btn.dataset.id;
    const res = await fetch(`/api/community/posts/${id}/upvote`, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    btn.querySelector('.upvote-count').textContent = data.upvotes;
  }
})();