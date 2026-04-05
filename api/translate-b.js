export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, direction, mode } = req.body;
  if (!text || !direction) {
    return res.status(400).json({ error: 'Missing text or direction' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const isToEnglish = direction === 'singlish-to-english';

  const systemPrompt = isToEnglish
    ? `You are a Singlish expert helping international students in Singapore deeply understand Singlish.
Singlish is Singapore's colloquial language — a creole of English, Malay, Hokkien, Cantonese, and Tamil.

For any Singlish input, provide a rich, educational breakdown.
Return ONLY a valid JSON object with this structure (no markdown, no extra text):
{
  "translation": "Clear Standard English translation",
  "context": "2-3 sentences explaining when, where, and by whom this is typically used. Mention tone, formality, and social context.",
  "examples": [
    "Example sentence 1 using the word/phrase naturally in Singlish",
    "Example sentence 2 in a different context",
    "Example sentence 3"
  ],
  "responses": [
    "A natural Singlish response someone might say",
    "Another possible response",
    "A third response option"
  ],
  "glossary": [
    { "term": "singlish word", "meaning": "its meaning" }
  ]
}
Keep examples authentic. Glossary should explain up to 5 key Singlish terms found in the input.`
    : `You are a Singlish expert helping international students learn to communicate like a Singaporean.
For any Standard English input, convert it to authentic Singlish and explain how it works.
Return ONLY a valid JSON object with this structure (no markdown, no extra text):
{
  "translation": "Natural Singlish version",
  "context": "2-3 sentences explaining the Singlish particles and words used, and when this phrasing would be appropriate.",
  "examples": [
    "Another example of similar Singlish phrasing",
    "Example in a different situation",
    "Example showing a variation"
  ],
  "responses": [
    "How someone might respond to this in Singlish",
    "Another natural response",
    "A third response option"
  ],
  "glossary": [
    { "term": "singlish term used", "meaning": "what it means" }
  ]
}`;

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
      return res.status(200).json({ translation: raw, context: '', examples: [], responses: [], glossary: [] });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
