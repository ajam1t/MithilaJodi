import { RevealOnScroll } from '@/components/motion/RevealOnScroll'

/**
 * Page transition, plus the single mount point for scroll reveals.
 *
 * A `template` rather than a `layout` because Next remounts a template on every
 * navigation while a layout persists. Remounting is what restarts the CSS
 * animation, and it is also what re-scans the new page for reveal targets.
 *
 * The transition itself lives in globals.css and is a 220ms opacity fade with
 * no transform. That restraint is load-bearing: a transformed ancestor becomes
 * the containing block for its `position: fixed` descendants, so translating
 * this wrapper would shift the mobile bottom nav and the sticky profile header
 * for the duration of every navigation.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="mj-page-enter">
      <RevealOnScroll />
      {children}
    </div>
  )
}
