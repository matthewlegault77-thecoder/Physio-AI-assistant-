'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import ShaderBackground from '../components/ui/shader-background';
import { SplineScene } from '../components/ui/spline-scene';
import TreatmentChatbot from '../components/ui/treatment-chatbot';
import { ContainerScroll } from '../components/ui/container-scroll-animation';

const SPLINE_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

// ─── Constants ────────────────────────────────────────────────────────────────
const PROFILE_KEY = 'physio_ai_profile';

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
    <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.97] pointer-events-none select-none'}`}>
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
    <div className="flex flex-col items-center my-2 animate-fadeIn">
      <div className="w-px h-5 bg-gradient-to-b from-slate-300 to-indigo-300" />
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-semibold rounded-full hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/20"
      >
        <span>{emoji}</span>
        <span>{label}</span>
        <svg className="w-3.5 h-3.5 text-slate-400 animate-bounce" style={{ animationDuration: '2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      </button>
      <div className="w-px h-4 bg-gradient-to-b from-indigo-300 to-slate-300" />
    </div>
  );
}

function TreatmentTree({ data, injury, onStartOver }) {
  const [show, setShow] = useState({ why: false, solution: false, nextSteps: false });
  const [showInfo, setShowInfo] = useState(false);
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
          <h2 className="text-2xl font-bold text-slate-900">Step Into a Stronger You Today</h2>
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
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-xl font-bold text-slate-900">{data.diagnosis?.title}</h3>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${showInfo ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : 'bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600'}`}
                aria-label="More info about this condition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a6 6 0 00-2.47 11.47c.24.14.47.36.62.63.15.26.35.9.35.9h3c0 0 .2-.64.35-.9.15-.27.38-.49.62-.63A6 6 0 0010 2zM8 16.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zm.5 1.5a.5.5 0 000 1h3a.5.5 0 000-1h-3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {showInfo && data.diagnosis?.summary && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 animate-fadeIn">
                <p className="text-sm text-amber-800 leading-relaxed">
                  <span className="font-semibold">💡 What is this?</span> {data.diagnosis.summary}
                </p>
              </div>
            )}
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

      {/* Chatbot */}
      <TreatmentChatbot planData={data} />
    </div>
  );
}

// ─── Payment ──────────────────────────────────────────────────────────────────
function PaymentModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-base shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting to checkout...
            </span>
          ) : 'Pay $35 — Unlock Lifetime Access'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>

        <p className="text-xs text-slate-400 text-center mt-4">
          Secured by Stripe · We never store your card details
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
    { label: 'Account', icon: '🔐' },
    { label: 'Results', icon: '📊' },
  ];
  return (
    <div className="flex items-center justify-center mb-10 animate-fadeIn">
      {steps.map(({ label, icon }, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                {active && (
                  <div className="absolute inset-0 rounded-full bg-indigo-400/30 animate-breathe" style={{ margin: '-4px' }} />
                )}
                <div className={`relative w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  active
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-100'
                    : done
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                }`}>
                  {done ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : icon}
                </div>
              </div>
              <span className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
                active ? 'text-indigo-700' : done ? 'text-emerald-600' : 'text-slate-400'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative w-16 mx-3 mb-5">
                <div className="h-0.5 rounded-full bg-slate-200 w-full" />
                <div
                  className="absolute top-0 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400 transition-all duration-700 ease-out"
                  style={{ width: step > num ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Floating Particles ──────────────────────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-slow"
          style={{
            width: `${4 + i * 2}px`,
            height: `${4 + i * 2}px`,
            background: `radial-gradient(circle, rgba(139, 92, 246, ${0.3 + i * 0.05}), transparent)`,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + i * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Step 0: Disclaimer ───────────────────────────────────────────────────────
function DisclaimerStep({ onContinue }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <ShaderBackground />
      <FloatingParticles />
      <div className={`max-w-2xl mx-auto relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-10">
          {/* Logo with breathing ring */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-breathe" style={{ margin: '-8px' }} />
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-breathe" style={{ margin: '-16px', animationDelay: '1s' }} />
            <div className="relative inline-flex items-center justify-center w-28 h-28 bg-white/15 backdrop-blur-md rounded-full border border-white/25 overflow-hidden shadow-2xl animate-glowPulse">
              <img src="/logo.png" alt="Physio AI Pal" className="w-18 h-18 object-contain" />
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
            Physio <span className="text-gradient-animated">AI</span> Pal
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="ai-dot" />
            <div className="ai-dot" />
            <div className="ai-dot" />
            <p className="text-white/60 text-lg font-light ml-2">AI-powered injury assessment & rehab</p>
          </div>
        </div>

        <div className={`glass-card rounded-2xl p-6 mb-4 animate-glowPulse transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-lg font-bold text-amber-300">Medical Disclaimer</h2>
          </div>
          <ul className="text-sm text-white/80 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 shrink-0">&#9656;</span>
              This tool provides AI-generated guidance for <strong className="text-white">educational purposes only</strong>. It is not a substitute for professional medical diagnosis or treatment.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 shrink-0">&#9656;</span>
              Always consult a licensed physiotherapist or physician before beginning any rehabilitation program.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 shrink-0">&#9656;</span>
              If your condition worsens at any point, stop all exercises and seek professional care.
            </li>
          </ul>
        </div>

        <div className={`bg-red-950/40 backdrop-blur-md border border-red-400/20 rounded-2xl p-6 mb-8 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <h2 className="text-sm font-bold text-red-300 uppercase tracking-wide">Seek Emergency Care Immediately If You Have:</h2>
          </div>
          <ul className="text-sm text-red-200/80 space-y-1.5">
            <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">!</span> Severe pain, inability to move a limb, or visible deformity</li>
            <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">!</span> Loss of bladder or bowel control</li>
            <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">!</span> Chest pain, difficulty breathing, or signs of a stroke</li>
            <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">!</span> Numbness or tingling spreading into both legs</li>
          </ul>
        </div>

        <button
          onClick={onContinue}
          className={`w-full shimmer-btn bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 backdrop-blur-sm border border-white/20 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 text-base shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          I Understand, Continue &rarr;
        </button>

        <p className="text-center text-white/30 text-xs mt-6 tracking-wide">Powered by advanced AI models</p>
      </div>
    </>
  );
}

// ─── Step 1: Profile ──────────────────────────────────────────────────────────
function SectionCard({ icon, title, color, delay, children }) {
  const colors = {
    blue: 'border-t-indigo-500',
    emerald: 'border-t-emerald-500',
    rose: 'border-t-rose-500',
    purple: 'border-t-violet-500',
    amber: 'border-t-amber-500',
  };
  const iconBg = {
    blue: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const glowColor = {
    blue: 'hover:shadow-indigo-100/50',
    emerald: 'hover:shadow-emerald-100/50',
    rose: 'hover:shadow-rose-100/50',
    purple: 'hover:shadow-violet-100/50',
    amber: 'hover:shadow-amber-100/50',
  };
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 border-t-[3px] ${colors[color]} p-6 mb-5 card-hover shadow-sm ${glowColor[color]} animate-revealUp${delay ? `-${delay}` : ''}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${iconBg[color]} shadow-sm`}>{icon}</div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ProfileStep({ profile, onChange, onNext }) {
  const set = (section, field) => val => onChange({ ...profile, [section]: { ...profile[section], [field]: val } });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center animate-fadeIn">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Profile</h2>
        <p className="text-slate-400 text-sm mt-2">Saved locally in your browser. All fields optional.</p>
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

      <button onClick={onNext} className="w-full shimmer-btn bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
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
      <div className="mb-8 text-center animate-fadeIn">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Describe Your Injury</h2>
        <p className="text-slate-400 text-sm mt-2">The more detail you provide, the more accurate your AI plan will be.</p>
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
        <Field label="What Have You Already Tried?"><Input value={injury.treatments_tried} onChange={set('treatments_tried')} placeholder="e.g. ice, rest, ibuprofen" /></Field>
      </SectionCard>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-none px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid || loading}
          className="flex-1 shimmer-btn bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Plan...
            </span>
          ) : (
            <>
              Continue to Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Account & Access ────────────────────────────────────────────────
function AccountStep({ user, hasAccess, freeGenerationUsed, authLoading, onGenerate, onPay, onBack }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (isSignUp) {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Signup failed');
        setSubmitting(false);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setSubmitting(false);
        return;
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }
    }
    setSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 mt-4">Checking account...</p>
      </div>
    );
  }

  // Logged in — show account status
  if (user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Your Account</h2>
          <p className="text-slate-500 text-sm mt-1">Review your account before generating your plan.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 p-6 mb-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-emerald-100 text-emerald-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Signed In</h3>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{user.email}</span>
            </p>
          </div>
        </div>

        {hasAccess ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-blue-100 text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Lifetime Access</h3>
                <p className="text-xs text-slate-500 mt-0.5">You already have unlimited access.</p>
              </div>
            </div>
          </div>
        ) : !freeGenerationUsed ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-emerald-100 text-emerald-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Free Trial Available</h3>
                <p className="text-xs text-slate-500 mt-0.5">Try 1 time for free, then $35 for lifetime access.</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-sm text-emerald-800">
                Get <span className="font-bold">1 free rehab plan</span> to see how it works. Love it? Pay <span className="font-bold">$35</span> to unlock lifetime access.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-amber-100 text-amber-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Payment Required</h3>
                <p className="text-xs text-slate-500 mt-0.5">You&apos;ve used your free plan.</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
              <p className="text-sm text-amber-800">
                You&apos;ve used your free rehab plan. Pay <span className="font-bold">$35</span> to unlock lifetime access and generate unlimited plans.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-none px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
            Back
          </button>
          {hasAccess ? (
            <button
              onClick={onGenerate}
              className="flex-1 shimmer-btn bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Begin Your Recovery
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </button>
          ) : !freeGenerationUsed ? (
            <button
              onClick={onGenerate}
              className="flex-1 shimmer-btn bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Generate 1 Free Rehab Plan
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </button>
          ) : (
            <button
              onClick={onPay}
              className="flex-1 shimmer-btn bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Unlock Lifetime Access — $35
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Not logged in — show inline login/signup form
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          {isSignUp ? 'Create Your Account' : 'Sign In to Continue'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {isSignUp
            ? 'Create an account to get your AI physiotherapy assessment.'
            : 'Sign in to access your assessments and generate your plan.'}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 border-t-[3px] border-t-blue-500 p-6 mb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Your password'}
              required
              minLength={6}
              className={inputCls}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-base shadow-md"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
          Back
        </button>
      </div>
    </div>
  );
}

// ─── Results loading / error ───────────────────────────────────────────────────
function LoadingResults() {
  const [dots, setDots] = useState('');
  const [phase, setPhase] = useState(0);
  const phases = ['Analyzing your injury data', 'Consulting AI models', 'Building your recovery plan', 'Personalizing recommendations'];

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    const phaseTimer = setInterval(() => setPhase(p => (p + 1) % phases.length), 3000);
    return () => { clearInterval(dotTimer); clearInterval(phaseTimer); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 animate-scaleIn">
      <div className="relative mb-8">
        {/* Outer breathing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-indigo-200/50 animate-breathe" style={{ margin: '-12px' }} />
        <div className="absolute inset-0 rounded-full border border-violet-300/30 animate-breathe" style={{ margin: '-24px', animationDelay: '1s' }} />

        {/* Main spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-violet-500 animate-spin" style={{ animationDuration: '1.2s' }} />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-violet-400 border-l-indigo-400 animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-lg font-semibold text-slate-700 transition-all duration-500">{phases[phase]}{dots}</p>
      <p className="text-sm text-slate-400 mt-2">This usually takes 10-15 seconds</p>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full" style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s ease-in-out infinite, loading-expand 15s ease-out forwards',
        }} />
      </div>

      <style jsx>{`
        @keyframes loading-expand {
          0% { width: 5%; }
          30% { width: 40%; }
          60% { width: 65%; }
          80% { width: 80%; }
          100% { width: 95%; }
        }
      `}</style>
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
  const [freeGenerationUsed, setFreeGenerationUsed] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check Supabase auth + paid status on mount
  useEffect(() => {
    // Load saved profile from localStorage (just UI state, not auth)
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch {}

    async function checkAuth() {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        setUser(data.user);
        setHasAccess(data.hasAccess);
        setFreeGenerationUsed(data.freeGenerationUsed ?? false);
      } catch {
        setUser(null);
        setHasAccess(false);
        setFreeGenerationUsed(false);
      }
      setAuthLoading(false);
    }

    checkAuth();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newUser = session?.user ?? null;
        if (!newUser) {
          setUser(null);
          setHasAccess(false);
          setFreeGenerationUsed(false);
        } else {
          try {
            const res = await fetch('/api/me');
            const data = await res.json();
            setUser(data.user);
            setHasAccess(data.hasAccess);
            setFreeGenerationUsed(data.freeGenerationUsed ?? false);
          } catch {
            setUser(newUser);
            setHasAccess(false);
            setFreeGenerationUsed(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle return from Stripe Checkout — verify payment directly, then poll
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success' || !user || hasAccess) return;

    const sessionId = params.get('session_id');
    window.history.replaceState({}, '', window.location.pathname);
    setVerifyingPayment(true);

    const verify = async () => {
      // First, try verifying directly with Stripe (doesn't depend on webhook)
      if (sessionId) {
        try {
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (data.paid) {
            setHasAccess(true);
            setVerifyingPayment(false);
            return;
          }
        } catch {}
      }

      // Fallback: poll /api/me in case webhook already handled it
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch('/api/me');
          const data = await res.json();
          if (data.hasAccess) {
            setHasAccess(true);
            setVerifyingPayment(false);
            clearInterval(poll);
            return;
          }
        } catch {}

        if (attempts >= 8) {
          setVerifyingPayment(false);
          clearInterval(poll);
        }
      }, 2000);

      return () => clearInterval(poll);
    };

    verify();
  }, [user, hasAccess]);

  useEffect(() => {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
  }, [profile]);

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    setPlanData(null);
    setStep(4);

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
        if (res.status === 401) {
          setError('Please sign in to continue.');
          router.push('/login');
          return;
        }
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      const parsed = JSON.parse(data.plan);
      setPlanData(parsed);
      // Mark free trial as used in frontend state
      if (!hasAccess) setFreeGenerationUsed(true);
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

  const handlePaymentClose = () => {
    setShowPayment(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasAccess(false);
    setStep(0);
  };

  const handleStartOver = () => {
    setInjury(DEFAULT_INJURY);
    setPlanData(null);
    setError('');
    setStep(2);
  };

  return (
    <main className={`min-h-screen py-10 px-4 transition-colors duration-700 ${step === 0 ? 'bg-transparent' : 'bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/30'}`}>
      {/* User bar */}
      {user && (
        <div className="fixed top-4 right-4 flex items-center gap-3 z-30 animate-fadeIn">
          <span className="text-sm text-slate-500 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-slate-200/60">
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-slate-600 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Payment verifying overlay */}
      {verifyingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900">Verifying your payment...</h2>
            <p className="text-sm text-slate-500 mt-1">This usually takes just a moment.</p>
          </div>
        </div>
      )}

      {showPayment && <PaymentModal onClose={handlePaymentClose} />}

      <div className="max-w-4xl mx-auto">
        {step === 0 && <DisclaimerStep onContinue={() => setStep(1)} />}

        {step > 0 && step < 4 && <StepIndicator step={step} />}

        {step === 1 && (
          <div key="step-1" className="page-transition">
            <ContainerScroll
              titleComponent={
                <h1 className="text-4xl font-semibold text-slate-900">
                  Tell us about <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    Your Profile
                  </span>
                </h1>
              }
            >
              <div className="overflow-y-auto h-full p-4 md:p-6">
                <ProfileStep profile={profile} onChange={setProfile} onNext={() => setStep(2)} />
              </div>
            </ContainerScroll>
          </div>
        )}

        {step === 2 && (
          <div key="step-2" className="page-transition">
            <ContainerScroll
              titleComponent={
                <h1 className="text-4xl font-semibold text-slate-900">
                  Describe your <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    Injury Details
                  </span>
                </h1>
              }
            >
              <div className="overflow-y-auto h-full p-4 md:p-6">
                <InjuryStep
                  injury={injury}
                  onChange={setInjury}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                  loading={false}
                />
              </div>
            </ContainerScroll>
          </div>
        )}

        {step === 3 && (
          <div key="step-3" className="page-transition">
            <AccountStep
              user={user}
              hasAccess={hasAccess}
              freeGenerationUsed={freeGenerationUsed}
              authLoading={authLoading}
              onGenerate={generatePlan}
              onPay={() => setShowPayment(true)}
              onBack={() => setStep(2)}
            />
          </div>
        )}

        {step === 4 && loading && <LoadingResults />}

        {step === 4 && error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
            <button onClick={handleStartOver} className="mt-4 w-full border border-slate-300 rounded-xl py-3 text-slate-600 hover:bg-slate-50">
              Try Again
            </button>
          </div>
        )}

        {step === 4 && !loading && planData && (
          <TreatmentTree data={planData} injury={injury} onStartOver={handleStartOver} />
        )}
      </div>
    </main>
  );
}
