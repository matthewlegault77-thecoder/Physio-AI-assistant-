'use client';

import { useState, useEffect, useRef } from 'react';

const PROFILE_KEY = 'physio_ai_profile';

const DEFAULT_PROFILE = {
  personal: { age: '', sex: '', height_cm: '', weight_kg: '' },
  fitness: { level: '', primary_activity: '', training_frequency_per_week: '', years_of_training: '' },
  medical: {
    current_medications: '',
    relevant_medical_history: '',
    previous_injuries: '',
    surgeries: '',
  },
};

const DEFAULT_INJURY = {
  body_part: '',
  description: '',
  duration: '',
  pain_rest: 0,
  pain_movement: 0,
  worse: '',
  better: '',
  onset: '',
  previous: '',
  limitations: '',
  treatments_tried: '',
};

// ─── Simple markdown renderer ───────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      const isHeader = false;
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (block) => {
      const rows = block.trim().split('\n');
      const header = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      const body = rows.slice(2).join('\n');
      return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
    })
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, (block) => `<ul>${block}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[htupol])(.+)$/gm, (line) => (line.trim() ? line : ''))
    .replace(/^<\/p><p>(<[htupol])/gm, '$1');
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Profile', 'Injury', 'Results'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                ${active ? 'bg-blue-600 text-white' : done ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}
            >
              {done ? '✓' : num}
            </div>
            <span className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-slate-300 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field components ────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
        {hint && <span className="font-normal text-slate-400 ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white';

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={inputCls + ' resize-y'}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">Select...</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Slider({ value, onChange, label }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>0 - None</span>
        <span className="font-semibold text-blue-600">{value}/10</span>
        <span>10 - Severe</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}

// ─── Step 0: Disclaimer ──────────────────────────────────────────────────────
function DisclaimerStep({ onContinue }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">AI Physiotherapist</h1>
        <p className="text-slate-500 mt-2">Personalized injury assessment and rehab planning</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-amber-800 mb-3">Medical Disclaimer</h2>
        <ul className="text-sm text-amber-700 space-y-2">
          <li>This tool provides AI-generated guidance for <strong>educational purposes only</strong>. It is not a substitute for professional medical diagnosis or treatment.</li>
          <li>Always consult a licensed physiotherapist or physician before beginning any rehabilitation program.</li>
          <li>If your condition worsens at any point, stop all exercises and seek professional care.</li>
        </ul>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold text-red-700 mb-2 uppercase tracking-wide">Seek Emergency Care Immediately If You Have:</h2>
        <ul className="text-sm text-red-600 space-y-1">
          <li>Severe pain, inability to move a limb, or visible deformity</li>
          <li>Loss of bladder or bowel control</li>
          <li>Chest pain, difficulty breathing, or signs of a stroke</li>
          <li>Numbness or tingling spreading into both legs</li>
        </ul>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-base"
      >
        I Understand, Continue
      </button>
    </div>
  );
}

// ─── Step 1: Profile ─────────────────────────────────────────────────────────
function ProfileStep({ profile, onChange, onNext }) {
  const set = (section, field) => (val) =>
    onChange({ ...profile, [section]: { ...profile[section], [field]: val } });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Your Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Saved locally in your browser. All fields optional.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Personal</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" hint="years">
            <Input value={profile.personal.age} onChange={set('personal', 'age')} placeholder="e.g. 28" type="number" />
          </Field>
          <Field label="Sex">
            <Select
              value={profile.personal.sex}
              onChange={set('personal', 'sex')}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Height" hint="cm">
            <Input value={profile.personal.height_cm} onChange={set('personal', 'height_cm')} placeholder="e.g. 178" type="number" />
          </Field>
          <Field label="Weight" hint="kg">
            <Input value={profile.personal.weight_kg} onChange={set('personal', 'weight_kg')} placeholder="e.g. 75" type="number" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Fitness Background</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fitness Level">
            <Select
              value={profile.fitness.level}
              onChange={set('fitness', 'level')}
              options={[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'lightly_active', label: 'Lightly Active' },
                { value: 'moderately_active', label: 'Moderately Active' },
                { value: 'athlete', label: 'Athlete' },
                { value: 'elite_athlete', label: 'Elite Athlete' },
              ]}
            />
          </Field>
          <Field label="Primary Activity">
            <Input value={profile.fitness.primary_activity} onChange={set('fitness', 'primary_activity')} placeholder="e.g. running, weightlifting" />
          </Field>
          <Field label="Training Frequency" hint="days/week">
            <Input value={profile.fitness.training_frequency_per_week} onChange={set('fitness', 'training_frequency_per_week')} placeholder="e.g. 5" type="number" />
          </Field>
          <Field label="Years Training">
            <Input value={profile.fitness.years_of_training} onChange={set('fitness', 'years_of_training')} placeholder="e.g. 4" type="number" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Medical History</h3>
        <Field label="Current Medications" hint="comma-separated">
          <Input value={profile.medical.current_medications} onChange={set('medical', 'current_medications')} placeholder="e.g. ibuprofen, metformin" />
        </Field>
        <Field label="Relevant Medical History" hint="comma-separated">
          <Input value={profile.medical.relevant_medical_history} onChange={set('medical', 'relevant_medical_history')} placeholder="e.g. diabetes, hypertension" />
        </Field>
        <Field label="Previous Injuries" hint="comma-separated">
          <Input value={profile.medical.previous_injuries} onChange={set('medical', 'previous_injuries')} placeholder="e.g. left ACL tear 2021" />
        </Field>
        <Field label="Surgeries" hint="comma-separated">
          <Input value={profile.medical.surgeries} onChange={set('medical', 'surgeries')} placeholder="e.g. appendectomy 2018" />
        </Field>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        Continue to Injury Description
      </button>
    </div>
  );
}

// ─── Step 2: Injury ──────────────────────────────────────────────────────────
function InjuryStep({ injury, onChange, onNext, onBack, loading }) {
  const set = (field) => (val) => onChange({ ...injury, [field]: val });

  const valid = injury.body_part.trim() && injury.description.trim();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Describe Your Injury</h2>
        <p className="text-slate-500 text-sm mt-1">The more detail you provide, the more accurate your plan will be.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <Field label="Body Part Affected" hint="required">
          <Input value={injury.body_part} onChange={set('body_part')} placeholder="e.g. left knee, lower back, right shoulder" />
        </Field>
        <Field label="Description" hint="required - describe what happened and what you feel">
          <Textarea value={injury.description} onChange={set('description')} placeholder="e.g. Twisted my ankle stepping off a curb yesterday. Sharp pain on the outer side, some swelling, hurts to put weight on it." rows={4} />
        </Field>
        <Field label="How Long Have You Had This Issue?">
          <Input value={injury.duration} onChange={set('duration')} placeholder="e.g. 2 days, 3 weeks, 2 months" />
        </Field>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Pain Levels</h3>
        <Field label="Pain at Rest">
          <Slider value={injury.pain_rest} onChange={set('pain_rest')} />
        </Field>
        <Field label="Pain with Movement">
          <Slider value={injury.pain_movement} onChange={set('pain_movement')} />
        </Field>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">More Details</h3>
        <Field label="What Makes It Worse?">
          <Input value={injury.worse} onChange={set('worse')} placeholder="e.g. going up stairs, prolonged sitting, twisting" />
        </Field>
        <Field label="What Makes It Better?">
          <Input value={injury.better} onChange={set('better')} placeholder="e.g. rest, ice, elevation" />
        </Field>
        <Field label="How Did It Start?">
          <div className="flex gap-3">
            {['Sudden (acute injury)', 'Gradual (overuse / chronic)'].map((opt) => {
              const val = opt.startsWith('S') ? 'sudden' : 'gradual';
              return (
                <button
                  key={val}
                  onClick={() => set('onset')(val)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                    ${injury.onset === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Previous Occurrence?">
          <Input value={injury.previous} onChange={set('previous')} placeholder="e.g. Yes, same ankle 2 years ago / No" />
        </Field>
        <Field label="Current Limitations">
          <Input value={injury.limitations} onChange={set('limitations')} placeholder="e.g. cannot run, difficult to lift overhead" />
        </Field>
        <Field label="Treatments Already Tried">
          <Input value={injury.treatments_tried} onChange={set('treatments_tried')} placeholder="e.g. ice, rest, ibuprofen" />
        </Field>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {loading ? 'Generating Plan...' : 'Generate Treatment Plan'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Results ─────────────────────────────────────────────────────────
function ResultsStep({ result, loading, onStartOver }) {
  const contentRef = useRef(null);

  const copyPlan = () => {
    navigator.clipboard.writeText(result).catch(() => {});
  };

  // Scroll to bottom as content streams in
  useEffect(() => {
    if (loading && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [result, loading]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Your Treatment Plan</h2>
          {loading && (
            <p className="text-blue-600 text-sm mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              Generating your personalized plan...
            </p>
          )}
        </div>
        {!loading && result && (
          <div className="flex gap-2">
            <button onClick={copyPlan} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Copy Plan
            </button>
            <button onClick={onStartOver} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              New Assessment
            </button>
          </div>
        )}
      </div>

      {!result && loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-sm">Analyzing your injury and building your plan...</p>
          <p className="text-xs mt-1">This typically takes 30-60 seconds</p>
        </div>
      )}

      {result && (
        <div
          ref={contentRef}
          className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 plan-output overflow-auto max-h-[70vh]"
          dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(result)}</p>` }}
        />
      )}

      {!loading && result && (
        <div className="mt-4 flex justify-center">
          <button onClick={onStartOver} className="text-slate-500 text-sm hover:text-slate-700 underline">
            Start a new assessment
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(0); // 0=disclaimer, 1=profile, 2=injury, 3=results
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [injury, setInjury] = useState(DEFAULT_INJURY);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch {}
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');
    setStep(3);

    // Normalize profile - convert comma strings to arrays for medical fields
    const normalizedProfile = {
      ...profile,
      medical: {
        current_medications: profile.medical.current_medications
          ? profile.medical.current_medications.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        relevant_medical_history: profile.medical.relevant_medical_history
          ? profile.medical.relevant_medical_history.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        previous_injuries: profile.medical.previous_injuries
          ? profile.medical.previous_injuries.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        surgeries: profile.medical.surgeries
          ? profile.medical.surgeries.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      },
    };

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: normalizedProfile, injury }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setResult(`Error: ${err.error}`);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResult(accumulated);
      }
    } catch (err) {
      setResult(`Error connecting to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setInjury(DEFAULT_INJURY);
    setResult('');
    setStep(2);
  };

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {step === 0 && <DisclaimerStep onContinue={() => setStep(1)} />}

        {step > 0 && step < 3 && (
          <>
            <StepIndicator step={step} />
          </>
        )}

        {step === 1 && (
          <ProfileStep
            profile={profile}
            onChange={setProfile}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <InjuryStep
            injury={injury}
            onChange={setInjury}
            onNext={handleGenerate}
            onBack={() => setStep(1)}
            loading={loading}
          />
        )}

        {step === 3 && (
          <ResultsStep
            result={result}
            loading={loading}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </main>
  );
}
