// Profile → biodata mapping for the member prefill on /marriage-biodata.
// Run with `npm run test:biodata`.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { profileToBiodata, formatHeight, formDate, clean } = require(path.join(__dirname, '..', '..', '.biodata-test', 'biodataProfile.js'))

const LABELS = {
  gotra: { shandilya: 'Shandilya', kashyap: 'Kashyap' },
  mool: { sarisab_sarisav: 'Sarisab' },
  caste: { maithil_brahmin: 'Maithil Brahmin' },
  marital_status: { never_married: 'Never Married' },
  income_range: { '10_15': '₹10–15 LPA' },
  manglik: { no: 'No' },
}
const label = (type, value) => (value ? LABELS[type]?.[value] ?? value.replace(/_/g, ' ') : null)
const resolved = (extra = {}) => ({ label, ...extra })

test('maps a complete profile to form fields', () => {
  const d = profileToBiodata({
    first_name: 'Priya', last_name: 'Jha', gender: 'female', dob: '1997-03-14', height_cm: 162,
    caste: 'maithil_brahmin', self_gotra: 'shandilya', maternal_gotra: 'kashyap', mool: 'sarisab_sarisav', gram: 'Rajnagar',
    marital_status: 'never_married', degree: 'B.Tech', specialization: 'Computer Science', institution: 'NIT Patna',
    job_title: 'Software Engineer', employer: 'TCS',
    about_me: 'First paragraph.\r\n\r\nSecond paragraph.', parents_info: 'Father: teacher', siblings_info: 'One brother',
    family_about: 'A warm family.', family_introduction: 'We live in Darbhanga.',
  }, { income_range: '10_15', mangalik: 'no', contact_mobile: ' +91 98765 43210 ' }, resolved({ currentLocation: 'Mumbai, Maharashtra', nativePlace: 'Madhubani, Bihar' }))

  assert.equal(d.full_name, 'Priya Jha')
  assert.equal(d.dob, '1997-03-14')
  assert.equal(d.gender, 'Female')
  assert.equal(d.height, `5'4" (162 cm)`)
  assert.equal(d.caste, 'Maithil Brahmin')
  assert.equal(d.self_gotra, 'Shandilya')
  assert.equal(d.maternal_gotra, 'Kashyap')
  assert.equal(d.mool, 'Sarisab')
  assert.equal(d.gram, 'Rajnagar')
  assert.equal(d.marital_status, 'Never Married')
  assert.equal(d.education, 'B.Tech, Computer Science — NIT Patna')
  assert.equal(d.profession, 'Software Engineer')
  assert.equal(d.employer, 'TCS')
  assert.equal(d.income, '₹10–15 LPA')
  assert.equal(d.current_location, 'Mumbai, Maharashtra')
  assert.equal(d.native_place, 'Madhubani, Bihar')
  assert.equal(d.about_me, 'First paragraph.\n\nSecond paragraph.', 'paragraph breaks are kept')
  assert.equal(d.parents, 'Father: teacher')
  assert.equal(d.siblings, 'One brother')
  assert.equal(d.family_about, 'A warm family.\n\nWe live in Darbhanga.')
  assert.equal(d.mangalik, 'No')
  assert.equal(d.mobile, '+91 98765 43210')
})

test('never fabricates: empty, blank and missing values are left out', () => {
  const d = profileToBiodata({ first_name: 'Ravi', last_name: '  ', about_me: '   ', gram: '', height_cm: null }, null, resolved())
  assert.deepEqual(d, { full_name: 'Ravi' })
})

test('has no blood group, medical or system fields', () => {
  const d = profileToBiodata(
    { first_name: 'A', id: 'uuid-1', account_id: 'acc', profile_status: 'active', blood_group: 'B+', managed_by: 'parent' },
    { kundli_url: 'https://x', contact_visibility: 'mutual' },
    resolved(),
  )
  for (const k of ['blood_group', 'id', 'account_id', 'profile_status', 'managed_by', 'kundli', 'kundli_url', 'contact_visibility']) {
    assert.ok(!(k in d), `${k} must not be mapped`)
  }
})

test('legacy records: education and profession fall back in order', () => {
  assert.equal(profileToBiodata({ education_detail: 'MBA, IIM' }, null, resolved({ educationLevel: 'Post Graduate' })).education, 'MBA, IIM')
  assert.equal(profileToBiodata({}, null, resolved({ educationLevel: 'Post Graduate' })).education, 'Post Graduate')
  assert.equal(profileToBiodata({ profession_detail: 'Doctor' }, null, resolved({ profession: 'Medical' })).profession, 'Doctor')
  assert.equal(profileToBiodata({}, null, resolved({ profession: 'Medical' })).profession, 'Medical')
})

test('duplicate family text is not repeated', () => {
  const d = profileToBiodata({ family_about: 'We are a family of teachers.', family_introduction: 'we are a family of teachers.' }, null, resolved())
  assert.equal(d.family_about, 'We are a family of teachers.')
})

test('income falls back to the legacy min/max columns', () => {
  assert.equal(profileToBiodata({}, { income_min_lpa: 8, income_max_lpa: 12 }, resolved()).income, '₹8 – 12 LPA')
  assert.equal(profileToBiodata({}, { income_min_lpa: 0, income_max_lpa: 0 }, resolved()).income, undefined)
})

test('helpers reject invalid values', () => {
  assert.equal(formatHeight(30), null)
  assert.equal(formatHeight(183), `6'0" (183 cm)`)
  assert.equal(formDate('1997-02-30'), null)
  assert.equal(formDate('1997-02-03T00:00:00Z'), '1997-02-03')
  assert.equal(formDate('not a date'), null)
  assert.equal(clean('  '), null)
})
