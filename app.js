// ===== STATE =====
let direction = 'singlish-to-english';

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('user-input');
  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    document.getElementById('char-count').textContent = `${len} / 2000`;
    if (len > 2000) textarea.value = textarea.value.slice(0, 2000);
  });
});

// ===== DIRECTION =====
function setDirection(dir) {
  direction = dir;

  const btnEn = document.getElementById('btn-to-english');
  const btnSg = document.getElementById('btn-to-singlish');
  const inputLabel = document.getElementById('input-label');
  const textarea = document.getElementById('user-input');
  const examplesGrid = document.getElementById('examples-grid');

  if (dir === 'singlish-to-english') {
    btnEn.classList.add('active');
    btnSg.classList.remove('active');
    inputLabel.textContent = 'Enter Singlish';
    textarea.placeholder = 'e.g. Wah lau, this project damn jialat sia...';
    examplesGrid.innerHTML = `
      <button class="example-pill" onclick="useExample(this)">Wah, this one very shiok leh!</button>
      <button class="example-pill" onclick="useExample(this)">You think I don't know meh?</button>
      <button class="example-pill" onclick="useExample(this)">Aiyah, can lah, don't worry so much.</button>
      <button class="example-pill" onclick="useExample(this)">Rabak sia, the whole project jialat already.</button>
      <button class="example-pill" onclick="useExample(this)">Eh, later we go makan where?</button>
      <button class="example-pill" onclick="useExample(this)">Confirm plus chop he never study one.</button>
    `;
  } else {
    btnSg.classList.add('active');
    btnEn.classList.remove('active');
    inputLabel.textContent = 'Enter Standard English';
    textarea.placeholder = 'e.g. This situation is really messy and out of control.';
    examplesGrid.innerHTML = `
      <button class="example-pill" onclick="useExample(this)">Let's go eat later.</button>
      <button class="example-pill" onclick="useExample(this)">I'm absolutely certain he didn't study.</button>
      <button class="example-pill" onclick="useExample(this)">Don't worry, it'll be fine.</button>
      <button class="example-pill" onclick="useExample(this)">This is really delicious!</button>
      <button class="example-pill" onclick="useExample(this)">Are you serious right now?</button>
      <button class="example-pill" onclick="useExample(this)">I'm very tired today.</button>
    `;
  }

  resetOutput();
}

// ===== EXAMPLES =====
function useExample(btn) {
  const textarea = document.getElementById('user-input');
  textarea.value = btn.textContent;
  textarea.dispatchEvent(new Event('input'));
  translate();
}

// ===== AUTO RESIZE =====
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.max(120, el.scrollHeight) + 'px';
}

// ===== RESET OUTPUT =====
function resetOutput() {
  const outputBox = document.getElementById('output-box');
  const glossaryStrip = document.getElementById('glossary-strip');
  outputBox.innerHTML = '<p class="output-placeholder">Your translation will appear here.</p>';
  glossaryStrip.style.display = 'none';
}

// ===== TRANSLATE =====
async function translate() {
  const input = document.getElementById('user-input').value.trim();
  if (!input) return;

  const btn = document.getElementById('translate-btn');
  const outputBox = document.getElementById('output-box');
  const outputLabel = document.getElementById('output-label');
  const glossaryStrip = document.getElementById('glossary-strip');

  btn.classList.add('loading');
  btn.querySelector('.btn-text').textContent = 'Translating';
  btn.querySelector('.btn-icon').textContent = '';
  outputBox.innerHTML = '<p class="output-placeholder">Thinking…</p>';
  glossaryStrip.style.display = 'none';

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, direction })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error');
    }

    outputLabel.textContent = direction === 'singlish-to-english'
      ? 'English Translation'
      : 'Singlish Version';

    outputBox.textContent = data.translation || data.output || '';

    if (data.glossary && data.glossary.length > 0) {
      const tagsContainer = document.getElementById('glossary-tags');
      tagsContainer.innerHTML = data.glossary.map(item =>
        `<span class="glossary-tag"><strong>${item.term}</strong> — ${item.meaning}</span>`
      ).join('');
      glossaryStrip.style.display = 'flex';
    }

  } catch (err) {
    outputBox.innerHTML = `<p style="color: var(--accent);">Error: ${err.message}</p>`;
  } finally {
    btn.classList.remove('loading');
    btn.querySelector('.btn-text').textContent = 'Translate';
    btn.querySelector('.btn-icon').textContent = '→';
  }
}

// ===== COPY =====
function copyOutput() {
  const text = document.getElementById('output-box').textContent;
  if (!text || text === 'Your translation will appear here.') return;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 15 4 10"/></svg> Copied`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2v1"/></svg> Copy`;
    }, 2000);
  });
}

// ===== ENTER KEY =====
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') translate();
});
