export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, direction } = req.body;

  if (!text || !direction) {
    return res.status(400).json({ error: 'Missing text or direction' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
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
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      return res.status(geminiRes.status).json({ error: err.error?.message || 'Gemini API error' });
    }

    const data = await geminiRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
