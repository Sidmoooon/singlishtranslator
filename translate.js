export default async function handler(req, res) {
  // Only allow POST
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

  const systemPrompt = direction === 'singlish-to-english'
    ? buildSinglishToEnglishPrompt()
    : buildEnglishToSinglishPrompt();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Gemini API error' });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown code fences if Gemini wraps JSON in them
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
- alamak — oh no / expression of surprise
- bojio — didn't invite me (Hokkien)
- chope — to reserve a seat (often with a tissue packet)
- sabo — to sabotage / play a trick on someone
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
- Do NOT include any text outside the JSON object. Do NOT wrap in markdown code fences.`;
}

function buildEnglishToSinglishPrompt() {
  return `You are a Standard English-to-Singlish translator. Your job is to make text sound authentically Singaporean — like a local would naturally say it.

Singlish is Singapore's colloquial English — a creole with influences from Malay, Hokkien, Cantonese, Tamil, and British English.

RULES OF SINGLISH:
- Add sentence-final particles: "lah" (casual assertion), "leh" (mild complaint/surprise), "lor" (resigned acceptance), "meh" (disbelief/question), "sia" (emphasis), "mah" (explanation/obvious)
- Drop unnecessary pronouns and articles where natural
- Use "one" at the end for emphasis ("She like that one")
- Use "already" for completed actions ("He go already")
- Replace "very" with "damn" for strong emphasis
- Use Singlish vocabulary where natural: shiok, jialat, kiasu, makan, blur, sian, chope, sabo, etc.
- Don't overdo it — keep it authentic, not a caricature

INSTRUCTIONS:
- Translate the input into natural, authentic Singlish
- Match the energy: casual text gets casual Singlish, formal text gets only lightly singlish-fied
- Return ONLY a valid JSON object with this exact structure:
{
  "translation": "The Singlish version of the text",
  "glossary": [
    { "term": "singlish term used", "meaning": "what it means" }
  ]
}
- In the glossary, explain up to 5 Singlish terms or particles you used
- Do NOT include any text outside the JSON object. Do NOT wrap in markdown code fences.`;
}
