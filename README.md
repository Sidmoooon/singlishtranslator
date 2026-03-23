# Lah. — Singlish Translator

> Singapore English, decoded. A web app for international students navigating Singlish.

## What it does

- Translates **Singlish → Standard English** (with a glossary of key terms)
- Translates **Standard English → Singlish** (authentic, not a caricature)
- Supports single words, sentences, and long-form text (emails, messages)
- Powered by Google Gemini 1.5 Flash (free API)
- API key stored securely server-side via Vercel environment variables

---

## Project Structure

```
singlish-translator/
├── api/
│   └── translate.js    ← Vercel serverless function (API key lives here, server-side)
├── index.html          ← App UI
├── style.css           ← Styling
├── app.js              ← Frontend logic
├── vercel.json         ← Vercel routing config
└── README.md
```

---

## Setup & Deploy

### Step 1 — Get a free Gemini API key
1. Go to https://aistudio.google.com
2. Sign in with a Google account
3. Click Get API Key → Create API key
4. Copy the key (starts with AIza...)

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/singlish-translator.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to vercel.com and sign in with GitHub
2. Click Add New Project → import your singlish-translator repo
3. Click Deploy (no build settings needed)

### Step 4 — Add your API key as an Environment Variable
1. Vercel project dashboard → Settings → Environment Variables
2. Add: Name = GEMINI_API_KEY, Value = your key, Environments = all three
3. Save, then Deployments → Redeploy

Your app is live at https://your-project.vercel.app

---

## Singlish Reference Sources

- A Dictionary of Singlish and Singapore English — Adam Pray, SMU (mysmu.edu/faculty/jacklee)
- xkjyeah/singlish-dictionary — community JSON dictionary on GitHub
- Wiktionary: Singapore English category

---

Built for Applied AI in Marketing — Final Project, Track 3
Target audience: International students and expats in Singapore
