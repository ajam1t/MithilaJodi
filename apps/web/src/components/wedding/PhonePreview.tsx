import '@/styles/wedding.css'
import { SAMPLE_INVITE } from '@/lib/wedding/sample'
import type { Invite } from '@/lib/wedding/schema'
import { WeddingSite } from './site/WeddingSite'

/** A phone showing the sample invitation — decorative, not interactive. */
export function PhonePreview({ className = '', invite = SAMPLE_INVITE, opening = 'none' }: {
  className?: string
  invite?: Invite
  /** 'preview' shows the invitation's opening (sealed) instead of its first page. */
  opening?: 'none' | 'preview'
}) {
  return (
    <div className={`relative mx-auto w-[250px] sm:w-[280px] ${className}`} aria-hidden="true">
      <div className="overflow-hidden rounded-[34px] border-[9px] border-[#2B211C] bg-[#2B211C] shadow-mj">
        <div className="relative h-[480px] sm:h-[540px] overflow-hidden rounded-[25px] bg-white">
          {/* An opening fills its frame: give it exactly one (scaled) phone screen. */}
          <div className={`pointer-events-none origin-top-left scale-[0.64] w-[156%] ${opening === 'preview' ? 'h-[156.25%] overflow-hidden' : ''}`} inert>
            <WeddingSite invite={invite} shareUrl="" mode="embedded" opening={opening} />
          </div>
        </div>
      </div>
    </div>
  )
}
