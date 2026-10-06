// Behaviour tests for lib/notifications.ts and lib/notificationCampaigns.ts,
// run against an in-memory fake database (no network, no production data).
//
//   npm run test:notifications
//
// build.js compiles the two libraries (and what they import) to
// .notifications-test/ first; see it for why that step exists.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { fakeDb } = require('./fakeDb')

const OUT = path.join(__dirname, '..', '..', '.notifications-test')
let db

// Freeze "now" to the fake clock, including `new Date()` with no arguments.
const RealDate = Date
global.Date = class extends RealDate {
  constructor(...a) { super(...(a.length ? a : [db ? db.now() : RealDate.now()])) }
  static now() { return db ? db.now() : RealDate.now() }
}

const N = require(path.join(OUT, 'lib/notifications.js'))
const C = require(path.join(OUT, 'lib/notificationCampaigns.js'))

const HOUR = 3_600_000, DAY = 24 * HOUR

function profile(o) {
  return {
    id: o.id, account_id: o.account_id, gender: o.gender, dob: o.dob ?? '1998-05-01',
    first_name: o.first_name ?? 'Test', last_name: o.last_name ?? null,
    religion: 'hindu', caste: o.caste ?? 'maithil_brahmin', sub_caste: null,
    self_gotra: o.self_gotra ?? 'kashyapa', maternal_gotra: o.maternal_gotra ?? 'vatsa', mool: o.mool ?? 'sarisab', gram: null,
    native_place_id: o.native_place_id ?? 2, current_loc_id: o.current_loc_id ?? 1, job_loc_id: null,
    diet: o.diet ?? 'vegetarian', smoking: 'never', drinking: 'never', marriage_timeline: 'within_1_year',
    education_detail: 'graduate', degree: 'btech', family_type: 'nuclear', family_values: 'traditional',
    profile_complete: o.profile_complete ?? 100, profile_status: o.profile_status ?? 'active',
    discoverable: o.discoverable ?? true, deleted_at: null,
    created_at: o.created_at ?? '2026-01-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
    marital_status: o.marital_status ?? 'never_married',
  }
}

function base() {
  return fakeDb({
    india_locations: [
      { id: 1, level: 'city', parent_id: null, state_code: 'BR', latitude: 26.15, longitude: 85.9, is_mithila_region: true },
      { id: 2, level: 'city', parent_id: null, state_code: 'BR', latitude: 26.35, longitude: 86.07, is_mithila_region: true },
      { id: 3, level: 'city', parent_id: null, state_code: 'DL', latitude: 28.6, longitude: 77.2, is_mithila_region: false },
    ],
    profiles: [], profile_preferences: [], blocks: [], notifications: [], notification_sync_state: [],
    conversations: [], messages: [], accounts: [],
  })
}

const mine = (acct) => db.tables.notifications.filter(n => n.account_id === acct)

// ─── notify() dedupe ─────────────────────────────────────────────────────────

test('notify: a key without cooldown is created once, ever', async () => {
  db = base()
  const n = { accountId: 'A', type: 'unread_message_reminder', title: 't', message: 'm', dedupeKey: 'k1' }
  await N.notify(db.client, n); await N.notify(db.client, n)
  db.advance(30 * DAY); await N.notify(db.client, n)
  assert.equal(mine('A').length, 1)
})

test('notify: cooldown allows a repeat only after the window', async () => {
  db = base()
  const n = { accountId: 'A', type: 'profile_incomplete', title: 't', message: 'm', dedupeKey: 'pi', cooldownHours: 24 * 7 }
  await N.notify(db.client, n)
  db.advance(6 * DAY); await N.notify(db.client, n)
  assert.equal(mine('A').length, 1, 'still inside 7 days')
  db.advance(2 * DAY); await N.notify(db.client, n)
  assert.equal(mine('A').length, 2, 'after 7 days a fresh one is allowed')
})

test('notify: refresh mode updates the unread one, and starts a new one once read', async () => {
  db = base()
  const msg = text => ({ accountId: 'A', type: 'new_message', title: 'You have a new message', message: text, dedupeKey: 'new_message:c1', mode: 'refresh' })
  await N.notify(db.client, msg('one'))
  db.advance(HOUR); await N.notify(db.client, msg('two'))
  assert.equal(mine('A').length, 1)
  assert.equal(mine('A')[0].message, 'two')
  mine('A')[0].read = true
  await N.notify(db.client, msg('three'))
  assert.equal(mine('A').length, 2)
})

test('notify: never throws, even when the database errors', async () => {
  const broken = { from: () => { throw new Error('db down') } }
  await N.notify(broken, { accountId: 'A', type: 'system', title: 't', message: 'm' })
})

// ─── Display ─────────────────────────────────────────────────────────────────

test('describeNotification: older rows without title still read well', () => {
  const v = N.describeNotification({ id: '1', type: 'interest_received', payload: { from_name: 'Janaki Jha' }, read: false, created_at: 'x', source: 'system' })
  assert.equal(v.title, 'New interest received')
  assert.equal(v.message, 'Janaki Jha sent you an interest.')
  assert.equal(v.cta_label, 'View Interest')
  const a = N.describeNotification({ id: '2', type: 'announcement', title: 'Hi', message: 'm', icon: 'megaphone', read: true, created_at: 'x', source: 'admin' })
  assert.equal(a.announcement, true)
})

// ─── Profile viewed ──────────────────────────────────────────────────────────

test('profile viewed: named when the viewer is discoverable, weekly at most', async () => {
  db = base()
  const viewer = profile({ id: 'pv', account_id: 'V', gender: 'male', first_name: 'Rohan', last_name: 'Jha' })
  await N.notifyProfileViewed(db.client, viewer, { id: 'pt', account_id: 'T' })
  await N.notifyProfileViewed(db.client, viewer, { id: 'pt', account_id: 'T' })
  assert.equal(mine('T').length, 1)
  assert.equal(mine('T')[0].message, 'Rohan Jha viewed your profile.')
  assert.equal(mine('T')[0].cta_url, '/profile/pv')
  db.advance(8 * DAY)
  await N.notifyProfileViewed(db.client, viewer, { id: 'pt', account_id: 'T' })
  assert.equal(mine('T').length, 2)
})

test('profile viewed: anonymous when the viewer is hidden; nothing when blocked or self', async () => {
  db = base()
  const hidden = profile({ id: 'ph', account_id: 'H', gender: 'male', discoverable: false })
  await N.notifyProfileViewed(db.client, hidden, { id: 'pt', account_id: 'T' })
  assert.equal(mine('T')[0].message, 'A member looked at your profile recently.')
  assert.equal(mine('T')[0].cta_url, null)

  db = base()
  db.tables.blocks.push({ blocker_id: 'pt', blocked_id: 'pv' })
  await N.notifyProfileViewed(db.client, profile({ id: 'pv', account_id: 'V', gender: 'male' }), { id: 'pt', account_id: 'T' })
  await N.notifyProfileViewed(db.client, profile({ id: 'pt', account_id: 'T', gender: 'female' }), { id: 'pt', account_id: 'T' })
  assert.equal(db.tables.notifications.length, 0)
})

// ─── Automatic sync ──────────────────────────────────────────────────────────

test('sync: throttled to once per 30 minutes per member', async () => {
  db = base()
  db.tables.profiles.push(profile({ id: 'me', account_id: 'ME', gender: 'female', profile_complete: 60 }))
  await N.syncAutomaticNotifications(db.client, 'ME')
  mine('ME').length = 0; db.tables.notifications.length = 0
  db.advance(10 * 60_000)
  await N.syncAutomaticNotifications(db.client, 'ME')
  assert.equal(mine('ME').length, 0, 'second run inside 30 min does nothing')
})

test('sync: incomplete profile → one nudge a week; complete → none', async () => {
  db = base()
  db.tables.profiles.push(profile({ id: 'me', account_id: 'ME', gender: 'female', profile_complete: 60 }))
  await N.syncAutomaticNotifications(db.client, 'ME')
  db.advance(HOUR); await N.syncAutomaticNotifications(db.client, 'ME')
  const nudges = mine('ME').filter(n => n.type === 'profile_incomplete')
  assert.equal(nudges.length, 1)
  assert.equal(nudges[0].cta_url, '/profile/edit')

  db = base()
  db.tables.profiles.push(profile({ id: 'me', account_id: 'ME', gender: 'female', profile_complete: 100 }))
  await N.syncAutomaticNotifications(db.client, 'ME')
  assert.equal(mine('ME').filter(n => n.type === 'profile_incomplete').length, 0)
})

test('sync: unread message older than a day → one reminder for that message, never repeated', async () => {
  db = base()
  db.tables.profiles.push(profile({ id: 'me', account_id: 'ME', gender: 'female' }))
  db.tables.conversations.push({ id: 'c1', profile_a: 'me', profile_b: 'x' })
  db.tables.messages.push(
    { id: 'm-old', conversation_id: 'c1', sender_id: 'x', read_at: null, deleted_at: null, sent_at: new Date(db.now() - 30 * HOUR).toISOString() },
    { id: 'm-new', conversation_id: 'c1', sender_id: 'x', read_at: null, deleted_at: null, sent_at: new Date(db.now() - 2 * HOUR).toISOString() },
    { id: 'm-mine', conversation_id: 'c1', sender_id: 'me', read_at: null, deleted_at: null, sent_at: new Date(db.now() - 40 * HOUR).toISOString() },
  )
  await N.syncAutomaticNotifications(db.client, 'ME')
  db.advance(HOUR); await N.syncAutomaticNotifications(db.client, 'ME')
  db.advance(HOUR); await N.syncAutomaticNotifications(db.client, 'ME')
  const r = mine('ME').filter(n => n.type === 'unread_message_reminder')
  assert.equal(r.length, 1)
  assert.equal(r[0].dedupe_key, 'unread_reminder:m-old')
  assert.equal(r[0].cta_url, '/messages/c1')
})

test('sync: new opposite-gender member who fits → one "matching" and one "your city" a day; blocked and same gender excluded', async () => {
  db = base()
  const recent = new Date(db.now() - 2 * HOUR).toISOString()
  db.tables.profiles.push(
    profile({ id: 'me', account_id: 'ME', gender: 'female', self_gotra: 'shandilya', current_loc_id: 1 }),
    profile({ id: 'good', account_id: 'G', gender: 'male', created_at: recent, current_loc_id: 3 }),
    profile({ id: 'near', account_id: 'NR', gender: 'male', created_at: recent, current_loc_id: 2 }),
    profile({ id: 'near2', account_id: 'N2', gender: 'male', created_at: recent, current_loc_id: 1, diet: 'non_vegetarian' }),
    profile({ id: 'blocked', account_id: 'B', gender: 'male', created_at: recent, current_loc_id: 1 }),
    profile({ id: 'samegender', account_id: 'S', gender: 'female', created_at: recent, current_loc_id: 1 }),
  )
  db.tables.blocks.push({ blocker_id: 'blocked', blocked_id: 'me' })

  await N.syncAutomaticNotifications(db.client, 'ME')
  const match = mine('ME').filter(n => n.type === 'new_member_match')
  const city = mine('ME').filter(n => n.type === 'new_member_city')
  assert.equal(match.length, 1, 'one new-match notification')
  assert.equal(match[0].payload.profile_id, 'near', 'the highest-scoring new member')
  assert.equal(match[0].cta_url, '/profile/near')
  assert.equal(city.length, 1, 'one city notification')
  assert.equal(city[0].payload.profile_id, 'near2', 'a different nearby member — never the blocked one, never the same person twice')
  assert.ok(!/Darbhanga|Madhubani/.test(city[0].message), 'no place names')

  // Same day: another new member does not produce a second of either.
  db.tables.profiles.push(profile({ id: 'later', account_id: 'L', gender: 'male', created_at: new Date(db.now() + HOUR).toISOString(), current_loc_id: 1 }))
  db.advance(2 * HOUR)
  await N.syncAutomaticNotifications(db.client, 'ME')
  assert.equal(mine('ME').filter(n => n.type === 'new_member_match').length, 1)
  assert.equal(mine('ME').filter(n => n.type === 'new_member_city').length, 1)
})

test('markConversationNotificationsRead clears only that chat', async () => {
  db = base()
  db.tables.notifications.push(
    { id: '1', account_id: 'A', type: 'new_message', read: false, payload: { conversation_id: 'c1' } },
    { id: '2', account_id: 'A', type: 'unread_message_reminder', read: false, payload: { conversation_id: 'c1' } },
    { id: '3', account_id: 'A', type: 'new_message', read: false, payload: { conversation_id: 'c2' } },
    { id: '4', account_id: 'B', type: 'new_message', read: false, payload: { conversation_id: 'c1' } },
  )
  await N.markConversationNotificationsRead(db.client, 'A', 'c1')
  assert.deepEqual(db.tables.notifications.map(n => n.read), [true, true, false, false])
})

// ─── Admin audiences ─────────────────────────────────────────────────────────

test('campaign audiences: gender, incomplete, condition, specific; banned/deleted dropped', async () => {
  db = base()
  db.tables.profiles.push(
    profile({ id: '11111111-1111-4111-8111-111111111111', account_id: 'm1', gender: 'male', profile_complete: 100, created_at: new Date(db.now() - 2 * DAY).toISOString() }),
    profile({ id: '22222222-2222-4222-8222-222222222222', account_id: 'm2', gender: 'male', profile_complete: 50, caste: 'karn_kayastha' }),
    profile({ id: '33333333-3333-4333-8333-333333333333', account_id: 'f1', gender: 'female', profile_complete: 70 }),
    profile({ id: '44444444-4444-4444-8444-444444444444', account_id: 'f2', gender: 'female', profile_status: 'deactivated' }),
    profile({ id: '55555555-5555-4555-8555-555555555555', account_id: 'banned', gender: 'female' }),
  )
  db.tables.accounts.push(
    { id: 'm1', account_status: 'active', deleted_at: null }, { id: 'm2', account_status: 'active', deleted_at: null },
    { id: 'f1', account_status: 'active', deleted_at: null }, { id: 'f2', account_status: 'active', deleted_at: null },
    { id: 'banned', account_status: 'banned', deleted_at: null },
  )
  const sorted = a => [...a].sort()
  assert.deepEqual(sorted(await C.resolveAudience(db.client, 'all', {}, [])), ['f1', 'm1', 'm2'])
  assert.deepEqual(sorted(await C.resolveAudience(db.client, 'male', {}, [])), ['m1', 'm2'])
  assert.deepEqual(sorted(await C.resolveAudience(db.client, 'female', {}, [])), ['f1'])
  assert.deepEqual(sorted(await C.resolveAudience(db.client, 'incomplete', {}, [])), ['f1', 'm2'])
  assert.deepEqual(await C.resolveAudience(db.client, 'condition', { caste: 'karn_kayastha' }, []), ['m2'])
  assert.deepEqual(await C.resolveAudience(db.client, 'condition', { gender: 'male', joined_within_days: 7 }, []), ['m1'])
  assert.deepEqual(await C.resolveAudience(db.client, 'specific', {}, ['33333333-3333-4333-8333-333333333333', 'not-a-uuid']), ['f1'])
  assert.deepEqual(await C.resolveAudience(db.client, 'specific', {}, ['nope']), [])

  const campaign = { id: 'camp1', type: 'announcement', title: 'New members', message: 'm', cta_label: 'Explore Profiles', cta_url: '/search', expires_at: null }
  const delivered = await C.deliverCampaign(db.client, campaign, ['m1', 'f1'])
  assert.equal(delivered, 2)
  const rows = db.tables.notifications.filter(n => n.campaign_id === 'camp1')
  assert.deepEqual(rows.map(r => [r.account_id, r.source, r.cta_url]), [['m1', 'admin', '/search'], ['f1', 'admin', '/search']])
  await assert.rejects(C.deliverCampaign(db.client, campaign, ['m1']), /duplicate/, 'a member can never get the same campaign twice')
})
