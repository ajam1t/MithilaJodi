import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { latestDecision } from '@/lib/approval'
import { noindexMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const metadata = noindexMetadata('Profile under review', { follow: false })

/**
 * Where an account waiting for admin approval (or rejected) lands. Outside the
 * (main) group, whose layout sends unapproved members here.
 */
export default async function PendingPage() {
  const account = await getSessionAccount()
  if (!account) redirect('/login?next=/pending')
  if (account.approval === 'approved' || account.staff) redirect('/home')

  const decision = account.approval === 'rejected' ? await latestDecision(await createAdminClient(), account.id).catch(() => null) : null
  const rejected = account.approval === 'rejected'

  return (
    <main id="main-content" className="min-h-screen bg-paper flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-mj-lg border border-gold/40 bg-cream p-7 text-center shadow-mj">
        <Image src="/logo-mark-128.webp" alt="Mithila Jodi" width={64} height={59} className="mx-auto h-14 w-auto" priority />
        {rejected ? (
          <>
            <h1 className="mt-4 font-serif text-[24px] leading-tight text-maroon">आपका खाता अभी स्वीकृत नहीं हुआ</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">हमारी टीम ने आपकी जानकारी की समीक्षा की, पर अभी खाता स्वीकृत नहीं किया जा सका।</p>
            {decision?.reason && (
              <p className="mt-4 rounded-mj border border-paper-3 bg-paper p-3 text-left text-[14px] text-ink"><span className="font-semibold">कारण: </span>{decision.reason}</p>
            )}
            <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">जानकारी सुधारकर दोबारा समीक्षा के लिए हमसे संपर्क करें।</p>
            <Link href="/contact" className="btn-primary mt-5 inline-flex px-6 py-2.5 text-[14.5px]">संपर्क करें</Link>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-serif text-[24px] leading-tight text-maroon">Your Mithila Jodi profile is under review ❤️</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Our team is reviewing your submitted information. You will receive a notification once your account is approved.
            </p>
            <p className="mt-3 font-deva text-[15px] leading-relaxed text-ink-soft" lang="hi">
              आपकी प्रोफ़ाइल की समीक्षा हो रही है। स्वीकृत होते ही आपको सूचना मिल जाएगी।
            </p>
            <p className="mt-5 text-[13.5px] text-ink-soft">इस बीच आप अपनी प्रोफ़ाइल और फ़ोटो पूरी कर सकते हैं — इससे समीक्षा जल्दी होती है।</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/profile/edit" className="btn-primary inline-flex px-5 py-2.5 text-[14.5px]">प्रोफ़ाइल पूरी करें</Link>
              <Link href="/settings" className="inline-flex items-center rounded-full border border-gold/50 px-5 py-2.5 text-[14.5px] font-semibold text-maroon">सेटिंग</Link>
            </div>
          </>
        )}
        <p className="mt-6 text-[12.5px] text-ink-soft">Mithila Jodi · जहाँ परंपरा मिले, प्रेम से</p>
      </div>
    </main>
  )
}
