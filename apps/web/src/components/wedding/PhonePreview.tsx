import '@/styles/wedding.css'
import { SAMPLE_INVITE } from '@/lib/wedding/sample'
import { WeddingSite } from './site/WeddingSite'

/** A phone showing the sample invitation — decorative, not interactive. */
export function PhonePreview({ className = '' }: { className?: string }) {
  return (
    <div className={`relative mx-auto w-[250px] sm:w-[280px] ${className}`} aria-hidden="true">
      <div className="overflow-hidden rounded-[34px] border-[9px] border-[#2B211C] bg-[#2B211C] shadow-mj">
        <div className="relative h-[480px] sm:h-[540px] overflow-hidden rounded-[25px] bg-white">
          <div className="pointer-events-none origin-top-left scale-[0.64] w-[156%]" inert>
            <WeddingSite invite={SAMPLE_INVITE} shareUrl="" mode="embedded" />
          </div>
        </div>
      </div>
    </div>
  )
}
