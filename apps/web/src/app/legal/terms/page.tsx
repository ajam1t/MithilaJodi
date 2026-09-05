import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_VERSION,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
} from '@/lib/constants'

/**
 * Terms of Service — production document.
 *
 * Checked against the implementation. Notes so this page does not drift:
 *
 *  - The platform is currently FREE. isFreeAccessMode() in lib/membership.ts
 *    returns true unless PAID_MEMBERSHIPS_ENABLED === 'true', and the payment
 *    endpoints have been removed, so no payment can be taken today. plan_config
 *    still holds dormant paid tiers — do NOT describe them here as available
 *    unless paid membership is actually switched back on AND payment endpoints
 *    are restored.
 *  - Profile TEXT goes live immediately in free mode (see the freeMode branch in
 *    app/api/profile/route.ts). Only PHOTOGRAPHS are reviewed before becoming
 *    visible. The previous version of this page claimed all content was
 *    pre-moderated, which was not true.
 *  - Verification is mobile OTP only. There is no Aadhaar, PAN, police,
 *    background, document or facial verification anywhere in the codebase. Do
 *    not add claims of any of those.
 *  - Deactivation is soft (DELETE /api/account) — data is retained.
 */

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of Mithila Jodi — eligibility, profile accuracy, member conduct, interests and messaging, safety, and account termination.',
  alternates: { canonical: `${SITE_URL}/legal/terms` },
  robots: { index: true, follow: true },
}

function H2({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-maroon text-[19px] sm:text-[21px] mt-9 mb-3 scroll-mt-20">
      <span className="text-terra text-[15px] sm:text-[16px] mr-2 align-middle">{n}.</span>
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-ink-soft text-[15px] leading-relaxed mb-3">{children}</p>
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-ink-soft text-[15px] leading-relaxed mb-3">{children}</ul>
}

export default function TermsPage() {
  return (
    <article className="prose-legal">
      <header className="border-b border-paper-3 pb-5 mb-2">
        <p className="eyebrow mb-2">Legal</p>
        <h1 className="font-serif text-maroon text-[26px] sm:text-[32px] leading-tight">Terms of Service</h1>
        <p className="text-ink-soft text-[13px] mt-2">
          Version {LEGAL_VERSION} · Effective {LEGAL_EFFECTIVE_DATE}
        </p>
      </header>

      <P>
        These terms govern your use of Mithila Jodi. By registering or using the platform you agree to
        them. Please read them before you create an account. They work together with our{' '}
        <Link href="/legal/privacy" className="text-maroon underline underline-offset-2">Privacy Policy</Link>,
        which forms part of these terms.
      </P>

      <H2 n={1}>What Mithila Jodi is</H2>
      <P>
        Mithila Jodi is a matrimonial platform for the Mithila (Maithili) community. Its purpose is to
        help individuals and their families find a marriage alliance — by publishing a matrimonial
        profile, searching other profiles, expressing interest, and generating a marriage biodata.
      </P>
      <P>
        It is not a dating service and it is not a social network. We introduce members to one
        another; we do not arrange, mediate, endorse or guarantee any marriage, and we are not a party
        to any alliance or agreement you reach with another member or their family.
      </P>

      <H2 n={2}>Who may register</H2>
      <UL>
        <li>You must be at least 18 years old. The platform will not accept a date of birth that makes the profile holder younger than 18.</li>
        <li>You must have a valid Indian mobile number that can receive an OTP.</li>
        <li>You must be legally free to marry under the law that applies to you.</li>
        <li>
          You may create a profile for yourself, or for a close family member — a son, daughter or
          sibling — but only with that person&rsquo;s knowledge and consent. If you create a profile
          for someone else, you are responsible for what appears on it and for having their consent to
          publish it.
        </li>
        <li>One person should have one profile. Duplicate profiles for the same person may be removed.</li>
      </UL>

      <H2 n={3}>Your account</H2>
      <P>
        You sign in with your mobile number and a one-time password sent by SMS. You may also set a
        password. Keep your access to your mobile number and your password to yourself — anything done
        through your account is treated as done by you. Tell us straight away if you think someone
        else has got into your account.
      </P>
      <P>
        Do not share, sell or transfer your account, and do not sign in to someone else&rsquo;s.
      </P>

      <H2 n={4}>Honest profiles</H2>
      <P>
        A matrimonial platform only works if the information on it is true. You agree that everything
        you publish — name, age, marital status, community details including gotra, maternal gotra,
        mool and native gram, education, profession and family information — is accurate and not
        misleading, and that you will keep it up to date.
      </P>
      <UL>
        <li>Do not impersonate anyone or create a profile in someone else&rsquo;s name without their consent.</li>
        <li>Do not upload photographs of a person other than the one the profile is for.</li>
        <li>Do not conceal or misstate an existing marriage, or anything else a prospective family would reasonably need to know.</li>
        <li>Do not create a profile for a purpose other than seeking a marriage alliance.</li>
      </UL>
      <P>
        We may hide, edit or remove a profile, or suspend an account, where information appears false
        or misleading.
      </P>

      <H2 n={5}>How you must behave</H2>
      <P>You agree not to:</P>
      <UL>
        <li>Harass, abuse, threaten, stalk or intimidate another member, or send them obscene or offensive content</li>
        <li>Ask another member for money, gifts, loans or financial help, or attempt any kind of fraud</li>
        <li>Send spam, advertising, or repeated unwanted messages after someone has stopped responding</li>
        <li>Try to obtain another member&rsquo;s private information by pressure, deception or technical means</li>
        <li>Copy, save, publish or reuse another member&rsquo;s photographs or profile details for any purpose outside considering an alliance</li>
        <li>Collect or scrape profile data from the platform, whether by hand or automatically</li>
        <li>Use the platform for any business or commercial purpose, including matchmaking as a service, without our written permission</li>
        <li>Publish anything unlawful, or anything that incites hatred against any community</li>
        <li>Attempt to break, probe or bypass the platform&rsquo;s security, access controls or membership rules</li>
      </UL>
      <P>
        Report anything that breaches this section and we will look into it.
      </P>

      <H2 n={6}>Photographs and profile content</H2>
      <P>
        Photographs are reviewed by our team before other members can see them. Until a photograph is
        approved it is visible only to you, and we may reject one that does not meet our standards.
      </P>
      <P>
        Other profile information — your written details, family description and preferences —
        publishes immediately when you save it. It is not reviewed in advance. We may review it later
        and remove or hide anything that breaches these terms, whether we notice it ourselves or
        someone reports it.
      </P>
      <P>
        You keep ownership of what you upload. By uploading it you give us permission to store it and
        to display it on the platform as described in these terms and in the Privacy Policy —
        including on public pages if your profile is featured, as set out in section 8. This permission
        ends when the content is removed, except for copies we are required to keep.
      </P>

      <H2 n={7}>Interests, messaging, blocking and reporting</H2>
      <UL>
        <li><strong>Interests.</strong> You can express interest in a profile. The other member can accept it, decline it, or leave it; you can withdraw one you have sent.</li>
        <li><strong>Messaging.</strong> Once a connection is established you can message each other on the platform. Messaging is currently available to all registered members at no charge.</li>
        <li><strong>Blocking.</strong> You can block a member. Blocking hides each of you from the other. You can unblock later.</li>
        <li><strong>Reporting.</strong> You can report a profile you believe is fraudulent, abusive or in breach of these terms. We review reports and may warn, restrict, hide or remove the account concerned. We may not be able to tell you the outcome of a report about someone else.</li>
      </UL>
      <P>
        Contact details you enter in your profile are not shown to other members. Your registered
        mobile number can be shared for WhatsApp only if you have opted in and approved that
        member&rsquo;s specific request, and you can revoke it — see the Privacy Policy.
      </P>

      <H2 n={8}>Publicly featured profiles</H2>
      <P>
        Some members are featured on our public pages, including the homepage and the public Explore
        page, so that families who have not registered yet can see the kind of profiles on Mithila
        Jodi. A profile is featured only where the member has agreed to it.
      </P>
      <P>
        A featured profile shows a reduced set of details — first name with the family name shortened,
        age, gender, community and location, education and profession, and the main approved
        photograph. It does not show date of birth, contact number, email address, postal address or
        free-text descriptions. Turning off discoverability, or deactivating your account, removes your
        profile from public featuring. You can also ask us to stop featuring you at any time using the
        contact details in section 14.
      </P>

      <H2 n={9}>Safety — and what we do not do</H2>
      <P>
        We want to be straightforward with you about this, because it matters more than anything else
        on this page.
      </P>
      <P>
        <strong>
          We verify that a member controls the mobile number they registered with. We do not verify
          who they are.
        </strong>{' '}
        Mithila Jodi does not carry out Aadhaar verification, PAN verification, police or background
        verification, income or education verification, document checks or facial or biometric
        authentication. A profile on this platform has not been identity-checked, and no badge, label
        or wording on the platform should be read as saying otherwise.
      </P>
      <P>What we do do: mobile number verification by OTP, review of every photograph before it becomes visible, and acting on reports and blocks.</P>
      <P>
        So please take the same care you would with any introduction from outside your circle: verify
        important claims independently, involve your family, meet in a safe and public setting, and
        never send money to someone you have met on the platform. Our{' '}
        <Link href="/safety" className="text-maroon underline underline-offset-2">safety guidance</Link>{' '}
        explains this in more detail. You are responsible for your own decisions about whom you meet
        and whom you marry.
      </P>

      <H2 n={10}>Membership and payment</H2>
      <P>
        <strong>Mithila Jodi is currently free for all members.</strong> Registration, creating and
        publishing a profile, searching, sending and receiving interests, messaging, and generating a
        marriage biodata in English, Hindi, Maithili and Sanskrit are all available at no charge.
      </P>
      <P>
        We do not collect payment from members, and the platform has no facility to take one. There
        are therefore no subscriptions, no automatic renewals, no charges to cancel, and nothing to
        refund. Because nothing is charged, no feature is withheld pending payment, and no profile or
        data is deleted because a membership has lapsed.
      </P>
      <P>
        If we introduce paid membership in future, we will publish the plans, prices and what each
        includes before they take effect, together with the cancellation and refund terms that apply,
        and we will not charge you without your agreement. Nothing on this page should be read as an
        offer of a paid plan today.
      </P>

      <H2 n={11}>Suspension and termination</H2>
      <P>We may restrict access, hide a profile, suspend an account or close it where:</P>
      <UL>
        <li>The information on a profile appears false, misleading or fraudulent</li>
        <li>A member breaches section 5, or reports about them indicate they are unsafe to other members</li>
        <li>A profile appears to belong to someone under 18</li>
        <li>A member abuses the platform&rsquo;s systems, or uses it for a commercial purpose without permission</li>
        <li>We are required to act by law or by a lawful authority</li>
      </UL>
      <P>
        Where it is reasonable to do so we will tell you what the problem is and give you a chance to
        put it right. For serious matters — fraud, or a risk to another member&rsquo;s safety — we may
        act immediately.
      </P>
      <P>
        You can deactivate your own account at any time from your settings.{' '}
        <strong>Deactivation hides your profile and signs you out; it does not erase your data.</strong>{' '}
        If you want your data erased, ask us and we will act on it, subject to anything we must keep —
        see section 8 of the Privacy Policy.
      </P>

      <H2 n={12}>Our content and brand</H2>
      <P>
        The Mithila Jodi name and logo, the website design, its text and artwork, and the software
        behind it belong to us or are used by us with permission, and are protected by Indian
        intellectual property law. You may use the platform for its intended purpose; you may not copy,
        adapt, resell or redistribute our content or software, or use our name or logo, without our
        written permission. Biodata and invitation designs you generate are for your own personal use
        in connection with a marriage.
      </P>
      <P>
        Content posted by members belongs to those members, not to us. Nothing in this section claims
        ownership of it.
      </P>

      <H2 n={13}>Our responsibility, and its limits</H2>
      <P>
        We will provide the platform with reasonable care and skill. We do not promise that it will
        always be available or free of faults, and we may change, suspend or withdraw features.
      </P>
      <P>
        Because we introduce members rather than vet them, we are not responsible for the truth of
        what a member publishes, for how a member behaves towards you on or off the platform, or for
        the outcome of any introduction, meeting or alliance. Where a loss is caused by another
        member&rsquo;s conduct rather than ours, our responsibility does not extend to it.
      </P>
      <P>
        To the extent the law allows, we are not liable for indirect or consequential loss. Nothing in
        these terms limits any liability that cannot lawfully be limited — including for death or
        personal injury caused by negligence, or for fraud. Nothing here removes any right you have as
        a consumer under Indian law.
      </P>

      <H2 n={14}>Governing law and disputes</H2>
      <P>
        These terms are governed by the laws of India, and disputes arising from them are subject to
        the jurisdiction of the courts of India.
      </P>
      <P>
        Before starting any formal proceedings, please raise the matter with us using the contact
        details below. Most problems can be sorted out quickly and we would rather resolve them
        directly.
      </P>

      <H2 n={15}>Changes to these terms</H2>
      <P>
        We may update these terms. If a change materially affects you, we will tell you through the
        platform before it takes effect and update the version and effective date at the top of this
        page. If you keep using the platform after a change takes effect, you accept the updated
        terms; if you do not accept them, you should stop using the platform and may deactivate your
        account.
      </P>

      <H2 n={16}>Contact us</H2>
      <P>For any question about these terms, or to raise a complaint:</P>
      <UL>
        <li>
          Email:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-maroon underline underline-offset-2">
            {SUPPORT_EMAIL}
          </a>
        </li>
        <li>
          Phone or WhatsApp:{' '}
          <a href={`tel:+${SUPPORT_PHONE_E164}`} className="text-maroon underline underline-offset-2">
            {SUPPORT_PHONE_DISPLAY}
          </a>
        </li>
        <li>
          Or use the{' '}
          <Link href="/contact" className="text-maroon underline underline-offset-2">contact form</Link>.
        </li>
      </UL>

      <div className="mt-10 pt-5 border-t border-paper-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
        <Link href="/legal/privacy" className="text-maroon underline underline-offset-2">Privacy Policy</Link>
        <Link href="/legal/consent" className="text-maroon underline underline-offset-2">Consent &amp; Data</Link>
        <Link href="/safety" className="text-maroon underline underline-offset-2">Safety</Link>
        <Link href="/contact" className="text-maroon underline underline-offset-2">Contact</Link>
      </div>
    </article>
  )
}
