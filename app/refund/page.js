import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy — Physio AI Pal',
};

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Refund Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: March 17, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Overview</h2>
              <p>Physio AI Pal offers a one-time payment of <strong>$35 CAD</strong> for lifetime access to our AI-powered physiotherapy assessment tool. We want you to be satisfied with your purchase.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Refund Eligibility</h2>
              <p>You may request a full refund within <strong>7 days</strong> of your purchase date if:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Service did not work as described (e.g., technical errors preventing assessment generation).</li>
                <li>You were charged incorrectly or multiple times.</li>
                <li>You are unsatisfied with the quality of the Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">How to Request a Refund</h2>
              <p>To request a refund, email us at <a href="mailto:support@physioaipal.com" className="text-blue-600 hover:underline">support@physioaipal.com</a> with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your email address used during payment.</li>
                <li>The approximate date of purchase.</li>
                <li>A brief reason for the refund request.</li>
              </ul>
              <p>We aim to process all refund requests within <strong>3-5 business days</strong>.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Refund Method</h2>
              <p>Approved refunds will be credited back to the original payment method (Visa, Mastercard, or Amex) used at the time of purchase. Please allow 5-10 business days for the refund to appear on your statement, depending on your card issuer.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">After a Refund</h2>
              <p>Once a refund is processed, your lifetime access will be revoked. You may repurchase at any time if you wish to regain access.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Contact</h2>
              <p>For any billing questions or concerns, reach us at <a href="mailto:support@physioaipal.com" className="text-blue-600 hover:underline">support@physioaipal.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
