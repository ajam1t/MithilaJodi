'use client'

/**
 * Print the element portalled at #kundli-print. The body class scopes the print
 * stylesheet to this one action; it is removed on afterprint (supported by all
 * current browsers) with a long fallback for any that never fire it.
 */
export function printKundliReport(fileTitle: string) {
  const previous = document.title
  document.title = fileTitle
  document.body.classList.add('kd-printing')
  let done = false
  const finish = () => {
    if (done) return
    done = true
    document.body.classList.remove('kd-printing')
    document.title = previous
    window.removeEventListener('afterprint', finish)
  }
  window.addEventListener('afterprint', finish)
  window.print()
  setTimeout(finish, 60_000)
}

export function fileSafe(s: string) {
  return s.normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 30) || 'match'
}
