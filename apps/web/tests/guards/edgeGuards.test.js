// Middleware guards: cross-site write refusal and burst limits.
// Run with `npm run test:guards`.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { checkLimit, isCrossSiteWrite, _resetLimits } = require(path.join(__dirname, '..', '..', '.guards-test', 'edgeGuards.js'))

test('same-origin and origin-less writes pass', () => {
  assert.equal(isCrossSiteWrite('POST', 'https://mithilajodi.com', 'mithilajodi.com'), false)
  assert.equal(isCrossSiteWrite('POST', 'https://MithilaJodi.com', 'mithilajodi.com'), false)
  assert.equal(isCrossSiteWrite('POST', null, 'mithilajodi.com'), false)
  assert.equal(isCrossSiteWrite('DELETE', 'http://localhost:3000', 'localhost:3000'), false)
})

test('cross-site writes are refused; reads are not', () => {
  assert.equal(isCrossSiteWrite('POST', 'https://evil.example', 'mithilajodi.com'), true)
  assert.equal(isCrossSiteWrite('PATCH', 'https://mithilajodi.com.evil.example', 'mithilajodi.com'), true)
  assert.equal(isCrossSiteWrite('POST', 'null', 'mithilajodi.com'), true)
  assert.equal(isCrossSiteWrite('POST', 'not a url', 'mithilajodi.com'), true)
  assert.equal(isCrossSiteWrite('GET', 'https://evil.example', 'mithilajodi.com'), false)
})

test('messages: 30 a minute per client, then 429 until the window passes', () => {
  _resetLimits()
  const p = '/api/conversations/abc/messages', t0 = 1_000_000
  for (let i = 0; i < 30; i++) assert.equal(checkLimit('POST', p, 'alice', t0 + i).ok, true)
  const blocked = checkLimit('POST', p, 'alice', t0 + 31)
  assert.equal(blocked.ok, false)
  assert.ok(blocked.retryAfterSeconds >= 1 && blocked.retryAfterSeconds <= 60)
  assert.equal(checkLimit('POST', p, 'bob', t0 + 32).ok, true, 'another client is unaffected')
  assert.equal(checkLimit('POST', p, 'alice', t0 + 61_000).ok, true, 'allowed again after the window')
})

test('ordinary page reads are never limited; general writes have a ceiling', () => {
  _resetLimits()
  for (let i = 0; i < 500; i++) assert.equal(checkLimit('GET', '/api/notifications', 'c', 5_000 + i).ok, true)
  for (let i = 0; i < 120; i++) assert.equal(checkLimit('PUT', '/api/profile', 'c', 9_000 + i).ok, true)
  assert.equal(checkLimit('PUT', '/api/profile', 'c', 9_500).ok, false)
})

test('search is limited separately from writes', () => {
  _resetLimits()
  for (let i = 0; i < 90; i++) assert.equal(checkLimit('GET', '/api/search', 'c', 100 + i).ok, true)
  assert.equal(checkLimit('GET', '/api/search', 'c', 300).ok, false)
  assert.equal(checkLimit('POST', '/api/interests', 'c', 301).ok, true)
})
