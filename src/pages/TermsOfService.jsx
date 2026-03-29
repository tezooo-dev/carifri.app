import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="space-y-3 text-slate-600 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50">
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
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={26} className="text-slate-600"/>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Terms of Service</h1>
          <p className="text-slate-500">Last updated: {new Date().toLocaleDateString('en-US', { year:'numeric',month:'long',day:'numeric' })}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using FreightLink TMS ("the Platform", "the Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Platform on behalf of a company or organisation, you represent that you have authority to bind that entity to these Terms.
            </p>
            <p>
              If you do not agree to these Terms, you may not access or use the Platform.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              FreightLink TMS is a cloud-based Transport Management System (TMS) designed for freight brokerages. The Platform provides tools for load management, carrier management, shipment tracking, financial reporting, and analytics across multiple geographic markets.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.
            </p>
          </Section>

          <Section title="3. Account Registration and Security">
            <p>
              To use the Platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorised use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p>
              You may not share your login credentials with others. Each user within your organisation must have their own account. Account sharing is a violation of these Terms.
            </p>
          </Section>

          <Section title="4. Permitted Use">
            <p>You may use the Platform solely for lawful business purposes related to freight brokerage, logistics, and transportation management. You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Platform for any unlawful purpose or in violation of any regulations</li>
              <li>Attempt to gain unauthorised access to any systems or networks</li>
              <li>Transmit viruses, malware, or any other malicious code</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
              <li>Use automated scrapers or bots to extract data from the Platform</li>
              <li>Resell or sub-license access to the Platform without written permission</li>
              <li>Use the Platform to facilitate fraudulent freight transactions</li>
              <li>Interfere with or disrupt the Platform's infrastructure or other users' access</li>
            </ul>
          </Section>

          <Section title="5. Data Ownership and License">
            <p>
              <strong className="text-slate-800">Your data is yours.</strong> You retain full ownership of all business data you enter into the Platform, including load records, carrier profiles, shipper information, and financial data.
            </p>
            <p>
              You grant us a limited, non-exclusive, royalty-free licence to store, process, and display your data solely for the purpose of providing the Service to you. We do not sell or share your business data with third parties (see Privacy Policy).
            </p>
            <p>
              Upon account termination, you may request a full data export in CSV format. We will retain your data for 30 days after termination before permanent deletion, unless a longer retention period is required by law.
            </p>
          </Section>

          <Section title="6. Subscription and Payment">
            <p>
              Access to certain features of the Platform requires a paid subscription. Subscription fees are billed in advance on a monthly or annual basis. By providing payment information, you authorise us to charge the applicable fees.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-800">Free Trial:</strong> We offer a 14-day free trial. No credit card is required to start. After the trial, you must subscribe to continue using the Platform.</li>
              <li><strong className="text-slate-800">Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds are provided for unused portions of a billing period.</li>
              <li><strong className="text-slate-800">Price Changes:</strong> We reserve the right to change subscription pricing with 30 days' notice. Continued use after a price change constitutes acceptance.</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The Platform, including its software, design, user interface, documentation, and all related intellectual property rights, is owned by FreightLink TMS and its licensors. These Terms do not grant you any rights to use our trademarks, logos, or brand features without express written permission.
            </p>
            <p>
              Feedback, suggestions, or ideas you provide about the Platform may be used by us without restriction or compensation to you.
            </p>
          </Section>

          <Section title="8. Third-Party Services">
            <p>The Platform integrates with certain third-party services, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-800">OpenStreetMap:</strong> Used for map tiles in the Tracking module. Subject to OpenStreetMap's terms of use.</li>
              <li><strong className="text-slate-800">Email delivery:</strong> Used for notifications and report exports.</li>
            </ul>
            <p>
              Your use of third-party services is subject to their respective terms and privacy policies. We are not responsible for third-party services or their availability.
            </p>
          </Section>

          <Section title="9. Disclaimers and Limitation of Liability">
            <p className="font-semibold text-slate-700 uppercase text-xs tracking-wide">DISCLAIMER OF WARRANTIES</p>
            <p>
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="font-semibold text-slate-700 uppercase text-xs tracking-wide mt-3">LIMITATION OF LIABILITY</p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FREIGHTLINK TMS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
            <p>
              FreightLink TMS does not assume liability for: freight losses or damages, carrier performance or reliability, inaccurate rate quotations, or any losses arising from carrier bidding outcomes.
            </p>
          </Section>

          <Section title="10. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless FreightLink TMS and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any law or rights of a third party; or (d) any freight transactions facilitated through the Platform.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              We may suspend or terminate your access to the Platform at our discretion, with or without cause, with reasonable notice where practicable. Grounds for termination include violation of these Terms, fraudulent activity, or non-payment of subscription fees.
            </p>
            <p>
              You may terminate your account at any time by contacting support. Sections 5, 7, 9, 10, and 12 survive termination.
            </p>
          </Section>

          <Section title="12. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of Kenya for accounts in the Kenya and Africa markets, the laws of India for Indian market accounts, the laws of Canada (Ontario) for Canadian accounts, and the laws of the State of Delaware for US accounts.
            </p>
            <p>
              Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in the applicable jurisdiction.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p>
              We may modify these Terms at any time. Material changes will be communicated via email to account administrators at least 14 days before taking effect. Continued use of the Platform after the effective date constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>For questions about these Terms, please contact:</p>
            <div className="bg-slate-50 rounded-xl p-4 mt-2 text-sm space-y-1">
              <p><strong className="text-slate-800">Legal:</strong> legal@freightlink.app</p>
              <p><strong className="text-slate-800">Support:</strong> support@freightlink.app</p>
              <p><strong className="text-slate-800">Address:</strong> FreightLink TMS, Westlands, Nairobi, Kenya</p>
            </div>
          </Section>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-slate-400 border-t border-slate-200 mt-6">
        © {new Date().getFullYear()} FreightLink TMS ·&nbsp;
        <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
        &nbsp;·&nbsp;
        <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
      </footer>
    </div>
  );
}
