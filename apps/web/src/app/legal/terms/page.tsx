import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Service — Mithila Jodi',
  alternates: { canonical: `${SITE_URL}/legal/terms` },
}

export default function TermsPage() {
  return (
    <article className="prose-legal">
      {/* DRAFT banner */}
      <div className="mb-8 p-4 border-2 border-amber-400 bg-amber-50 rounded-mj">
        <p className="text-amber-800 font-semibold text-sm mb-1">DRAFT — Not yet legally reviewed</p>
        <p className="text-amber-700 text-xs">
          This document is a working draft and has not been reviewed by qualified legal counsel. It does not constitute a legally binding agreement until formally reviewed, approved, and published. Do not rely on this document for legal compliance purposes.
        </p>
      </div>

      <h1 className="font-serif text-3xl text-maroon mb-2">Terms of Service</h1>
      <p className="text-ink-soft text-sm mb-8">Version 1.0 — Effective date: <em>To be confirmed upon legal review</em></p>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">1. Introduction</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Mithila Jodi (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a matrimonial platform serving the Mithila community in India. By accessing or using our Platform, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). Please read them carefully before registering.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          If you do not agree to these Terms, you must not access or use the Platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">2. Eligibility</h2>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>You must be at least 18 years of age to register.</li>
          <li>You must be a resident of India or a person of Indian origin seeking matrimonial alliance within the Mithila community.</li>
          <li>You must possess a valid Indian mobile number capable of receiving OTP verification.</li>
          <li>You must not be legally prohibited from entering into a marriage or matrimonial alliance under any applicable law.</li>
          <li>You may register a profile for yourself or, with their full knowledge and consent, for an immediate family member (son, daughter, sibling).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">3. Account Registration and Security</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Registration requires a valid Indian mobile number verified by one-time password (OTP). You are responsible for all activity on your account and must not share your account with any other person. You must notify us immediately of any unauthorized access.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          We reserve the right to suspend or terminate accounts that violate these Terms, impersonate others, or engage in fraudulent activity.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">4. Acceptable Use</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">You agree not to:</p>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>Provide false, misleading, or inaccurate information in your profile.</li>
          <li>Upload photographs of anyone other than yourself (or the person the profile is created for).</li>
          <li>Use the Platform to solicit money, gifts, or financial assistance from other members.</li>
          <li>Send unsolicited, abusive, harassing, or offensive messages to other members.</li>
          <li>Attempt to circumvent or misuse the Platform&rsquo;s matching and membership systems.</li>
          <li>Collect or harvest information about other members without their consent.</li>
          <li>Use the Platform for any commercial purpose without our express written consent.</li>
          <li>Violate any applicable Indian law or regulation.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">5. Profile Content and Moderation</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          All profile content (photos, text, biodata) is subject to moderation before becoming visible to other members. We reserve the right to reject or remove content that violates these Terms or our community standards. Moderation decisions are made by our team and are not automated bans.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          You retain ownership of the content you upload. By uploading content, you grant us a non-exclusive, royalty-free licence to display it to other Platform members in accordance with your privacy settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">6. Membership and Payments</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Certain features of the Platform require a paid membership. Membership prices and durations are set by us and may change with prior notice. All payments are processed through authorised payment gateways and are subject to the payment processor&rsquo;s terms.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Your account and profile data will not be deleted solely because your membership expires. Profile visibility may be reduced for expired memberships.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          Refund requests are handled on a case-by-case basis in accordance with applicable Indian consumer protection law.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">7. Privacy</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          Your use of the Platform is also governed by our <a href="/legal/privacy" className="text-maroon hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Platform, you consent to our collection and use of personal data as described in the Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">8. Limitation of Liability</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Mithila Jodi is a matrimonial introduction platform. We do not verify the accuracy of all information provided by members, do not guarantee the authenticity of profiles, and are not responsible for the conduct of members off the Platform.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">9. Termination</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          You may deactivate your account at any time from your account settings. We may suspend or terminate your access for violations of these Terms. Termination does not automatically erase your data — please refer to our Privacy Policy for data retention details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">10. Governing Law and Dispute Resolution</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in India.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">11. Changes to These Terms</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          We may update these Terms from time to time. If we make material changes, we will notify you through the Platform or by other means before the changes take effect. Continued use of the Platform after changes constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">12. Contact Us</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          For questions about these Terms, please contact us through the Platform. Grievance redressal details will be provided upon publication of the final, legally reviewed version of these Terms.
        </p>
      </section>

      <div className="mt-10 p-4 border border-paper-3 rounded-mj bg-paper text-xs text-ink-soft">
        This document is a draft and is subject to change. It has not been reviewed by legal counsel and does not represent the final Terms of Service. Mithila Jodi makes no representation that this document satisfies any legal or regulatory requirement.
      </div>
    </article>
  )
}
