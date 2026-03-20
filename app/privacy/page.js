import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Physio AI Pal',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: March 17, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Information We Collect</h2>
              <p><strong>Profile &amp; Injury Data:</strong> When you use Physio AI Pal, you may provide personal details (age, sex, height, weight), fitness background, medical history, and injury descriptions. This data is stored <strong>locally in your browser&apos;s localStorage</strong> and is never uploaded to or stored on our servers beyond what is needed to generate your recovery steps in a single request.</p>
              <p><strong>Payment Information:</strong> Payments are processed entirely by <strong>Stripe</strong>. We never receive, store, or have access to your full card number, CVV, or billing details. Stripe may collect your name, email, and payment method details under their own privacy policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To generate personalized AI-powered injury assessments and recovery steps.</li>
                <li>To process your one-time payment for lifetime access via Stripe.</li>
                <li>To improve the quality and accuracy of our service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">3. Data Storage &amp; Security</h2>
              <p>Your profile and injury data is stored in your browser&apos;s localStorage. We do not maintain a user database with your personal or medical information. When you submit an assessment, your data is sent to our server solely to generate your recovery steps via an AI model, and is not retained after the response is returned.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">4. Third-Party Services</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Stripe:</strong> Handles all payment processing. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe&apos;s Privacy Policy</a>.</li>
                <li><strong>Anthropic (Claude AI):</strong> Powers our AI assessment engine. Data sent to generate recovery steps is subject to <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic&apos;s Privacy Policy</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">5. Cookies</h2>
              <p>We use localStorage for saving your profile data locally. We do not use tracking cookies. Stripe may use cookies as part of their payment processing.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">6. Your Rights</h2>
              <p>Since your data is stored in your browser, you can delete it at any time by clearing your browser&apos;s localStorage or site data. No request to us is needed.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">7. Children&apos;s Privacy</h2>
              <p>Physio AI Pal is not intended for use by individuals under the age of 18. We do not knowingly collect information from children.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">8. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated date.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">9. Contact</h2>
              <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@physioaipal.com" className="text-blue-600 hover:underline">support@physioaipal.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
