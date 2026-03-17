import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Physio AI Pal',
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: March 17, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Acceptance of Terms</h2>
              <p>By accessing or using Physio AI Pal (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">2. Description of Service</h2>
              <p>Physio AI Pal is an AI-powered tool that provides personalized injury assessments and rehabilitation guidance. The Service uses artificial intelligence to generate treatment plans based on the information you provide.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">3. Medical Disclaimer</h2>
              <p><strong>Physio AI Pal is for educational and informational purposes only.</strong> It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you read or received from this Service.</p>
              <p>If you are experiencing a medical emergency, call your local emergency number immediately.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">4. Payment &amp; Access</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Physio AI Pal offers a one-time payment of <strong>$35 CAD</strong> for lifetime access to unlimited assessments.</li>
                <li>Payment is processed securely through Stripe.</li>
                <li>&quot;Lifetime access&quot; means access for the lifetime of the Service. We reserve the right to discontinue the Service, in which case no further charges will be made.</li>
                <li>Access is granted to the device/browser used at the time of purchase via localStorage. Clearing your browser data may require contacting support to restore access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">5. User Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>You agree to provide accurate information when using the Service.</li>
                <li>You understand that AI-generated plans may contain errors and should be reviewed by a healthcare professional before following.</li>
                <li>You will not use the Service for emergency medical situations.</li>
                <li>You will not attempt to reverse-engineer, copy, or redistribute the Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">6. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, Physio AI Pal and its creators shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from your use of the Service, including but not limited to any injury, worsening of condition, or adverse outcome resulting from following AI-generated recommendations.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">7. Intellectual Property</h2>
              <p>All content, design, code, and AI models powering Physio AI Pal are the property of the Service operator. Treatment plans generated for you are yours to keep and use personally, but may not be commercially redistributed.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">8. Modifications</h2>
              <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">9. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of Canada, without regard to conflict of law principles.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">10. Contact</h2>
              <p>For questions about these Terms, contact us at <a href="mailto:support@physioaipal.com" className="text-blue-600 hover:underline">support@physioaipal.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
