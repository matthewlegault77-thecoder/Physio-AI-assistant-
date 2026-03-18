import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '../../../lib/supabase/server';

const SYSTEM_PROMPT = `You are an expert physiotherapist AI. Analyze the patient profile and injury and return ONLY a valid JSON object. No markdown, no code blocks, no explanation text — just the raw JSON.

Use this exact structure:
{
  "bodyRegion": "knee",
  "side": "left",
  "diagnosis": {
    "title": "Patellar Tendinopathy",
    "tagline": "A witty 6-8 word summary of the condition",
    "severity": "moderate",
    "healingTime": "4-8 weeks"
  },
  "why": [
    "Short cause phrase under 8 words",
    "Short cause phrase under 8 words",
    "Short cause phrase under 8 words"
  ],
  "solution": [
    {
      "phase": "Protect",
      "timeline": "Days 1-7",
      "colorKey": "red",
      "actions": ["Specific action under 10 words", "Specific action under 10 words", "Specific action under 10 words"]
    },
    {
      "phase": "Rebuild",
      "timeline": "Weeks 2-6",
      "colorKey": "amber",
      "actions": ["Specific action under 10 words", "Specific action under 10 words", "Specific action under 10 words"]
    },
    {
      "phase": "Return",
      "timeline": "Weeks 6-12",
      "colorKey": "green",
      "actions": ["Specific action under 10 words", "Specific action under 10 words", "Specific action under 10 words"]
    }
  ],
  "nextSteps": [
    {"when": "Today", "action": "Specific immediate action under 12 words"},
    {"when": "This Week", "action": "Specific weekly goal under 12 words"},
    {"when": "Next Month", "action": "Specific milestone under 12 words"}
  ],
  "redFlag": "One sentence: specific warning signs that require immediate medical attention for this exact injury"
}

Rules:
- bodyRegion must be one of: head, neck, shoulder, chest, upper_back, lower_back, elbow, wrist, hand, hip, thigh, knee, shin, ankle, foot
- side must be: left, right, bilateral, or null
- severity must be: mild, moderate, or severe (based on pain levels and injury description)
- tagline should be witty, memorable, and encourage the patient (e.g. "Your tendon needs a timeout", "Your disc just needs space")
- Be clinically accurate but use warm, encouraging, human language
- Phase names, timelines, and action counts can be adjusted for the injury (e.g. some injuries only need 2 phases)
- Return ONLY the JSON object, nothing else`;

function buildProfileBlock(profile) {
  if (!profile) return 'No patient profile provided. Make reasonable assumptions for an average adult.';
  const lines = ['Patient Profile:'];
  const p = profile.personal || {};
  const f = profile.fitness || {};
  const m = profile.medical || {};

  const demo = [];
  if (p.age) demo.push(`${p.age} years old`);
  if (p.sex) demo.push(p.sex);
  if (p.height_cm && p.weight_kg) {
    const bmi = (parseFloat(p.weight_kg) / Math.pow(parseFloat(p.height_cm) / 100, 2)).toFixed(1);
    demo.push(`${p.height_cm}cm / ${p.weight_kg}kg (BMI ~${bmi})`);
  }
  if (demo.length) lines.push(`- Demographics: ${demo.join(', ')}`);
  if (f.level) lines.push(`- Fitness level: ${f.level}`);
  if (f.primary_activity) lines.push(`- Primary activity: ${f.primary_activity}`);
  if (f.training_frequency_per_week) lines.push(`- Trains ${f.training_frequency_per_week} days/week`);
  if (f.years_of_training) lines.push(`- ${f.years_of_training} years training experience`);
  if (m.current_medications?.length) lines.push(`- Medications: ${m.current_medications.join(', ')}`);
  if (m.relevant_medical_history?.length) lines.push(`- Medical history: ${m.relevant_medical_history.join(', ')}`);
  if (m.previous_injuries?.length) lines.push(`- Previous injuries: ${m.previous_injuries.join(', ')}`);
  if (m.surgeries?.length) lines.push(`- Surgeries: ${m.surgeries.join(', ')}`);
  return lines.join('\n');
}

function buildInjuryBlock(injury) {
  if (!injury) return 'No injury details provided.';
  const lines = ['Injury Presentation:'];
  if (injury.body_part) lines.push(`- Body part: ${injury.body_part}`);
  if (injury.description) lines.push(`- Description: ${injury.description}`);
  if (injury.duration) lines.push(`- Duration: ${injury.duration}`);
  lines.push(`- Pain at rest: ${injury.pain_rest ?? 0}/10  |  Pain with movement: ${injury.pain_movement ?? 0}/10`);
  if (injury.worse) lines.push(`- Aggravating factors: ${injury.worse}`);
  if (injury.better) lines.push(`- Relieving factors: ${injury.better}`);
  if (injury.onset) lines.push(`- Onset: ${injury.onset}`);
  if (injury.previous) lines.push(`- Previous occurrence: ${injury.previous}`);
  if (injury.limitations) lines.push(`- Limitations: ${injury.limitations}`);
  if (injury.treatments_tried) lines.push(`- Treatments tried: ${injury.treatments_tried}`);
  return lines.join('\n');
}

export async function POST(request) {
  // Auth + payment gating (defense-in-depth — middleware also checks auth)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('has_paid')
    .eq('id', user.id)
    .single();

  if (!profile?.has_paid) {
    return Response.json({ error: 'Payment required' }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured on the server.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { profile, injury } = body;
  const profileBlock = buildProfileBlock(profile);
  const injuryBlock = buildInjuryBlock(injury);
  const userMessage = `Please analyze this patient and return the treatment plan JSON.\n\n${profileBlock}\n\n${injuryBlock}`;

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content?.[0]?.text || '';
    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    // Validate it's parseable JSON before sending
    JSON.parse(cleaned);

    return Response.json({ plan: cleaned });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to generate plan.' }, { status: 500 });
  }
}
