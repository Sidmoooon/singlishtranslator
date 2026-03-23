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

// ===== API KEY =====
function saveKey() {
  const val = document.getElementById('api-key-input').value.trim();
  if (!val.startsWith('sk-ant-')) {
    alert('That doesn\'t look like a valid Anthropic API key (should start with sk-ant-)');
    return;
  }
  apiKey = val;
  localStorage.setItem('lah_api_key', val);
  document.getElementById('modal-overlay').classList.add('hidden');
}

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

  // Clear output
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

  if (!apiKey) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('translate-btn');
  const outputBox = document.getElementById('output-box');
  const outputLabel = document.getElementById('output-label');
  const glossaryStrip = document.getElementById('glossary-strip');

  btn.classList.add('loading');
  btn.querySelector('.btn-text').textContent = 'Translating';
  btn.querySelector('.btn-icon').textContent = '';

  outputBox.innerHTML = '<p class="output-placeholder" style="animation: pulse 1s ease infinite alternate;">Thinking…</p>';
  glossaryStrip.style.display = 'none';

  const systemPrompt = direction === 'singlish-to-english'
    ? buildSinglishToEnglishPrompt()
    : buildEnglishToSinglishPrompt();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: input }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API error');
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '';

    // Parse structured JSON response
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback: just show raw text
      outputBox.textContent = raw;
      return;
    }

    // Render translation
    outputLabel.textContent = direction === 'singlish-to-english' ? 'English Translation' : 'Singlish Version';
    outputBox.textContent = parsed.translation || parsed.output || '';

    // Render glossary if present
    if (parsed.glossary && parsed.glossary.length > 0) {
      const tagsContainer = document.getElementById('glossary-tags');
      tagsContainer.innerHTML = parsed.glossary.map(item =>
        `<span class="glossary-tag"><strong>${item.term}</strong> — ${item.meaning}</span>`
      ).join('');
      glossaryStrip.style.display = 'flex';
    }

  } catch (err) {
    outputBox.innerHTML = `<p style="color: var(--accent);">Error: ${err.message}. Check your API key and try again.</p>`;
  } finally {
    btn.classList.remove('loading');
    btn.querySelector('.btn-text').textContent = 'Translate';
    btn.querySelector('.btn-icon').textContent = '→';
  }
}

// ===== SYSTEM PROMPTS =====
function buildSinglishToEnglishPrompt() {
  return `You are a Singlish-to-English translator for international students and visitors in Singapore.

Singlish is Singapore's colloquial English — a creole with influences from Malay, Hokkien, Cantonese, Tamil, and British English. It has its own grammar, particles, vocabulary, and rhythm.

COMMON SINGLISH TERMS & PARTICLES (use as reference):
- lah / leh / lor / sia / mah / meh / hor / wah — sentence-final particles expressing tone/emotion
- shiok — extremely enjoyable/satisfying
- jialat — terrible, in a bad state
- kiasu — fear of losing out, overly competitive
- kiasi — afraid of dying, overly cautious
- makan — eat / food (Malay)
- liddat — like that
- walao / wah lau eh — exclamation of disbelief/frustration
- aiyah / aiya — expression of exasperation
- can / cannot — yes/no for ability or permission
- confirm plus chop — absolutely certain
- blur — confused, clueless
- sian — bored, tired, fed up
- atas — high-class, posh (Malay)
- bochap — don't care (Hokkien)
- rabak — messy, chaotic, hopeless
- steady lah — well done, impressive
- alamak — oh no! / expression of surprise
- bojio — didn't invite me (Hokkien)
- chope — to reserve/claim a seat (often with a tissue packet)
- sabo — to sabotage, play a trick on someone
- act blur — to pretend not to know
- on ah / on lah — I'm in, let's do it

INSTRUCTIONS:
- Translate the input into clear, natural Standard English
- Preserve the original meaning, tone, and intent
- For emails or long text: maintain structure and format
- Return ONLY a valid JSON object with this exact structure:
{
  "translation": "The translated text in Standard English",
  "glossary": [
    { "term": "singlish word", "meaning": "its meaning" }
  ]
}
- In the glossary, include up to 5 of the most notable Singlish terms found in the input
- If no notable Singlish terms, set glossary to an empty array []
- Do NOT include any text outside the JSON object`;
}

function buildEnglishToSinglishPrompt() {
  return `You are a Standard English-to-Singlish translator. Your job is to make text sound authentically Singaporean — like a local would naturally say it.

Singlish is Singapore's colloquial English — a creole with influences from Malay, Hokkien, Cantonese, Tamil, and British English. It has its own grammar, particles, vocabulary, and rhythm.

RULES OF SINGLISH:
- Add sentence-final particles: "lah" (casual assertion), "leh" (mild complaint/surprise), "lor" (resigned acceptance), "meh" (disbelief/question), "sia" (emphasis), "mah" (explanation/obvious)
- Drop unnecessary pronouns and articles (e.g., "Can help me?" not "Can you help me?")
- Use "one" at the end for emphasis ("She like that one")
- Use "already" for completed actions ("He go already")
- Replace "very" with "damn" or "very very" for strong emphasis
- Use Singlish vocabulary where natural: shiok, jialat, kiasu, makan, blur, sian, chope, sabo, etc.
- Shorten or simplify sentences naturally
- Don't overdo it — keep it authentic, not a caricature

COMMON SINGLISH TERMS to sprinkle in naturally:
- shiok (enjoyable), jialat (terrible), makan (eat), blur (confused), sian (bored/tired), kiasu (competitive), walao/wah lau (wow/frustration), aiyah (exasperation), can/cannot (yes/no), confirm plus chop (definitely), steady (cool/impressive), rabak (chaotic), bojio (didn't invite)

INSTRUCTIONS:
- Translate the input into natural, authentic Singlish
- Match the energy: casual text gets casual Singlish, serious text gets only slightly singlish-fied
- Return ONLY a valid JSON object with this exact structure:
{
  "translation": "The Singlish version of the text",
  "glossary": [
    { "term": "singlish term used", "meaning": "what it means" }
  ]
}
- In the glossary, explain up to 5 Singlish terms or particles you used
- Do NOT include any text outside the JSON object`;
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
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 2000);
  });
}

// ===== ENTER KEY =====
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    translate();
  }
});
