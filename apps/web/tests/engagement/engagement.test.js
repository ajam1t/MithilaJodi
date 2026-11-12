// Engagement journey helpers and the 30 seeded messages. Run with `npm run test:engagement`.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const B = path.join(__dirname, '..', '..', '.engagement-test')
const { nextSendAt, renderMessage, instagramHandle } = require(path.join(B, 'engagement', 'format.js'))
const { DEACTIVATION_REASONS, isDeactivationReason } = require(path.join(B, 'deactivation.js'))
const SEED = require('../../src/lib/engagement/seedMessages.json')
const nine = { send_hour: 9, send_minute: 0 }
const ist = d => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 16)

test('approved before 09:00 IST: Day 2 is tomorrow at 09:00 IST', () => {
  assert.equal(ist(nextSendAt(new Date('2026-11-12T01:00:00Z'), nine)), '2026-11-13T09:00')   // 06:30 IST
})
test('approved after 09:00 IST: Day 2 is still tomorrow at 09:00 IST', () => {
  assert.equal(ist(nextSendAt(new Date('2026-11-12T12:00:00Z'), nine)), '2026-11-13T09:00')   // 17:30 IST
})
test('late evening UTC that is already the next day in India', () => {
  assert.equal(ist(nextSendAt(new Date('2026-11-12T20:00:00Z'), nine)), '2026-11-14T09:00')   // 01:30 IST on the 13th
})
test('custom send time and month rollover', () => {
  assert.equal(ist(nextSendAt(new Date('2026-11-30T10:00:00Z'), { send_hour: 18, send_minute: 30 })), '2026-12-01T18:30')
})
test('placeholders are filled and the automated note is appended', () => {
  const out = renderMessage('नमस्कार {name} जी! {instagram_handle} {instagram_url} 👉 {link}', { name: 'सीता', link: 'https://mithilajodi.com/home', instagramUrl: 'https://www.instagram.com/MithilaJodiOfficial/' })
  assert.match(out, /नमस्कार सीता जी! @MithilaJodiOfficial https:\/\/www\.instagram\.com\/MithilaJodiOfficial\/ 👉 https:\/\/mithilajodi\.com\/home/)
  assert.match(out, /स्वचालित संदेश/)
  assert.equal(instagramHandle('https://instagram.com/abc'), '@abc')
  assert.match(renderMessage('{name}', { name: '  ', link: '', instagramUrl: '' }), /^सदस्य/)
})
test('30 seeded messages: one per day, each with a title, a link and both placeholders', () => {
  assert.deepEqual(SEED.map(m => m.day), Array.from({ length: 30 }, (_, i) => i + 1))
  for (const m of SEED) {
    assert.ok(m.title && m.body.includes('{name}') && m.body.includes('{link}'), `day ${m.day}`)
    assert.match(m.url, /^\//)
  }
  assert.ok(SEED[0].body.includes('{instagram_handle}') && SEED[0].body.includes('{instagram_url}'))
})
test('deactivation reasons: the eight from the brief', () => {
  assert.equal(DEACTIVATION_REASONS.length, 8)
  assert.ok(isDeactivationReason('other') && !isDeactivationReason('bogus'))
})
