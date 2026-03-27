export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, direction } = req.body;

  if (!text || !direction) {
    return res.status(400).json({ error: 'Missing text or direction' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const isToEnglish = direction === 'singlish-to-english';

  const systemPrompt = isToEnglish
    ? `You are a Singlish-to-English translator for international students in Singapore.
Singlish uses particles like lah, leh, lor, sia, meh, and words like shiok, jialat, kiasu, makan, blur, sian, rabak, chope, sabo, alamak, bojio, walao, aiyah, bochap, atas, confirm plus chop.
Translate the input into clear Standard English, preserving meaning and tone.
Return ONLY a JSON object, no markdown, no extra text:
{"translation":"...","glossary":[{"term":"...","meaning":"..."}]}`
    : `You are a Standard English-to-Singlish translator for Singapore.
Make the text sound like a natural Singaporean — add particles (lah, leh, lor, sia, meh), drop articles, use local vocab (shiok, jialat, makan, blur, sian, kiasu, walao, aiyah, chope, sabo).
Don't overdo it — keep it authentic, not a caricature.
Return ONLY a JSON object, no markdown, no extra text:
{"translation":"...","glossary":[{"term":"...","meaning":"..."}]}`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }]
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json();
      return res.status(claudeRes.status).json({ error: err.error?.message || 'Claude API error' });
    }

    const data = await claudeRes.json();
    const raw = data.content?.[0]?.text || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(200).json({ translation: raw, glossary: [] });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
