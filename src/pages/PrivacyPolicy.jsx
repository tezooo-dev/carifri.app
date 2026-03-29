import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="space-y-3 text-slate-600 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
            <ArrowLeft size={16}/> Back
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">FL</div>
            <span className="font-bold text-slate-800 text-sm">FreightLink TMS</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={26} className="text-blue-600"/>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-slate-500">Last updated: {new Date().toLocaleDateString('en-US', { year:'numeric',month:'long',day:'numeric' })}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <Section title="1. Introduction">
            <p>
              FreightLink TMS ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Transport Management System platform.
            </p>
            <p>
              Please read this policy carefully. If you disagree with its terms, please discontinue use of the platform.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong className="text-slate-800">Account Information:</strong> When you create an account, we collect your name, email address, and a securely hashed password. We never store passwords in plain text.</p>
            <p><strong className="text-slate-800">Business Data:</strong> Load details (origins, destinations, commodity, freight amounts), carrier profiles (names, contacts, insurance certificates, contract terms), shipper details, and financial records you enter into the platform.</p>
            <p><strong className="text-slate-800">Usage Data:</strong> Pages visited, features used, session duration, and actions taken within the platform. This data is stored internally and never shared with third-party advertising platforms.</p>
            <p><strong className="text-slate-800">Device & Technical Data:</strong> IP address, browser type and version, operating system, and access timestamps for security and audit purposes.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, operate, and maintain the FreightLink TMS platform</li>
              <li>Process and manage freight loads, carrier assignments, and financial transactions</li>
              <li>Authenticate users and maintain session security via JWT tokens</li>
              <li>Generate reports and analytics for your brokerage operations</li>
              <li>Send transactional notifications related to your loads and account</li>
              <li>Improve platform performance, reliability, and features</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorised activity</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Data Storage and Security">
            <p>
              Your data is stored in a secured SQLite database hosted on servers you control (self-hosted deployment) or on our managed cloud infrastructure. We implement the following security measures:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All passwords are hashed using bcrypt with appropriate salt rounds</li>
              <li>Authentication uses short-lived JWT access tokens (8 hours) and long-lived refresh tokens (30 days)</li>
              <li>All data transmission uses HTTPS/TLS encryption</li>
              <li>Role-based access controls limit what each user can see and do</li>
              <li>Refresh tokens are invalidated on logout and stored securely server-side</li>
            </ul>
            <p>
              While we implement industry-standard security measures, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="5. Data Sharing and Disclosure">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-800">Within your organisation:</strong> Users with appropriate roles within your company account can access business data relevant to their permissions.</li>
              <li><strong className="text-slate-800">Legal requirements:</strong> We may disclose information if required by law, court order, or governmental authority.</li>
              <li><strong className="text-slate-800">Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
              <li><strong className="text-slate-800">With your consent:</strong> We may share information for any other purpose with your explicit consent.</li>
            </ul>
          </Section>

          <Section title="6. Cookies and Local Storage">
            <p>
              FreightLink TMS uses browser <strong className="text-slate-800">localStorage</strong> to store your refresh token (key: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">fl_refresh</code>) for session persistence. This token is cleared when you log out.
            </p>
            <p>
              We use a lightweight in-app analytics system that logs your page navigation and feature usage to our own database. We do not use third-party cookies or tracking pixels (e.g. Google Analytics, Meta Pixel).
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services. Business data (loads, carriers, shippers, financial records) is retained for as long as your organisation's account remains active and for a period required by applicable law thereafter.
            </p>
            <p>
              Analytics event data is retained for 90 days rolling. Refresh tokens expire after 30 days.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-800">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-slate-800">Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong className="text-slate-800">Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
              <li><strong className="text-slate-800">Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong className="text-slate-800">Objection:</strong> Object to processing of your personal data in certain circumstances</li>
            </ul>
            <p>To exercise these rights, contact us at <strong className="text-slate-800">privacy@freightlink.app</strong>.</p>
          </Section>

          <Section title="9. Multi-Market Data Processing">
            <p>
              FreightLink TMS operates across Kenya, India, Canada, and the United States. Data processing is subject to the laws of the jurisdiction in which your organisation is based:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-800">Kenya:</strong> Data Protection Act 2019 and regulations thereunder</li>
              <li><strong className="text-slate-800">India:</strong> Information Technology Act 2000 and the Digital Personal Data Protection Act 2023</li>
              <li><strong className="text-slate-800">Canada:</strong> Personal Information Protection and Electronic Documents Act (PIPEDA)</li>
              <li><strong className="text-slate-800">United States:</strong> Applicable federal and state privacy laws including CCPA where applicable</li>
            </ul>
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              FreightLink TMS is a business-to-business platform intended for use by adults in a professional freight and logistics context. We do not knowingly collect personal information from persons under the age of 18. If we become aware that a minor has provided us with personal information, we will delete it promptly.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email to the account administrator or through an in-app notification. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
            <div className="bg-slate-50 rounded-xl p-4 mt-2 text-sm space-y-1">
              <p><strong className="text-slate-800">Email:</strong> privacy@freightlink.app</p>
              <p><strong className="text-slate-800">Data Protection Officer:</strong> dpo@freightlink.app</p>
              <p><strong className="text-slate-800">Address:</strong> FreightLink TMS, Westlands, Nairobi, Kenya</p>
            </div>
          </Section>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-slate-400 border-t border-slate-200 mt-6">
        © {new Date().getFullYear()} FreightLink TMS ·&nbsp;
        <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
        &nbsp;·&nbsp;
        <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
      </footer>
    </div>
  );
}
