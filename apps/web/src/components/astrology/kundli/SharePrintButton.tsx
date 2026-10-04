'use client'

import { fileSafe } from './printing'

/** Prints the shared result page with the site header, footer and nav hidden. */
export function SharePrintButton({ title }: { title: string }) {
  function print() {
    const previous = document.title
    document.title = fileSafe(title)
    document.body.classList.add('kd-printing-share')
    let done = false
    const finish = () => {
      if (done) return
      done = true
      document.body.classList.remove('kd-printing-share')
      document.title = previous
      window.removeEventListener('afterprint', finish)
    }
    window.addEventListener('afterprint', finish)
    window.print()
    setTimeout(finish, 60_000)
  }
  return <button type="button" className="btn-ghost" onClick={print}>Print / Save as PDF</button>
}
