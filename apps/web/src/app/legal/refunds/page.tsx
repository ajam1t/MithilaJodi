import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'

const CANONICAL = `${SITE_URL}/legal/refunds`

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    'Refund and cancellation policy for Mithila Jodi premium membership: how to cancel, the 3-day refund window, how refunds are reviewed and processed, and how the annual membership period works.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    url: CANONICAL,
    siteName: 'Mithila Jodi',
    title: 'Refund & Cancellation Policy',
    description:
      'How cancellation and refunds work for Mithila Jodi premium membership, including the 3-day refund window and how approved refunds are processed.',
  },
  robots: { index: true, follow: true },
}

export default function RefundPolicyPage() {
  return (
    <article className="prose-legal">
      <h1 className="font-serif text-3xl text-maroon mb-2">Refund &amp; Cancellation Policy</h1>
      <p className="text-ink-soft text-sm mb-8">
        Applies to Mithila Jodi premium membership purchases.
      </p>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">1. Overview</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Mithila Jodi is an online matrimony platform for the Mithila and Maithili community. This
          policy explains how you can cancel your premium membership, when you may be eligible for a
          refund, and how an approved refund is processed.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          This policy applies to payments made directly to Mithila Jodi for premium membership. Free
          accounts involve no payment, so no refund arises.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">2. Annual membership</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Mithila Jodi premium membership is currently offered on an <strong>annual basis</strong>.
          A purchase grants premium access for the applicable paid membership period from the date
          the payment is confirmed.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed">
          Your membership <strong>will expire at the end of the annual membership period unless you
          choose to purchase or renew another plan</strong>. Mithila Jodi does not currently charge
          you automatically at the end of the period, and no recurring mandate is set up on your
          payment method.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">3. Cancellation</h2>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm mb-3">
          <li>
            You may cancel your membership, or tell us not to renew it in future, at any time
            through your account settings or by contacting our support team.
          </li>
          <li>
            Cancelling <strong>does not automatically entitle you to a refund</strong> for the
            membership period you have already paid for.
          </li>
          <li>
            After you cancel, your premium access <strong>continues until the end of the annual
            membership period you have already paid for</strong>. It is not cut off immediately.
          </li>
          <li>
            Your profile, biodata and account data are retained after a membership expires. They are
            not deleted merely because premium access has ended.
          </li>
        </ul>
        <p className="text-ink-soft text-sm leading-relaxed">
          To cancel or ask a question, please use our{' '}
          <Link href="/contact" className="text-maroon underline underline-offset-2">contact page</Link>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">4. Refund eligibility — within 3 days</h2>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>
            You may request a refund <strong>within 3 days of the original purchase date</strong>.
          </li>
          <li>
            A refund request may be considered where the premium membership and the paid services
            have <strong>not been substantially used</strong>.
          </li>
          <li>
            Each request is reviewed individually, taking into account the circumstances of the
            request and the activity on the account (for example, the number of interests sent or
            conversations started using premium access).
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">5. Requests made after 3 days</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Refund requests made more than 3 days after the purchase date will{' '}
          <strong>generally not be eligible</strong> for a refund.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          We may still consider an exception in legitimate situations, including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>Duplicate payments for the same membership.</li>
          <li>A technical error that resulted in an incorrect charge.</li>
          <li>An unauthorized transaction, subject to verification.</li>
          <li>Other exceptional circumstances, reviewed by Mithila Jodi on a case-by-case basis.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">6. How to request a refund</h2>
        <p className="text-ink-soft text-sm leading-relaxed mb-3">
          Send a refund request through our{' '}
          <Link href="/contact" className="text-maroon underline underline-offset-2">contact page</Link>,
          from the mobile number registered on your account, including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>The registered mobile number on the account.</li>
          <li>The date of purchase and the plan purchased.</li>
          <li>The payment reference or transaction ID, if you have it.</li>
          <li>The reason for the request.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">7. Approved refunds</h2>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm mb-3">
          <li>
            Where a refund is approved, it is processed back to the{' '}
            <strong>original payment method</strong> wherever possible.
          </li>
          <li>
            Once we have initiated the refund, the time taken for the amount to appear in your
            account <strong>depends on your payment provider and bank</strong>, and is outside
            Mithila Jodi&rsquo;s control. We are unable to guarantee a specific date.
          </li>
          <li>
            When a refund is processed, the associated premium access ends and the account reverts
            to a free account.
          </li>
        </ul>
        <p className="text-ink-soft text-sm leading-relaxed">
          If a refund cannot be returned to the original payment method for a technical reason, we
          will contact you to agree an alternative.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">8. What is not refundable</h2>
        <ul className="list-disc list-inside space-y-2 text-ink-soft text-sm">
          <li>
            Membership periods that have been substantially used, other than in the exceptional
            situations described in section 5.
          </li>
          <li>
            Accounts suspended or terminated for a breach of our{' '}
            <Link href="/legal/terms" className="text-maroon underline underline-offset-2">Terms of Service</Link>,
            including fraudulent, abusive or misleading use of the platform.
          </li>
          <li>
            Dissatisfaction with the number or suitability of matrimonial matches. Mithila Jodi
            provides a platform for matrimonial discovery and does not guarantee a match, a
            response, or a marriage outcome.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink mb-3">9. Changes to this policy</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          We may update this policy from time to time. The version published on this page at the
          time of your purchase applies to that purchase.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-serif text-xl text-ink mb-3">10. Contact us</h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          For any question about cancellation or refunds, please reach us through our{' '}
          <Link href="/contact" className="text-maroon underline underline-offset-2">contact page</Link>.
          Related pages:{' '}
          <Link href="/legal/terms" className="text-maroon underline underline-offset-2">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/legal/privacy" className="text-maroon underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </section>
    </article>
  )
}
