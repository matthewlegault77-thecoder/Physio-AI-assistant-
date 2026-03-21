# Physio AI Pal

Personalized injury assessment and rehabilitation planning powered by Claude AI.

## Features

- Multi-step form: profile setup, injury description, treatment plan
- Streaming AI response (treatment plan appears progressively)
- Profile saved locally in browser (no account needed)
- 7-section structured output: assessment, red flags, immediate care (PEACE & LOVE), 4-phase rehab program, recovery timeline, prevention, education

## Local Development

**1. Clone and install**
```bash
git clone <your-repo-url>
cd physio-web
npm install
```

**2. Set up environment**
```bash
cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key
```

**3. Run**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In Project Settings → Environment Variables, add:
   - `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
4. Deploy — Vercel auto-detects Next.js, no config needed

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-node)
- Claude claude-sonnet-4-6

## Medical Disclaimer

This application provides AI-generated physiotherapy guidance for educational purposes only. It is not a substitute for professional medical diagnosis or treatment by a licensed physiotherapist or physician. Always consult a healthcare professional before beginning any rehabilitation program.
