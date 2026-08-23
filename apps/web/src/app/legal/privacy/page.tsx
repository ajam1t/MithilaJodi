import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy — Mithila Jodi',
  alternates: { canonical: `${SITE_URL}/legal/privacy` },
}

export default function PrivacyPage() {
  return (
    <article className="prose-legal">
      {/* DRAFT banner */}
      <div className="mb-8 p-4 border-2 border-amber-400 bg-amber-50 rounded-mj">
        <p className="text-amber-800 font-semibold text-sm mb-1">DRAFT — Not yet legally reviewed</p>
        <p className="text-amber-700 text-xs">
          This document is a working draft and has not been reviewed by qualified legal counsel. It does not constitute a valid, binding Privacy Policy until formally reviewed and published. Do not rely on this document for legal compliance purposes.
        </p>
      </div>

      <h1 className="font-serif text-3xl text-maroon mb-2">Privacy Policy</h1>
      <p className="text-ink-soft text-sm mb-8">Version 1.0 — Effective date: <em>To be confirmed upon legal review</em></p>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">1. Introduction</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          This Privacy Policy describes how Mithila Jodi (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, stores, and protects your personal data in accordance with the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;) and other applicable Indian laws.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          Data Fiduciary: <strong>[Organisation name and contact details — to be confirmed upon legal registration and review]</strong>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">2. Personal Data We Collect</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">We collect the following categories of personal data:</p>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink mb-1">Account and Verification Data</p>
            <ul className="list-disc list-inside space-y-1 text-ink-soft text-sm">
              <li>Mobile phone number (verified by OTP)</li>
              <li>OTP challenge metadata (time, attempt count)</li>
              <li>Account status and role</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink mb-1">Profile Data</p>
            <ul className="list-disc list-inside space-y-1 text-ink-soft text-sm">
              <li>Name, date of birth, gender</li>
              <li>Religion, caste (for matrimonial matching within community)</li>
              <li>Education and profession details</li>
              <li>State, district, and hometown (India only)</li>
              <li>Height, complexion, dietary preference, mother tongue</li>
              <li>About me / family description</li>
              <li>Profile photographs (stored securely; not publicly accessible by URL)</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink mb-1">Contact Data (Private)</p>
            <ul className="list-disc list-inside space-y-1 text-ink-soft text-sm">
              <li>Contact mobile number (if provided, shared only upon mutual interest acceptance)</li>
              <li>Email address (optional)</li>
              <li>Address (optional)</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink mb-1">Usage and Activity Data</p>
            <ul className="list-disc list-inside space-y-1 text-ink-soft text-sm">
              <li>Interests sent, received, accepted, declined</li>
              <li>Shortlisted profiles</li>
              <li>Messages exchanged (stored encrypted in transit; see messaging policy)</li>
              <li>Biodata generation preferences and download history</li>
              <li>Login sessions (IP address, device/browser metadata)</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink mb-1">Consent Records</p>
            <ul className="list-disc list-inside space-y-1 text-ink-soft text-sm">
              <li>Record of each consent given: type, version, timestamp, IP address, user agent</li>
              <li>Record of consent withdrawals</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink mb-1">Payment Data</p>
            <ul className="list-disc list-inside space-y-1 text-ink-soft text-sm">
              <li>Membership plan, payment status, transaction reference</li>
              <li>Full payment card or bank details are NOT stored — handled exclusively by our authorised payment gateway</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">3. How We Use Your Data</h2>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>To verify your identity and maintain account security</li>
          <li>To display your profile to other members for matrimonial matching</li>
          <li>To enable messaging between mutually interested members</li>
          <li>To generate biodata documents for your personal use</li>
          <li>To process membership payments and manage subscription status</li>
          <li>To moderate profile content and maintain platform safety</li>
          <li>To detect and prevent fraud, abuse, and violations of our Terms of Service</li>
          <li>To respond to your queries and grievances</li>
          <li>With your explicit consent: to send promotional communications</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">4. Sharing of Personal Data</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          We do not sell your personal data. We share your data only in the following circumstances:
        </p>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li><strong>Other members:</strong> Your profile is visible to registered, active members subject to your privacy settings. Your contact details are shared only upon mutual interest acceptance.</li>
          <li><strong>Service providers:</strong> We use third-party providers for OTP delivery, payment processing, and cloud infrastructure. These providers are bound by data processing agreements and may not use your data for any purpose other than providing services to us.</li>
          <li><strong>Legal obligations:</strong> We may disclose data where required by law, court order, or lawful government request.</li>
          <li><strong>With your consent:</strong> Any other sharing requires your explicit prior consent.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">5. Data Retention</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          We retain your personal data for as long as your account is active and for a period thereafter as required by law or legitimate business need. Key retention principles:
        </p>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>Account and profile data is retained for the lifetime of the account and for a legally defined period after account deactivation.</li>
          <li>Payment records are retained for the period required under applicable financial and tax regulations.</li>
          <li>Consent records are retained indefinitely for compliance audit purposes.</li>
          <li>Session logs and OTP metadata are retained for a limited period for security purposes.</li>
          <li>Account and profile data is never deleted solely because a membership expires.</li>
        </ul>
        <p className="text-ink-soft text-sm leading-relaxed mt-3">
          Specific retention periods will be defined in the final, legally reviewed version of this policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">6. Your Rights Under the DPDP Act, 2023</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          As a Data Principal under the Digital Personal Data Protection Act, 2023, you have the following rights:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-paper rounded-mj border border-paper-3">
            <p className="text-sm font-medium text-ink mb-1">Right of Access</p>
            <p className="text-xs text-ink-soft">You may request a summary of the personal data we hold about you and the purposes for which it is processed. You can download your data from your account settings.</p>
          </div>
          <div className="p-3 bg-paper rounded-mj border border-paper-3">
            <p className="text-sm font-medium text-ink mb-1">Right of Correction and Erasure</p>
            <p className="text-xs text-ink-soft">You may update your profile information at any time. You may request erasure of data that is no longer necessary or where you withdraw consent. Erasure requests that conflict with our legal retention obligations may be partially fulfilled.</p>
          </div>
          <div className="p-3 bg-paper rounded-mj border border-paper-3">
            <p className="text-sm font-medium text-ink mb-1">Right to Withdraw Consent</p>
            <p className="text-xs text-ink-soft">You may withdraw optional consents (marketing communications, third-party sharing) at any time from your account settings. Withdrawal does not affect the lawfulness of processing based on consent before withdrawal.</p>
          </div>
          <div className="p-3 bg-paper rounded-mj border border-paper-3">
            <p className="text-sm font-medium text-ink mb-1">Right of Nomination</p>
            <p className="text-xs text-ink-soft">You may nominate a person to exercise your data rights in the event of your death or incapacity. Nomination functionality will be available in a future update.</p>
          </div>
          <div className="p-3 bg-paper rounded-mj border border-paper-3">
            <p className="text-sm font-medium text-ink mb-1">Right to Grievance Redressal</p>
            <p className="text-xs text-ink-soft">You have the right to have your grievances addressed. Contact our Grievance Officer — details to be published in the final version of this policy.</p>
          </div>
        </div>
        <p className="text-ink-soft text-xs mt-4">
          To exercise your rights, please use the account settings page or contact us through the Platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">7. Data Security</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. Profile photographs are stored in a private storage bucket and accessed only via time-limited signed URLs. Sessions use HttpOnly cookies with hashed tokens. No full Aadhaar numbers are stored on the Platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">8. Cookies and Tracking</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          We use a single session cookie (&ldquo;mj-session&rdquo;) that is strictly necessary for authentication. We do not use advertising cookies, cross-site tracking cookies, or third-party analytics cookies. The session cookie is HttpOnly and is not accessible from JavaScript.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">9. Changes to This Policy</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          We may update this Privacy Policy from time to time. If we make material changes, we will notify you through the Platform. Where required by law, we will seek fresh consent for any new processing activities.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">10. Grievance Officer</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          In accordance with the IT Act, 2000 and the DPDP Act, 2023, the name and contact details of the Grievance Officer will be published in the final, legally reviewed version of this Policy. Until then, please raise grievances through the Platform.
        </p>
      </section>

      <div className="mt-10 p-4 border border-paper-3 rounded-mj bg-paper text-xs text-ink-soft">
        This document is a draft and is subject to change. It has not been reviewed by legal counsel and does not represent a final Privacy Policy. Mithila Jodi makes no representation that this document satisfies any legal or regulatory requirement, including requirements of the DPDP Act, 2023.
      </div>
    </article>
  )
}
