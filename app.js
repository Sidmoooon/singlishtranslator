// ===== STATE =====
let direction = 'singlish-to-english';
const startTime = Date.now();

// ===== TRACKING =====
const tracking = {
  variant: 'A',
  translationCount: 0,
  modeUsed: null,
  copyClicked: false,
  timeOnPage: 0
};

function logEvent(event, detail = {}) {
  console.log('[LAH-TRACKING]', JSON.stringify({ event, ...detail, variant: 'A', timestamp: Date.now() }));
}

// ===== EXAMPLES =====
const EXAMPLES = {
  'singlish-to-english': [
    'Wah, this one very shiok leh!',
    "You think I don't know meh?",
    "Aiyah, can lah, don't worry so much.",
    'Rabak sia, the whole project jialat already.',
    'Eh, later we go makan where?',
    'Confirm plus chop he never study one.'
  ],
  'english-to-singlish': [
    "Let's go eat later.",
    "I'm absolutely certain he didn't study.",
    "Don't worry, it'll be fine.",
    'This is really delicious!',
    'Are you serious right now?',
    "I'm very tired today."
  ]
};

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('user-input').addEventListener('input', function() {
    const len = this.value.length;
    document.getElementById('char-count').textContent = `${len} / 2000`;
    if (len > 2000) this.value = this.value.slice(0, 2000);
  });

  document.getElementById('translate-btn').addEventListener('click', () => runTranslate());
  document.getElementById('copy-btn').addEventListener('click', () => copyOutput());
  document.getElementById('btn-to-english').addEventListener('click', () => setDirection('singlish-to-english'));
  document.getElementById('btn-to-singlish').addEventListener('click', () => setDirection('english-to-singlish'));

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runTranslate();
  });

  window.addEventListener('beforeunload', () => {
    tracking.timeOnPage = Math.round((Date.now() - startTime) / 1000);
    logEvent('session_end', { ...tracking });
  });

  loadExamples();
  logEvent('page_load', { variant: 'A' });
});

// ===== EXAMPLES =====
function loadExamples() {
  const grid = document.getElementById('examples-grid');
  grid.innerHTML = EXAMPLES[direction].map(text =>
    `<button class="example-pill">${text}</button>`
  ).join('');
  grid.querySelectorAll('.example-pill').forEach(btn => {
    btn.addEventListener('click', function() {
      document.getElementById('user-input').value = this.textContent;
      document.getElementById('char-count').textContent = `${this.textContent.length} / 2000`;
      runTranslate();
    });
  });
}

// ===== DIRECTION =====
function setDirection(dir) {
  direction = dir;
  document.getElementById('btn-to-english').classList.toggle('active', dir === 'singlish-to-english');
  document.getElementById('btn-to-singlish').classList.toggle('active', dir === 'english-to-singlish');
  document.getElementById('input-label').textContent = dir === 'singlish-to-english' ? 'Enter Singlish' : 'Enter Standard English';
  document.getElementById('user-input').placeholder = dir === 'singlish-to-english'
    ? 'e.g. Wah lau, this project damn jialat sia...'
    : 'e.g. This situation is really messy and out of control.';
  resetOutput();
  loadExamples();
}

// ===== RESET OUTPUT =====
function resetOutput() {
  document.getElementById('output-box').innerHTML = '<p class="output-placeholder">Your translation will appear here.</p>';
  document.getElementById('glossary-strip').style.display = 'none';
}

// ===== TRANSLATE =====
async function runTranslate() {
  const input = document.getElementById('user-input').value.trim();
  if (!input) return;

  tracking.translationCount++;
  tracking.modeUsed = 'untracked';
  logEvent('translate_clicked', { translationCount: tracking.translationCount });

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
    if (!response.ok) throw new Error(data.error || 'Server error');

    outputLabel.textContent = direction === 'singlish-to-english' ? 'English Translation' : 'Singlish Version';
    outputBox.textContent = data.translation || data.output || '';

    if (data.glossary && data.glossary.length > 0) {
      document.getElementById('glossary-tags').innerHTML = data.glossary.map(item =>
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
  tracking.copyClicked = true;
  logEvent('copy_clicked', { translationCount: tracking.translationCount });
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
