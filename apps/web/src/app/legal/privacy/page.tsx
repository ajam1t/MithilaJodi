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
 * Privacy Policy — production document.
 *
 * Every factual claim here was checked against the implementation. Notes for
 * whoever edits this next, so the page does not drift out of accuracy:
 *
 *  - Contact details you enter (contact_mobile / contact_email / address) are
 *    NOT exposed to other members by any route. The only places they leave the
 *    database are your own profile editor and your own data export. Do not
 *    reintroduce the old "shared on mutual interest" wording — that was wrong.
 *  - "Deactivate account" (DELETE /api/account) is a soft deactivation: it sets
 *    account_status='deactivated', stamps deleted_at, deactivates the profile
 *    and clears sessions. It does not erase data. Do not promise erasure here.
 *  - Photos upload as 'pending_moderation' and every display query filters on
 *    status='approved', so photo review before visibility is real.
 *  - profiles.contact_visibility / photo_visibility are stored but no
 *    member-facing read path enforces them, so this page deliberately does not
 *    claim them as controls. `discoverable` IS enforced server-side.
 *  - There is no analytics or advertising tracking in the codebase.
 */

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Mithila Jodi collects, uses, stores and shares your personal data — written to match what the platform actually does.',
  alternates: { canonical: `${SITE_URL}/legal/privacy` },
  // Indexable on purpose: a matrimonial platform's privacy terms should be
  // publicly readable before someone registers.
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

export default function PrivacyPage() {
  return (
    <article className="prose-legal">
      <header className="border-b border-paper-3 pb-5 mb-2">
        <p className="eyebrow mb-2">Legal</p>
        <h1 className="font-serif text-maroon text-[26px] sm:text-[32px] leading-tight">Privacy Policy</h1>
        <p className="text-ink-soft text-[13px] mt-2">
          Version {LEGAL_VERSION} · Effective {LEGAL_EFFECTIVE_DATE}
        </p>
      </header>

      <P>
        This policy explains what personal data Mithila Jodi collects, why we collect it, who it is
        shared with, and the choices you have. It is written to describe what the platform actually
        does. If you have a question about anything here, please{' '}
        <Link href="/contact" className="text-maroon underline underline-offset-2">contact us</Link>.
      </P>

      <H2 n={1}>Who this policy covers</H2>
      <P>
        Mithila Jodi is a matrimonial platform for the Mithila (Maithili) community. This policy
        applies to everyone who visits the website and to registered members. It covers the data you
        give us, the data created as you use the platform, and the limited technical data our systems
        record.
      </P>

      <H2 n={2}>Information we collect</H2>
      <P>We collect the following, and nothing beyond what is listed here:</P>

      <p className="text-[14px] font-semibold text-ink mt-4 mb-1.5">Account and sign-in</p>
      <UL>
        <li>Your Indian mobile number, verified by one-time password (OTP)</li>
        <li>OTP verification records — when a code was requested and how many attempts were made</li>
        <li>A password, if you choose to set one (stored only as a secure hash, never in readable form)</li>
        <li>Login session records, including the approximate time and your IP address</li>
      </UL>

      <p className="text-[14px] font-semibold text-ink mt-4 mb-1.5">Matrimonial profile</p>
      <UL>
        <li>Name, date of birth, gender, and who the profile is for (yourself or a family member)</li>
        <li>Religion, caste and sub-caste</li>
        <li>Gotra, maternal gotra (nanihaal), mool and native gram</li>
        <li>Native place, current location and work location</li>
        <li>Education — degree, specialisation, institution and year</li>
        <li>Profession — job title, employer, industry, experience and work type</li>
        <li>Height, marital status, mother tongue, diet, and smoking and drinking preferences</li>
        <li>Your own description of yourself and of your family, and your marriage timeline</li>
        <li>Partner preferences, including age range, community, education, location and diet</li>
      </UL>

      <p className="text-[14px] font-semibold text-ink mt-4 mb-1.5">Private details (never shown to other members)</p>
      <UL>
        <li>Contact mobile number, email address and postal address, if you choose to add them</li>
        <li>Income range, if you choose to add it</li>
        <li>Horoscope details — rashi, nakshatra, manglik status, birth time and birth place, and a kundli link if you add one</li>
      </UL>

      <p className="text-[14px] font-semibold text-ink mt-4 mb-1.5">Photographs</p>
      <UL>
        <li>Profile photographs you upload, together with which one you have set as your main photo</li>
      </UL>

      <p className="text-[14px] font-semibold text-ink mt-4 mb-1.5">Activity on the platform</p>
      <UL>
        <li>Interests you send and receive, and whether they were accepted or declined</li>
        <li>Profiles you shortlist</li>
        <li>Messages you exchange with members you are connected to</li>
        <li>Members you block, and reports you submit about a profile</li>
        <li>WhatsApp contact requests you send, receive, approve, decline or revoke</li>
      </UL>

      <p className="text-[14px] font-semibold text-ink mt-4 mb-1.5">Consent records</p>
      <UL>
        <li>
          Each consent you give or withdraw — which document it applies to, its version, the date and
          time, your IP address and your browser&rsquo;s user-agent string. We keep these so we can
          show what you agreed to and when.
        </li>
      </UL>

      <p className="text-[14px] font-semibold text-ink mt-4 mb-1.5">Payment information</p>
      <UL>
        <li>
          None. Mithila Jodi is currently free for all members and does not collect payment from
          members, so we do not hold card, bank or other payment details.
        </li>
      </UL>

      <H2 n={3}>Why we collect it</H2>
      <UL>
        <li>To create your account and sign you in securely</li>
        <li>To build your matrimonial profile and show it to other members</li>
        <li>To power search and matching, including the community-specific fields above</li>
        <li>To let members send and respond to interests, and to message once connected</li>
        <li>To generate your marriage biodata in English, Hindi, Maithili and Sanskrit</li>
        <li>To review photographs, act on reports, and keep the platform safe</li>
        <li>To answer your questions and handle complaints</li>
        <li>To fix problems and improve how the platform works</li>
      </UL>
      <P>
        We do not use your personal data for advertising, and we do not sell it.
      </P>

      <H2 n={4}>Who can see your profile</H2>
      <P>
        <strong>Registered members.</strong> Your profile is shown to other registered members
        through search and browsing while your profile is active and you have kept it discoverable.
        You can turn discoverability off at any time from your profile settings; this is enforced on
        our servers, so a profile that is not discoverable does not appear in member search.
      </P>
      <P>
        <strong>Publicly featured profiles.</strong> Some members are featured publicly — for example
        on our homepage and on the public Explore page — so that families who have not yet registered
        can see the kind of profiles on Mithila Jodi. A profile is only featured where the member has
        agreed to it, and a featured profile stops being shown as soon as the member turns off
        discoverability or deactivates their account.
      </P>
      <P>
        A publicly featured profile shows a reduced set of information: first name with the family
        name shortened, age, gender, community and location details, education and profession, and
        the main photograph. It never includes your date of birth, your contact mobile number, your
        email address, your postal address or your free-text descriptions. If you would prefer not to
        be featured publicly, tell us using the contact details in section 12 and we will remove you.
      </P>

      <H2 n={5}>Your contact details</H2>
      <P>
        The contact mobile number, email address and postal address you enter in your profile are
        held privately. They are not displayed to other members anywhere on the platform, and they
        are not included in publicly featured profiles. Members reach each other through interests
        and in-platform messaging rather than by seeing each other&rsquo;s numbers.
      </P>
      <P>
        The one exception is WhatsApp contact sharing, and it is entirely in your hands. Your
        registered mobile number can be shared with another member for WhatsApp only if you have
        opted in to WhatsApp contact sharing <em>and</em> you have approved that specific
        member&rsquo;s request. You can decline a request, and you can revoke an approval you have
        already given. Opting in never makes your number public.
      </P>

      <H2 n={6}>Photographs</H2>
      <P>
        Photographs you upload are stored in private storage. They are not available at a public,
        guessable web address — the platform serves them through short-lived links that expire.
      </P>
      <P>
        Every photograph is reviewed by our team before other members can see it. Until it is
        approved it is visible only to you. We may reject a photograph that does not meet our
        standards, for example if it is not a photograph of the person the profile is for. Your main
        approved photograph is shown to registered members and, if your profile is featured publicly,
        on the public pages described in section 4. You can delete a photograph at any time.
      </P>

      <H2 n={7}>Who we share data with</H2>
      <P>We share personal data only in these situations:</P>
      <UL>
        <li>
          <strong>Other members</strong> — as described in section 4.
        </li>
        <li>
          <strong>Our technology providers</strong> — we use Supabase for our database and file
          storage and Vercel to host and serve the website. They process data on our instructions in
          order to run the service, and not for their own purposes.
        </li>
        <li>
          <strong>SMS delivery</strong> — a third-party SMS provider delivers your one-time passwords.
          Delivering an OTP necessarily involves sharing the mobile number it is being sent to.
        </li>
        <li>
          <strong>Legal authorities</strong> — where we are required to disclose data by law, by a
          court order, or by a lawful request from a government authority.
        </li>
        <li>
          <strong>Anyone else you tell us to</strong> — only with your specific consent.
        </li>
      </UL>
      <P>
        We do not use third-party analytics, advertising networks or cross-site tracking services, and
        we do not share your data with them.
      </P>

      <H2 n={8}>How long we keep it, and what deactivation does</H2>
      <P>
        We keep your data for as long as your account exists, and afterwards where we still need it —
        for example to handle a safety report or to meet a legal obligation.
      </P>
      <P>
        Please read this part carefully, because it is easy to misread.{' '}
        <strong>
          Deactivating your account from your settings hides your profile and signs you out. It does
          not erase your data.
        </strong>{' '}
        When you deactivate, we mark your account and profile as deactivated, record the date, and end
        all your sign-in sessions. Your profile stops appearing in member search and stops being
        featured publicly. Your profile information, photographs, messages, interests and consent
        records remain in our systems.
      </P>
      <P>
        If you want your data erased rather than deactivated, ask us using the contact details in
        section 12 and we will act on it. We may need to keep some records even after erasure — for
        example a record of a safety report, or information we are legally required to retain. We
        will tell you if that applies to your request.
      </P>
      <P>
        Because Mithila Jodi is currently free, nothing is deleted because of a membership expiring.
      </P>

      <H2 n={9}>Your choices and controls</H2>
      <P>These controls exist in the product today:</P>
      <UL>
        <li>
          <strong>Correct your information</strong> — edit any part of your profile at any time from
          your profile page.
        </li>
        <li>
          <strong>Control who finds you</strong> — turn discoverability off to remove your profile
          from member search and from public featuring.
        </li>
        <li>
          <strong>Manage photographs</strong> — add, replace, reorder or delete your photographs.
        </li>
        <li>
          <strong>Block a member</strong> — blocking stops that member from appearing to you and you
          to them.
        </li>
        <li>
          <strong>Report a profile</strong> — report a profile you believe is fraudulent, abusive or
          otherwise breaks our{' '}
          <Link href="/legal/terms" className="text-maroon underline underline-offset-2">Terms of Service</Link>.
        </li>
        <li>
          <strong>Control WhatsApp sharing</strong> — opt in or out, and approve, decline or revoke
          individual requests.
        </li>
        <li>
          <strong>Download your data</strong> — request a copy of your account data from your settings
          page.
        </li>
        <li>
          <strong>Withdraw optional consents</strong> — withdraw consent for optional purposes such as
          promotional messages from your settings page. Withdrawing does not undo processing that
          already lawfully took place.
        </li>
        <li>
          <strong>Change your password</strong> — from your settings page.
        </li>
        <li>
          <strong>Deactivate your account</strong> — from your settings page, with the effects
          described in section 8.
        </li>
      </UL>
      <P>
        To ask for access to, correction of, or erasure of your data outside these controls, or to
        raise a complaint, use the contact details in section 12.
      </P>

      <H2 n={10}>Security</H2>
      <P>
        We take reasonable technical and organisational measures to protect your data. In particular:
        photographs are held in private storage and served only through short-lived expiring links;
        sign-in sessions use a cookie that JavaScript cannot read, and the session token is stored in
        our database only as a hash; passwords, where set, are stored only as hashes; and the site is
        served over HTTPS.
      </P>
      <P>
        No online service can promise perfect security, and we do not claim to. We hold no security
        certification and make no claim to one. If you believe your account has been accessed without
        your permission, contact us immediately.
      </P>

      <H2 n={11}>Cookies</H2>
      <P>
        We use one cookie, <code className="text-[13px] bg-paper-2 px-1 py-0.5 rounded">mj-session</code>,
        which keeps you signed in. It is strictly necessary for the platform to work, cannot be read
        by JavaScript, and is cleared when you sign out or deactivate your account. We do not use
        advertising cookies, analytics cookies or cross-site tracking cookies.
      </P>

      <H2 n={12}>Age requirement</H2>
      <P>
        Mithila Jodi is only for adults. You must be at least 18 years old to register, and the
        platform refuses a date of birth that would make the profile holder younger than 18. The
        service is not directed at children and we do not knowingly collect their data. If you
        believe a profile belongs to a minor, report it or tell us and we will act on it.
      </P>

      <H2 n={13}>Changes to this policy</H2>
      <P>
        If we change this policy in a way that materially affects you, we will tell you through the
        platform before the change takes effect, and we will update the version and effective date at
        the top of this page. Where the law requires fresh consent for a new use of your data, we will
        ask for it rather than assume it.
      </P>

      <H2 n={14}>Contact us and complaints</H2>
      <P>
        For any question about this policy, to exercise your rights over your data, or to make a
        complaint about how we have handled it, reach us at:
      </P>
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
      <P>
        We aim to acknowledge privacy complaints promptly and to resolve them as quickly as we
        reasonably can. If you are not satisfied with our response, you may escalate the matter to the
        appropriate authority under Indian law.
      </P>

      <div className="mt-10 pt-5 border-t border-paper-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
        <Link href="/legal/terms" className="text-maroon underline underline-offset-2">Terms of Service</Link>
        <Link href="/legal/consent" className="text-maroon underline underline-offset-2">Consent &amp; Data</Link>
        <Link href="/safety" className="text-maroon underline underline-offset-2">Safety</Link>
        <Link href="/contact" className="text-maroon underline underline-offset-2">Contact</Link>
      </div>
    </article>
  )
}
