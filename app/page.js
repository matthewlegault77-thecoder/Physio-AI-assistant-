'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ShaderBackground from '../components/ui/shader-background';
import { SplineScene } from '../components/ui/spline-scene';

const SPLINE_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

// ─── Constants ────────────────────────────────────────────────────────────────
const PROFILE_KEY = 'physio_ai_profile';
const ACCESS_KEY = 'physio_access';

const DEFAULT_PROFILE = {
  personal: { age: '', sex: '', height_cm: '', weight_kg: '' },
  fitness: { level: '', primary_activity: '', training_frequency_per_week: '', years_of_training: '' },
  medical: { current_medications: '', relevant_medical_history: '', previous_injuries: '', surgeries: '' },
};

const DEFAULT_INJURY = {
  body_part: '', description: '', duration: '',
  pain_rest: 0, pain_movement: 0,
  worse: '', better: '', onset: '', previous: '', limitations: '', treatments_tried: '',
};

// ─── Stripe ───────────────────────────────────────────────────────────────────
let _stripePromise;
function getStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (key && !_stripePromise) _stripePromise = loadStripe(key);
  return _stripePromise ?? null;
}

// ─── Body Diagram ─────────────────────────────────────────────────────────────
const HOTSPOTS = {
  head:           { cx: 60,  cy: 22,  r: 20 },
  neck:           { cx: 60,  cy: 46,  r: 10 },
  left_shoulder:  { cx: 22,  cy: 60,  r: 14 },
  right_shoulder: { cx: 98,  cy: 60,  r: 14 },
  shoulder:       { cx: 22,  cy: 60,  r: 14 },
  chest:          { cx: 60,  cy: 88,  r: 22 },
  upper_back:     { cx: 60,  cy: 88,  r: 22 },
  lower_back:     { cx: 60,  cy: 128, r: 18 },
  lumbar:         { cx: 60,  cy: 130, r: 18 },
  spine:          { cx: 60,  cy: 100, r: 15 },
  left_elbow:     { cx: 17,  cy: 116, r: 11 },
  right_elbow:    { cx: 103, cy: 116, r: 11 },
  elbow:          { cx: 17,  cy: 116, r: 11 },
  left_wrist:     { cx: 15,  cy: 158, r: 10 },
  right_wrist:    { cx: 105, cy: 158, r: 10 },
  wrist:          { cx: 15,  cy: 158, r: 10 },
  left_hand:      { cx: 15,  cy: 172, r: 12 },
  right_hand:     { cx: 105, cy: 172, r: 12 },
  hand:           { cx: 15,  cy: 172, r: 12 },
  left_hip:       { cx: 40,  cy: 158, r: 16 },
  right_hip:      { cx: 80,  cy: 158, r: 16 },
  hip:            { cx: 60,  cy: 158, r: 22 },
  left_thigh:     { cx: 44,  cy: 208, r: 16 },
  right_thigh:    { cx: 76,  cy: 208, r: 16 },
  thigh:          { cx: 44,  cy: 208, r: 16 },
  left_knee:      { cx: 44,  cy: 246, r: 14 },
  right_knee:     { cx: 76,  cy: 246, r: 14 },
  knee:           { cx: 44,  cy: 246, r: 14 },
  left_shin:      { cx: 44,  cy: 280, r: 13 },
  right_shin:     { cx: 76,  cy: 280, r: 13 },
  shin:           { cx: 44,  cy: 280, r: 13 },
  left_ankle:     { cx: 43,  cy: 308, r: 10 },
  right_ankle:    { cx: 77,  cy: 308, r: 10 },
  ankle:          { cx: 43,  cy: 308, r: 10 },
  left_foot:      { cx: 43,  cy: 322, r: 13 },
  right_foot:     { cx: 77,  cy: 322, r: 13 },
  foot:           { cx: 43,  cy: 322, r: 13 },
};

function getHotspot(bodyRegion, side) {
  if (!bodyRegion) return null;
  const input = bodyRegion.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const sideKey = side && side !== 'bilateral' && side !== 'null' ? `${side}_${input}` : null;
  if (sideKey && HOTSPOTS[sideKey]) return HOTSPOTS[sideKey];
  if (HOTSPOTS[input]) return HOTSPOTS[input];
  // Fuzzy: find a hotspot key contained in input or vice versa
  for (const key of Object.keys(HOTSPOTS)) {
    if (input.includes(key) || key.includes(input)) return HOTSPOTS[key];
  }
  return null;
}

function BodyDiagram({ bodyRegion, side }) {
  const hotspot = getHotspot(bodyRegion, side);
  const skin = '#EAC49A';
  const outline = '#C9956E';

  return (
    <svg viewBox="0 0 120 340" className="w-28 h-auto drop-shadow-sm" fill="none">
      {/* Head */}
      <circle cx="60" cy="22" r="19" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Neck */}
      <rect x="53" y="40" width="14" height="13" rx="3" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Torso */}
      <rect x="36" y="52" width="48" height="92" rx="10" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Hips */}
      <rect x="32" y="136" width="56" height="34" rx="10" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left upper arm */}
      <rect x="16" y="52" width="19" height="62" rx="7" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left forearm */}
      <rect x="12" y="116" width="16" height="48" rx="6" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left hand */}
      <ellipse cx="20" cy="175" rx="10" ry="13" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right upper arm */}
      <rect x="85" y="52" width="19" height="62" rx="7" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right forearm */}
      <rect x="92" y="116" width="16" height="48" rx="6" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right hand */}
      <ellipse cx="100" cy="175" rx="10" ry="13" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left shoulder cap */}
      <ellipse cx="22" cy="61" rx="10" ry="10" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right shoulder cap */}
      <ellipse cx="98" cy="61" rx="10" ry="10" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left elbow */}
      <ellipse cx="19" cy="117" rx="9" ry="8" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right elbow */}
      <ellipse cx="101" cy="117" rx="9" ry="8" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left thigh */}
      <rect x="34" y="170" width="22" height="70" rx="7" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right thigh */}
      <rect x="64" y="170" width="22" height="70" rx="7" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left knee */}
      <ellipse cx="45" cy="244" rx="14" ry="10" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right knee */}
      <ellipse cx="75" cy="244" rx="14" ry="10" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left shin */}
      <rect x="37" y="254" width="18" height="54" rx="6" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right shin */}
      <rect x="65" y="254" width="18" height="54" rx="6" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Left foot */}
      <ellipse cx="44" cy="315" rx="16" ry="9" fill={skin} stroke={outline} strokeWidth="1.5" />
      {/* Right foot */}
      <ellipse cx="76" cy="315" rx="16" ry="9" fill={skin} stroke={outline} strokeWidth="1.5" />

      {/* Injury hotspot */}
      {hotspot && (
        <>
          <circle
            cx={hotspot.cx} cy={hotspot.cy} r={hotspot.r + 10}
            fill="rgba(239,68,68,0.12)"
            className="origin-center animate-ping"
            style={{ transformOrigin: `${hotspot.cx}px ${hotspot.cy}px` }}
          />
          <circle
            cx={hotspot.cx} cy={hotspot.cy} r={hotspot.r}
            fill="rgba(239,68,68,0.3)"
            stroke="#EF4444" strokeWidth="2.5"
            className="animate-pulse"
          />
          <circle cx={hotspot.cx} cy={hotspot.cy} r="4.5" fill="#DC2626" />
        </>
      )}
    </svg>
  );
}

// ─── Treatment Tree ───────────────────────────────────────────────────────────
const PHASE_STYLES = {
  red:   { bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-500',   body: 'text-red-700',   head: 'text-red-900'   },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', body: 'text-amber-700', head: 'text-amber-900' },
  green: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', body: 'text-green-700', head: 'text-green-900' },
};

const WHY_EMOJIS = ['⚡', '💪', '🔄', '🏃', '😴'];
const NEXT_EMOJIS = { Today: '🚀', 'This Week': '📅', 'Next Month': '🗓️', 'This Month': '🎯' };

function RevealSection({ visible, children }) {
  return (
    <div className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none select-none'}`}>
      {children}
    </div>
  );
}

function Connector({ visible }) {
  return (
    <div className={`flex flex-col items-center my-1 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-px h-6 bg-slate-300" />
      <div className="w-2 h-2 rounded-full bg-slate-300" />
      <div className="w-px h-4 bg-slate-300" />
    </div>
  );
}

function CTAButton({ onClick, label, emoji }) {
  return (
    <div className="flex flex-col items-center my-2">
      <div className="w-px h-5 bg-slate-300" />
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
      >
        <span>{emoji}</span>
        <span>{label}</span>
        <span className="text-slate-400">↓</span>
      </button>
      <div className="w-px h-4 bg-slate-300" />
    </div>
  );
}

function TreatmentTree({ data, injury, onStartOver }) {
  const [show, setShow] = useState({ why: false, solution: false, nextSteps: false });
  const reveal = (key) => setShow(v => ({ ...v, [key]: true }));

  const sev = data.diagnosis?.severity;
  const sevStyle = sev === 'severe'
    ? 'bg-red-100 text-red-700'
    : sev === 'moderate'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-green-100 text-green-700';
  const sevEmoji = sev === 'severe' ? '🔴' : sev === 'moderate' ? '🟡' : '🟢';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Treatment Plan</h2>
          <p className="text-sm text-slate-500 mt-0.5">Click each section to explore your recovery journey</p>
        </div>
        <button
          onClick={onStartOver}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Assessment
        </button>
      </div>

      {/* ── Node 1: Diagnosis + Body Diagram ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
        <div className="flex gap-0 min-h-[180px]">
          {/* Body diagram with injury highlight */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center min-w-[160px] w-[160px] shrink-0 border-r border-slate-200 py-4">
            <BodyDiagram bodyRegion={injury?.body_part} side={/\bleft\b/i.test(injury?.body_part) ? 'left' : /\bright\b/i.test(injury?.body_part) ? 'right' : null} />
          </div>

          {/* Diagnosis info */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Diagnosis</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{data.diagnosis?.title}</h3>
            <p className="text-slate-400 text-sm italic mt-1">"{data.diagnosis?.tagline}"</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${sevStyle}`}>
                {sevEmoji} {sev?.charAt(0).toUpperCase() + sev?.slice(1)} severity
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                ⏱ {data.diagnosis?.healingTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA → Why */}
      {!show.why && (
        <CTAButton onClick={() => reveal('why')} label="Why did this happen?" emoji="🤔" />
      )}
      {show.why && <Connector visible />}

      {/* ── Node 2: Why ── */}
      <RevealSection visible={show.why}>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm p-6">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-4">Why It Happened</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.why?.map((cause, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                <div className="text-2xl mb-2">{WHY_EMOJIS[i] || '•'}</div>
                <p className="text-sm font-medium text-slate-700 leading-snug">{cause}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* CTA → Solution */}
      {show.why && !show.solution && (
        <CTAButton onClick={() => reveal('solution')} label="Show me the fix" emoji="💊" />
      )}
      {show.solution && <Connector visible />}

      {/* ── Node 3: Solution ── */}
      <RevealSection visible={show.solution}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Your Recovery Plan</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.solution?.map((phase, i) => {
              const s = PHASE_STYLES[phase.colorKey] || PHASE_STYLES.green;
              return (
                <div key={i} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${s.head}`}>{phase.phase}</span>
                  </div>
                  <div className={`text-xs mb-3 font-medium ${s.body}`}>{phase.timeline}</div>
                  <ul className="space-y-1.5">
                    {phase.actions?.map((action, j) => (
                      <li key={j} className={`text-sm flex items-start gap-1.5 ${s.body}`}>
                        <span className="mt-0.5 shrink-0 font-bold">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* CTA → Next Steps */}
      {show.solution && !show.nextSteps && (
        <CTAButton onClick={() => reveal('nextSteps')} label="Get my action plan" emoji="⚡" />
      )}
      {show.nextSteps && <Connector visible />}

      {/* ── Node 4: Next Steps ── */}
      <RevealSection visible={show.nextSteps}>
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200 shadow-sm p-6">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4">Your Next Steps</div>
          <div className="space-y-3">
            {data.nextSteps?.map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                <div className="text-xl shrink-0">{NEXT_EMOJIS[step.when] || '📌'}</div>
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{step.when}</div>
                  <div className="text-sm font-medium text-slate-700">{step.action}</div>
                </div>
              </div>
            ))}
          </div>
          {data.redFlag && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">
                <span className="font-bold">⚠️ See a doctor if: </span>{data.redFlag}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button onClick={onStartOver} className="text-slate-400 text-sm hover:text-slate-600 underline transition-colors">
            Start a new assessment
          </button>
        </div>
      </RevealSection>
    </div>
  );
}

// ─── Payment ──────────────────────────────────────────────────────────────────
function CheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (stripeErr) {
      setError(stripeErr.message);
      setLoading(false);
    } else {
      localStorage.setItem(ACCESS_KEY, 'true');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-base shadow-md"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : 'Pay $35 — Unlock Lifetime Access'}
      </button>
    </form>
  );
}

function PaymentModal({ onSuccess }) {
  const [clientSecret, setClientSecret] = useState('');
  const [fetchError, setFetchError] = useState('');
  const stripe = getStripe();

  useEffect(() => {
    fetch('/api/payment', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setFetchError(data.error || 'Failed to initialize payment.');
      })
      .catch(() => setFetchError('Network error. Please try again.'));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Unlock Lifetime Access</h2>
          <p className="text-slate-500 mt-1 text-sm">One payment. Unlimited assessments forever.</p>
        </div>

        {/* Price card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">AI Physiotherapist</div>
              <div className="text-sm text-slate-500 mt-0.5">Lifetime access · Unlimited use</div>
            </div>
            <div className="text-3xl font-black text-blue-600">$35</div>
          </div>
          <div className="flex gap-2 mt-3">
            {['VISA', 'MC', 'AMEX'].map(card => (
              <span key={card} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-600 shadow-sm">
                {card}
              </span>
            ))}
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {!clientSecret && !fetchError && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {clientSecret && stripe && (
          <Elements stripe={stripe} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#2563eb', borderRadius: '10px' } } }}>
            <CheckoutForm onSuccess={onSuccess} />
          </Elements>
        )}

        {!stripe && clientSecret && (
          <div className="text-sm text-red-600 text-center py-4">
            Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment.
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-4">
          🔒 Secured by Stripe · We never store your card details
        </p>
      </div>
    </div>
  );
}

// ─── Shared field components ──────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="mb-5">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
        {label}
        {hint && <span className="font-normal text-slate-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] bg-slate-50/80 shadow-sm transition-all placeholder:text-slate-400';

function Input({ value, onChange, placeholder, type = 'text' }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={inputCls + ' resize-y'} />;
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputCls + ' appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22/%3E%3C/svg%3E")] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10'}>
      <option value="">Select...</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Slider({ value, onChange }) {
  const color = value <= 3 ? 'text-green-600' : value <= 6 ? 'text-amber-600' : 'text-red-600';
  const bg = value <= 3 ? 'bg-green-50' : value <= 6 ? 'bg-amber-50' : 'bg-red-50';
  return (
    <div>
      <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
        <span>0 — None</span>
        <span className={`font-bold text-base px-3 py-0.5 rounded-full ${color} ${bg}`}>{value}/10</span>
        <span>10 — Severe</span>
      </div>
      <input type="range" min={0} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full custom-slider" />
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { label: 'Profile', icon: '👤' },
    { label: 'Injury', icon: '🩹' },
    { label: 'Results', icon: '📊' },
  ];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map(({ label, icon }, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                active
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100'
                  : done
                  ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
              }`}>
                {done ? '✓' : icon}
              </div>
              <span className={`text-xs font-semibold tracking-wide transition-colors ${
                active ? 'text-blue-700' : done ? 'text-emerald-600' : 'text-slate-400'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-0.5 rounded-full mx-3 mb-5 transition-colors duration-300 ${
                step > num ? 'bg-gradient-to-r from-emerald-400 to-blue-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 0: Disclaimer ───────────────────────────────────────────────────────
function DisclaimerStep({ onContinue }) {
  return (
    <>
      <ShaderBackground />
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30 overflow-hidden">
            <img src="/logo.png" alt="Physio AI Pal" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Physio AI Pal</h1>
          <p className="text-white/70 mt-2 text-lg">Personalized injury assessment and rehab planning</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-4">
          <h2 className="text-lg font-bold text-amber-300 mb-3">Medical Disclaimer</h2>
          <ul className="text-sm text-white/80 space-y-2">
            <li>This tool provides AI-generated guidance for <strong className="text-white">educational purposes only</strong>. It is not a substitute for professional medical diagnosis or treatment.</li>
            <li>Always consult a licensed physiotherapist or physician before beginning any rehabilitation program.</li>
            <li>If your condition worsens at any point, stop all exercises and seek professional care.</li>
          </ul>
        </div>

        <div className="bg-red-900/30 backdrop-blur-md border border-red-400/30 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-bold text-red-300 mb-2 uppercase tracking-wide">Seek Emergency Care Immediately If You Have:</h2>
          <ul className="text-sm text-red-200/80 space-y-1">
            <li>Severe pain, inability to move a limb, or visible deformity</li>
            <li>Loss of bladder or bowel control</li>
            <li>Chest pain, difficulty breathing, or signs of a stroke</li>
            <li>Numbness or tingling spreading into both legs</li>
          </ul>
        </div>

        <button onClick={onContinue} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-6 rounded-xl transition-all text-base shadow-lg hover:shadow-xl">
          I Understand, Continue →
        </button>
      </div>
    </>
  );
}

// ─── Step 1: Profile ──────────────────────────────────────────────────────────
function SectionCard({ icon, title, color, delay, children }) {
  const colors = {
    blue: 'border-t-blue-500',
    emerald: 'border-t-emerald-500',
    rose: 'border-t-rose-500',
    purple: 'border-t-purple-500',
    amber: 'border-t-amber-500',
  };
  const iconBg = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    rose: 'bg-rose-100 text-rose-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 border-t-[3px] ${colors[color]} p-6 mb-5 card-hover shadow-sm animate-slideUp${delay ? `-${delay}` : ''}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${iconBg[color]}`}>{icon}</div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ProfileStep({ profile, onChange, onNext }) {
  const set = (section, field) => val => onChange({ ...profile, [section]: { ...profile[section], [field]: val } });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Your Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Saved locally in your browser. All fields optional.</p>
      </div>

      <SectionCard icon="👤" title="Personal" color="blue" delay="">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" hint="years"><Input value={profile.personal.age} onChange={set('personal', 'age')} placeholder="e.g. 28" type="number" /></Field>
          <Field label="Sex"><Select value={profile.personal.sex} onChange={set('personal', 'sex')} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} /></Field>
          <Field label="Height" hint="cm"><Input value={profile.personal.height_cm} onChange={set('personal', 'height_cm')} placeholder="e.g. 178" type="number" /></Field>
          <Field label="Weight" hint="kg"><Input value={profile.personal.weight_kg} onChange={set('personal', 'weight_kg')} placeholder="e.g. 75" type="number" /></Field>
        </div>
      </SectionCard>

      <SectionCard icon="🏋️" title="Fitness Background" color="emerald" delay="1">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fitness Level">
            <Select value={profile.fitness.level} onChange={set('fitness', 'level')} options={[
              { value: 'sedentary', label: 'Sedentary' }, { value: 'lightly_active', label: 'Lightly Active' },
              { value: 'moderately_active', label: 'Moderately Active' }, { value: 'athlete', label: 'Athlete' },
              { value: 'elite_athlete', label: 'Elite Athlete' },
            ]} />
          </Field>
          <Field label="Primary Activity"><Input value={profile.fitness.primary_activity} onChange={set('fitness', 'primary_activity')} placeholder="e.g. running, weightlifting" /></Field>
          <Field label="Training Frequency" hint="days/week"><Input value={profile.fitness.training_frequency_per_week} onChange={set('fitness', 'training_frequency_per_week')} placeholder="e.g. 5" type="number" /></Field>
          <Field label="Years Training"><Input value={profile.fitness.years_of_training} onChange={set('fitness', 'years_of_training')} placeholder="e.g. 4" type="number" /></Field>
        </div>
      </SectionCard>

      <SectionCard icon="🏥" title="Medical History" color="rose" delay="2">
        <Field label="Current Medications" hint="comma-separated"><Input value={profile.medical.current_medications} onChange={set('medical', 'current_medications')} placeholder="e.g. ibuprofen" /></Field>
        <Field label="Relevant Medical History" hint="comma-separated"><Input value={profile.medical.relevant_medical_history} onChange={set('medical', 'relevant_medical_history')} placeholder="e.g. diabetes" /></Field>
        <Field label="Previous Injuries" hint="comma-separated"><Input value={profile.medical.previous_injuries} onChange={set('medical', 'previous_injuries')} placeholder="e.g. left ACL tear 2021" /></Field>
        <Field label="Surgeries" hint="comma-separated"><Input value={profile.medical.surgeries} onChange={set('medical', 'surgeries')} placeholder="e.g. appendectomy 2018" /></Field>
      </SectionCard>

      <button onClick={onNext} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2">
        Continue to Injury Description
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      </button>
    </div>
  );
}

// ─── Step 2: Injury ───────────────────────────────────────────────────────────
function InjuryStep({ injury, onChange, onNext, onBack, loading }) {
  const set = field => val => onChange({ ...injury, [field]: val });
  const valid = injury.body_part.trim() && injury.description.trim();

  const painBg = (v) => v <= 3 ? 'from-green-50/50 to-emerald-50/30' : v <= 6 ? 'from-amber-50/50 to-yellow-50/30' : 'from-red-50/50 to-rose-50/30';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Describe Your Injury</h2>
        <p className="text-slate-500 text-sm mt-1">The more detail you provide, the more accurate your plan will be.</p>
      </div>

      <SectionCard icon="📍" title="Injury Details" color="purple" delay="">
        <Field label="Body Part Affected" hint="required"><Input value={injury.body_part} onChange={set('body_part')} placeholder="e.g. left knee, lower back, right shoulder" /></Field>
        <Field label="Description" hint="required — describe what happened and what you feel"><Textarea value={injury.description} onChange={set('description')} placeholder="e.g. Twisted my ankle stepping off a curb. Sharp pain on the outer side, some swelling." rows={4} /></Field>
        <Field label="How Long Have You Had This Issue?"><Input value={injury.duration} onChange={set('duration')} placeholder="e.g. 2 days, 3 weeks, 2 months" /></Field>
      </SectionCard>

      <SectionCard icon="🔥" title="Pain Levels" color="amber" delay="1">
        <div className={`rounded-xl p-4 mb-4 bg-gradient-to-r ${painBg(Math.max(injury.pain_rest, injury.pain_movement))} transition-colors duration-500`}>
          <Field label="Pain at Rest"><Slider value={injury.pain_rest} onChange={set('pain_rest')} /></Field>
          <Field label="Pain with Movement"><Slider value={injury.pain_movement} onChange={set('pain_movement')} /></Field>
        </div>
      </SectionCard>

      <SectionCard icon="📋" title="More Details" color="blue" delay="2">
        <Field label="What Makes It Worse?"><Input value={injury.worse} onChange={set('worse')} placeholder="e.g. stairs, prolonged sitting, twisting" /></Field>
        <Field label="What Makes It Better?"><Input value={injury.better} onChange={set('better')} placeholder="e.g. rest, ice, elevation" /></Field>
        <Field label="How Did It Start?">
          <div className="flex gap-3">
            {[['sudden', '⚡ Sudden (acute)'], ['gradual', '🔄 Gradual (overuse)']].map(([val, label]) => (
              <button key={val} onClick={() => set('onset')(val)} className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${injury.onset === val ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-500/20 scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}>
                {label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Previous Occurrence?"><Input value={injury.previous} onChange={set('previous')} placeholder="e.g. Yes, same ankle 2 years ago / No" /></Field>
        <Field label="Current Limitations"><Input value={injury.limitations} onChange={set('limitations')} placeholder="e.g. cannot run, difficult to lift overhead" /></Field>
        <Field label="Treatments Already Tried"><Input value={injury.treatments_tried} onChange={set('treatments_tried')} placeholder="e.g. ice, rest, ibuprofen" /></Field>
      </SectionCard>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-none px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid || loading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Plan...
            </span>
          ) : (
            <>
              Generate Treatment Plan
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Results loading / error ───────────────────────────────────────────────────
function LoadingResults() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🏥</div>
      </div>
      <p className="text-base font-medium text-slate-600">Analyzing your injury...</p>
      <p className="text-sm mt-1">Building your personalized plan</p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [injury, setInjury] = useState(DEFAULT_INJURY);
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
      setHasAccess(localStorage.getItem(ACCESS_KEY) === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
  }, [profile]);

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    setPlanData(null);
    setStep(3);

    const normalizedProfile = {
      ...profile,
      medical: {
        current_medications: profile.medical.current_medications?.split(',').map(s => s.trim()).filter(Boolean) || [],
        relevant_medical_history: profile.medical.relevant_medical_history?.split(',').map(s => s.trim()).filter(Boolean) || [],
        previous_injuries: profile.medical.previous_injuries?.split(',').map(s => s.trim()).filter(Boolean) || [],
        surgeries: profile.medical.surgeries?.split(',').map(s => s.trim()).filter(Boolean) || [],
      },
    };

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: normalizedProfile, injury }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      const parsed = JSON.parse(data.plan);
      setPlanData(parsed);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (hasAccess) {
      generatePlan();
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    setHasAccess(true);
    setShowPayment(false);
    generatePlan();
  };

  const handleStartOver = () => {
    setInjury(DEFAULT_INJURY);
    setPlanData(null);
    setError('');
    setStep(2);
  };

  return (
    <main className={`min-h-screen py-10 px-4 ${step === 0 ? 'bg-transparent' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40'}`}>
      {showPayment && <PaymentModal onSuccess={handlePaymentSuccess} />}

      <div className="max-w-4xl mx-auto">
        {step === 0 && <DisclaimerStep onContinue={() => setStep(1)} />}

        {step > 0 && step < 3 && <StepIndicator step={step} />}

        {step === 1 && (
          <ProfileStep profile={profile} onChange={setProfile} onNext={() => setStep(2)} />
        )}

        {step === 2 && (
          <InjuryStep
            injury={injury}
            onChange={setInjury}
            onNext={handleGenerateClick}
            onBack={() => setStep(1)}
            loading={loading}
          />
        )}

        {step === 3 && loading && <LoadingResults />}

        {step === 3 && error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
            <button onClick={handleStartOver} className="mt-4 w-full border border-slate-300 rounded-xl py-3 text-slate-600 hover:bg-slate-50">
              Try Again
            </button>
          </div>
        )}

        {step === 3 && !loading && planData && (
          <TreatmentTree data={planData} injury={injury} onStartOver={handleStartOver} />
        )}
      </div>
    </main>
  );
}
