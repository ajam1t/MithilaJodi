'use strict'
/**
 * seed-demo-profiles.js
 * Creates 20 synthetic demo profiles (10 male, 10 female) for testing search,
 * filters, shortlist and interest flows before real users join.
 *
 * PREREQUISITE: run migration supabase/migrations/20260826000002_demo_flag.sql
 * first (adds accounts.is_demo + profiles.is_demo).
 *
 * Run from the project root:
 *   node supabase/seed-demo-profiles.js
 *
 * Safety:
 *  - Every row is marked is_demo = true.
 *  - Demo profiles are discoverable/active so they appear in authenticated
 *    member search, but are NOT added to public_showcase — so they never show
 *    publicly on the homepage/explore as if they were real featured members.
 *  - No photos are attached (the profile card renders its Madhubani placeholder)
 *    — no real or fake person photographs are used.
 *  - Public profile URLs (/profile/*) are disallowed in robots.ts, so demo
 *    profiles are never crawled/indexed.
 *
 * Re-running is safe (it deletes existing demo rows first). To remove entirely:
 *   DELETE FROM profiles WHERE is_demo = true;  DELETE FROM accounts WHERE is_demo = true;
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnv() {
  const candidates = [
    path.join(__dirname, '..', 'apps', 'web', '.env.local'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
  ]
  const env = { ...process.env }
  for (const f of candidates) {
    if (!fs.existsSync(f)) continue
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
    break
  }
  return env
}

// ── Demo data ───────────────────────────────────────────────
// Diverse surnames, cities (metros + Mithila/Bihar), gotra, mool, diet, height.
// Surnames are used for dataset realism only — NOT as indicators of caste/identity.

const MALES = [
  { first: 'Amit',    last: 'Jha',       age: 29, city: 'Bengaluru', native: 'Darbhanga',    gotra: 'Kashyap',    mat: 'Sandilya',  mool: 'Saurath',    gram: 'Sarisab',    caste: 'Maithil Brahmin', edu: 'B.Tech (Computer Science)', prof: 'Software Engineer',  height: 175, diet: 'vegetarian' },
  { first: 'Rohit',   last: 'Mishra',    age: 31, city: 'Pune',      native: 'Madhubani',    gotra: 'Bharadwaj',  mat: 'Vatsa',     mool: 'Khauwal',    gram: 'Rajnagar',   caste: 'Maithil Brahmin', edu: 'MBA',                       prof: 'Product Manager',   height: 178, diet: 'non_vegetarian' },
  { first: 'Saurabh', last: 'Chaudhary', age: 28, city: 'Delhi',     native: 'Muzaffarpur',  gotra: 'Vatsa',      mat: 'Kashyap',   mool: 'Palikwar',   gram: 'Katra',      caste: 'Maithil',         edu: 'B.Com, CA',                 prof: 'Chartered Accountant', height: 172, diet: 'vegetarian' },
  { first: 'Nikhil',  last: 'Roy',       age: 33, city: 'Mumbai',    native: 'Samastipur',   gotra: 'Sandilya',   mat: 'Bharadwaj', mool: 'Saptasati',  gram: 'Rosera',     caste: 'Kayastha',        edu: 'M.Tech',                    prof: 'Data Scientist',    height: 180, diet: 'eggetarian' },
  { first: 'Aditya',  last: 'Thakur',    age: 27, city: 'Hyderabad', native: 'Sitamarhi',    gotra: 'Gautam',     mat: 'Parashar',  mool: 'Belaunch',   gram: 'Pupri',      caste: 'Maithil Brahmin', edu: 'MBBS',                      prof: 'Doctor',            height: 176, diet: 'vegetarian' },
  { first: 'Vishal',  last: 'Karn',      age: 30, city: 'Gurugram',  native: 'Darbhanga',    gotra: 'Kaushik',    mat: 'Kashyap',   mool: 'Sakraudhi',  gram: 'Benipur',    caste: 'Karn Kayastha',   edu: 'MBA',                       prof: 'Marketing Manager', height: 174, diet: 'non_vegetarian' },
  { first: 'Ankit',   last: 'Mandal',    age: 26, city: 'Noida',     native: 'Saharsa',      gotra: 'Parashar',   mat: 'Gautam',    mool: 'Bhanpur',    gram: 'Simri',      caste: 'Maithil',         edu: 'B.Sc',                      prof: 'Banking Officer',   height: 170, diet: 'vegetarian' },
  { first: 'Prakash', last: 'Yadav',     age: 32, city: 'Patna',     native: 'Supaul',       gotra: 'Vashishtha', mat: 'Vatsa',     mool: 'Karmaha',    gram: 'Nirmali',    caste: 'Maithil',         edu: 'LLB',                       prof: 'Advocate',          height: 177, diet: 'non_vegetarian' },
  { first: 'Manish',  last: 'Sah',       age: 29, city: 'Kolkata',   native: 'Muzaffarpur',  gotra: 'Savarna',    mat: 'Sandilya',  mool: 'Ekhara',     gram: 'Sahebganj',  caste: 'Maithil',         edu: 'B.Com',                     prof: 'Business Owner',    height: 168, diet: 'vegetarian' },
  { first: 'Deepak',  last: 'Singh',     age: 34, city: 'Chennai',   native: 'Madhubani',    gotra: 'Kaundinya',  mat: 'Bharadwaj', mool: 'Maraich',    gram: 'Jhanjharpur',caste: 'Maithil',         edu: 'PhD',                       prof: 'Assistant Professor', height: 182, diet: 'vegetarian' },
]

const FEMALES = [
  { first: 'Anjali', last: 'Jha',       age: 26, city: 'Bengaluru', native: 'Darbhanga',   gotra: 'Bharadwaj',  mat: 'Kashyap',   mool: 'Saurath',   gram: 'Sarisab',    caste: 'Maithil Brahmin', edu: 'B.Tech (IT)',   prof: 'Software Engineer',   height: 160, diet: 'vegetarian' },
  { first: 'Priya',  last: 'Mishra',    age: 27, city: 'Pune',      native: 'Madhubani',   gotra: 'Vatsa',      mat: 'Sandilya',  mool: 'Khauwal',   gram: 'Rajnagar',   caste: 'Maithil Brahmin', edu: 'MBA (HR)',      prof: 'HR Manager',          height: 158, diet: 'non_vegetarian' },
  { first: 'Neha',   last: 'Chaudhary', age: 25, city: 'Delhi',     native: 'Muzaffarpur', gotra: 'Sandilya',   mat: 'Gautam',    mool: 'Palikwar',  gram: 'Katra',      caste: 'Maithil',         edu: 'M.Sc',          prof: 'Research Associate',  height: 162, diet: 'vegetarian' },
  { first: 'Shreya', last: 'Roy',       age: 28, city: 'Mumbai',    native: 'Samastipur',  gotra: 'Kashyap',    mat: 'Bharadwaj', mool: 'Saptasati', gram: 'Rosera',     caste: 'Kayastha',        edu: 'MBA (Finance)', prof: 'Financial Analyst',   height: 165, diet: 'eggetarian' },
  { first: 'Pooja',  last: 'Thakur',    age: 24, city: 'Hyderabad', native: 'Sitamarhi',   gotra: 'Parashar',   mat: 'Vatsa',     mool: 'Belaunch',  gram: 'Pupri',      caste: 'Maithil Brahmin', edu: 'B.Ed',          prof: 'Teacher',             height: 156, diet: 'vegetarian' },
  { first: 'Ritu',   last: 'Karn',      age: 29, city: 'Gurugram',  native: 'Darbhanga',   gotra: 'Gautam',     mat: 'Kashyap',   mool: 'Sakraudhi', gram: 'Benipur',    caste: 'Karn Kayastha',   edu: 'MBBS',          prof: 'Doctor',              height: 161, diet: 'non_vegetarian' },
  { first: 'Kavya',  last: 'Mandal',    age: 26, city: 'Noida',     native: 'Saharsa',     gotra: 'Kaushik',    mat: 'Parashar',  mool: 'Bhanpur',   gram: 'Simri',      caste: 'Maithil',         edu: 'B.Arch',        prof: 'Architect',           height: 159, diet: 'vegetarian' },
  { first: 'Swati',  last: 'Yadav',     age: 30, city: 'Patna',     native: 'Supaul',      gotra: 'Vashishtha', mat: 'Sandilya',  mool: 'Karmaha',   gram: 'Nirmali',    caste: 'Maithil',         edu: 'LLB',           prof: 'Lawyer',              height: 163, diet: 'vegetarian' },
  { first: 'Divya',  last: 'Sah',       age: 27, city: 'Kolkata',   native: 'Muzaffarpur', gotra: 'Savarna',    mat: 'Bharadwaj', mool: 'Ekhara',    gram: 'Sahebganj',  caste: 'Maithil',         edu: 'B.Des',         prof: 'UX Designer',         height: 157, diet: 'non_vegetarian' },
  { first: 'Sneha',  last: 'Singh',     age: 25, city: 'Darbhanga', native: 'Darbhanga',   gotra: 'Kaundinya',  mat: 'Gautam',    mool: 'Maraich',   gram: 'Jhanjharpur',caste: 'Maithil',         edu: 'M.A (English)', prof: 'Content Writer',      height: 160, diet: 'vegetarian' },
]

function dobForAge(age) {
  const year = 2026 - age
  return `${year}-06-15`
}

async function main() {
  const env = loadEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked apps/web/.env.local, .env.local, .env)')
    process.exit(1)
  }
  const sb = createClient(url, key, { auth: { persistSession: false } })

  // 0. Wipe any previous demo rows (idempotent). profiles first (FK RESTRICT).
  const del1 = await sb.from('profiles').delete().eq('is_demo', true)
  if (del1.error && !/column .*is_demo.* does not exist/i.test(del1.error.message)) {
    console.error('Could not clear demo profiles:', del1.error.message)
  }
  const del2 = await sb.from('accounts').delete().eq('is_demo', true)
  if (del2.error && /is_demo/.test(del2.error.message)) {
    console.error('\n>> Run migration supabase/migrations/20260826000002_demo_flag.sql first (is_demo column missing).\n')
    process.exit(1)
  }

  // 1. Resolve location ids by name (first match wins).
  const allNames = [...new Set([...MALES, ...FEMALES].flatMap((p) => [p.city, p.native]))]
  const { data: locRows, error: locErr } = await sb
    .from('india_locations')
    .select('id, name_en')
    .in('name_en', allNames)
  if (locErr) console.error('Location lookup error:', locErr.message)
  const locId = new Map()
  for (const l of locRows ?? []) if (!locId.has(l.name_en)) locId.set(l.name_en, l.id)

  const rows = [
    ...MALES.map((p, i) => ({ ...p, gender: 'male', idx: i + 1 })),
    ...FEMALES.map((p, i) => ({ ...p, gender: 'female', idx: i + 11 })),
  ]

  let ok = 0, fail = 0
  for (const p of rows) {
    const mobile = `+91990000${String(p.idx).padStart(4, '0')}` // +91 99000000NN

    // account
    const { data: acct, error: acctErr } = await sb
      .from('accounts')
      .insert({ mobile, mobile_verified: true, account_status: 'active', role: 'user', is_demo: true })
      .select('id')
      .single()
    if (acctErr || !acct) { console.error(`FAIL account ${p.first} ${p.last}: ${acctErr?.message}`); fail++; continue }

    // profile
    const about = `${p.first} is a ${p.prof.toLowerCase()} based in ${p.city}, with family roots in ${p.native}, Mithila. Family-oriented and looking for a compatible life partner who values tradition, education and togetherness.`
    const { data: prof, error: profErr } = await sb
      .from('profiles')
      .insert({
        account_id: acct.id,
        profile_for: 'self',
        first_name: p.first,
        last_name: p.last,
        gender: p.gender,
        dob: dobForAge(p.age),
        religion: 'Hindu',
        caste: p.caste,
        self_gotra: p.gotra,
        maternal_gotra: p.mat,
        mool: p.mool,
        gram: p.gram,
        native_place_id: locId.get(p.native) ?? null,
        current_loc_id: locId.get(p.city) ?? null,
        education_detail: p.edu,
        profession_detail: p.prof,
        employer: null,
        height_cm: p.height,
        diet: p.diet,
        smoking: 'no',
        drinking: 'no',
        about_me: about,
        profile_status: 'active',
        discoverable: true,
        profile_complete: 90,
        activated_at: new Date().toISOString(),
        is_demo: true,
      })
      .select('id')
      .single()
    if (profErr || !prof) { console.error(`FAIL profile ${p.first} ${p.last}: ${profErr?.message}`); fail++; continue }

    // preferences (opposite gender, age window around theirs)
    await sb.from('profile_preferences').insert({
      profile_id: prof.id,
      pref_gender: p.gender === 'male' ? 'female' : 'male',
      pref_age_min: Math.max(18, p.age - 5),
      pref_age_max: p.age + 4,
      pref_gotra_safe: true,
    })

    console.log(`  OK  ${p.gender === 'male' ? 'M' : 'F'}  ${p.first} ${p.last} — ${p.city}`)
    ok++
  }

  console.log(`\nDone. ${ok} demo profiles created, ${fail} failed.`)
  console.log('These are is_demo=true, discoverable in member search, and excluded from the public showcase.')
}

main().catch((e) => { console.error(e); process.exit(1) })
