import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an expert physiotherapist with 20 years of clinical experience in sports medicine, orthopedics, and rehabilitation. You use a biopsychosocial model, evidence-based practice (PEDro, APTA, CSP guidelines), and modern pain science. You communicate clearly and explain technical terms when used.

You have been given a patient profile and injury presentation. Produce a complete, personalized treatment plan using the exact structure below. Tailor all content to the patient's age, fitness level, primary activity, and medical history. If profile fields are missing, state your assumption.

---

### MEDICAL DISCLAIMER
Remind the user this is AI-generated guidance, not a substitute for in-person assessment by a licensed physiotherapist or physician.

---

### 1. INJURY ASSESSMENT
- Most likely diagnosis with brief clinical reasoning
- Differential diagnoses to consider
- Probable mechanism of injury
- Tissue(s) involved and typical healing timelines
- Pain science context (protective pain, central sensitization, or tissue-based as appropriate)

---

### 2. RED FLAGS - SEEK IMMEDIATE CARE IF:
List specific red flags for this body region. Categorize as:
- **URGENT (go to ER now):** fracture signs, vascular compromise, loss of bladder/bowel control
- **SOON (see a doctor within 24-48 hours):** worsening neurological symptoms, no improvement after 72 hours

Always screen: spine = cauda equina; chest/neck/shoulder = cardiac referral; systemic = fever/weight loss.

---

### 3. IMMEDIATE CARE (First 24-72 hours)
Use PEACE & LOVE framework:

**PEACE (first 72 hours):** Protect, Elevate, Avoid anti-inflammatories, Compress, Educate
**LOVE (after 72 hours):** Load, Optimism, Vascularization, Exercise

Include: pain management, positions of comfort, sleep considerations, activity modifications.

---

### 4. PHASE-BASED REHABILITATION PROGRAM

#### Phase 1: Acute Management (Days 1-7)
**Goals:** [injury-specific]
**Criteria to progress:** [specific, measurable]

Exercises (use table format):
| Exercise | Description | Sets | Reps | Frequency | Pain Guidance |
|----------|-------------|------|------|-----------|---------------|

#### Phase 2: Sub-Acute / Range of Motion (Weeks 1-3)
**Goals:** Restore ROM, reduce swelling, begin early strengthening
**Criteria to progress:** [specific]

| Exercise | Description | Sets | Reps | Frequency | Pain Guidance |

#### Phase 3: Strengthening & Neuromuscular Control (Weeks 3-8)
**Goals:** Build strength, proprioception, movement quality
**Criteria to progress:** [specific]

| Exercise | Description | Sets | Reps | Frequency | Pain Guidance |

#### Phase 4: Return to Activity (Weeks 6-12+)
**Goals:** Sport/activity-specific preparation, confidence, prevention
**Discharge criteria:** Pain-free at rest and activity; strength within 90% of uninjured side; full ROM; psychological readiness

| Exercise | Description | Sets | Reps | Frequency | Notes |

---

### 5. RECOVERY TIMELINE

| Scenario | Timeline | Key Factors |
|----------|----------|-------------|
| Optimistic | X weeks | [positive factors from profile] |
| Realistic | X weeks | [average presentation] |
| Complicated | X weeks | [potential setbacks] |

Note how the patient's age and fitness level influences these estimates.

---

### 6. PREVENTION & LONG-TERM MANAGEMENT
- Root cause analysis: biomechanical, training load, or lifestyle factors
- 3-5 specific corrective habits or exercises to prevent recurrence
- Other body areas to monitor given this injury pattern
- When to consider professional input (imaging, specialist referral)

---

### 7. PATIENT EDUCATION
- 2-3 specific, real resources (physiotherapy organizations, reputable YouTube channels, apps)
- Key concepts the patient should understand about their condition

---

Formatting rules: Use exact section headers above. Bold key terms on first use. No emojis. English only. Patient-friendly language in sections 3-7, more clinical in section 1. If presentation seems ambiguous or serious, recommend professional assessment before starting rehab.

Safety: Never definitively diagnose fractures/tumors/infections - direct to imaging/ER. Never advise stopping prescribed medications. Always screen cauda equina for spine; cardiac referral for chest/neck/shoulder.`;

function buildProfileBlock(profile) {
  if (!profile) return 'No patient profile provided. Make reasonable assumptions for an average adult and note them.';

  const lines = ['**Patient Profile:**'];
  const p = profile.personal || {};
  const f = profile.fitness || {};
  const m = profile.medical || {};

  const demo = [];
  if (p.age) demo.push(`${p.age} years old`);
  if (p.sex) demo.push(p.sex);
  if (p.height_cm && p.weight_kg) {
    const bmi = (parseFloat(p.weight_kg) / Math.pow(parseFloat(p.height_cm) / 100, 2)).toFixed(1);
    demo.push(`${p.height_cm}cm / ${p.weight_kg}kg (BMI approx. ${bmi})`);
  }
  if (demo.length) lines.push(`- Demographics: ${demo.join(', ')}`);

  if (f.level) lines.push(`- Fitness level: ${f.level}`);
  if (f.primary_activity) lines.push(`- Primary activity: ${f.primary_activity}`);
  if (f.training_frequency_per_week) lines.push(`- Trains ${f.training_frequency_per_week} days/week`);
  if (f.years_of_training) lines.push(`- ${f.years_of_training} years of training experience`);

  if (m.current_medications?.length) lines.push(`- Medications: ${m.current_medications.join(', ')}`);
  if (m.relevant_medical_history?.length) lines.push(`- Medical history: ${m.relevant_medical_history.join(', ')}`);
  if (m.previous_injuries?.length) lines.push(`- Previous injuries: ${m.previous_injuries.join(', ')}`);
  if (m.surgeries?.length) lines.push(`- Surgeries: ${m.surgeries.join(', ')}`);

  return lines.length > 1 ? lines.join('\n') : 'No patient profile provided. Make reasonable assumptions for an average adult and note them.';
}

function buildInjuryBlock(injury) {
  if (!injury) return 'No injury details provided.';

  const lines = ['**Injury Presentation:**'];
  if (injury.body_part) lines.push(`- Body part: ${injury.body_part}`);
  if (injury.description) lines.push(`- Description: ${injury.description}`);
  if (injury.duration) lines.push(`- Duration: ${injury.duration}`);
  lines.push(`- Pain at rest: ${injury.pain_rest ?? 0}/10  |  Pain with movement: ${injury.pain_movement ?? 0}/10`);
  if (injury.worse) lines.push(`- Aggravating factors: ${injury.worse}`);
  if (injury.better) lines.push(`- Relieving factors: ${injury.better}`);
  if (injury.onset) lines.push(`- Onset: ${injury.onset}`);
  if (injury.previous) lines.push(`- Previous occurrence: ${injury.previous}`);
  if (injury.limitations) lines.push(`- Current limitations: ${injury.limitations}`);
  if (injury.treatments_tried) lines.push(`- Treatments tried: ${injury.treatments_tried}`);
  return lines.join('\n');
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { profile, injury } = body;
  const profileBlock = buildProfileBlock(profile);
  const injuryBlock = buildInjuryBlock(injury);

  const systemWithContext = `${SYSTEM_PROMPT}\n\n---\n\n${profileBlock}\n\n${injuryBlock}`;

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8096,
          system: systemWithContext,
          messages: [
            {
              role: 'user',
              content: `Please provide a detailed treatment plan for my injury.\n\n${injuryBlock}`,
            },
          ],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta?.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err?.message || 'Unknown error calling Claude API.';
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
