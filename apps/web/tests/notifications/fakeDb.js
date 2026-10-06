// In-memory stand-in for the Supabase query builder — only the calls the
// notification code makes. Rows are plain objects in per-table arrays.
const crypto = require('crypto')

function splitTop(s) {
  const out = []; let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur) out.push(cur)
  return out
}

function get(row, col) {
  if (col.includes('->>')) { const [a, b] = col.split('->>'); return row[a] == null ? undefined : String(row[a][b]) }
  return row[col]
}

function termPred(term) {
  if (term.startsWith('and(')) {
    const parts = splitTop(term.slice(4, -1)).map(termPred)
    return r => parts.every(p => p(r))
  }
  const [col, op, ...rest] = term.split('.')
  const val = rest.join('.')
  if (op === 'eq') return r => String(get(r, col)) === val
  if (op === 'gt') return r => get(r, col) != null && get(r, col) > val
  if (op === 'is' && val === 'null') return r => get(r, col) == null
  if (op === 'in') { const set = val.slice(1, -1).split(','); return r => set.includes(String(get(r, col))) }
  throw new Error('unsupported or-term ' + term)
}

class Q {
  constructor(db, table) { this.db = db; this.table = table; this.preds = []; this.mode = 'select'; this._order = null; this._limit = null; this._range = null; this._single = null; this._head = false }
  rows() { return (this.db.tables[this.table] ??= []) }
  select(_cols, opts) { if (this.mode === 'select' && opts?.head) this._head = true; if (this.mode === 'insert') this._returnInserted = true; return this }
  eq(c, v) { this.preds.push(r => get(r, c) === v || String(get(r, c)) === String(v)); return this }
  neq(c, v) { this.preds.push(r => get(r, c) !== v); return this }
  is(c, v) { this.preds.push(r => (v === null ? get(r, c) == null : get(r, c) === v)); return this }
  in(c, vs) { this.preds.push(r => vs.includes(get(r, c))); return this }
  lt(c, v) { this.preds.push(r => get(r, c) != null && get(r, c) < v); return this }
  gt(c, v) { this.preds.push(r => get(r, c) != null && get(r, c) > v); return this }
  gte(c, v) { this.preds.push(r => get(r, c) != null && get(r, c) >= v); return this }
  not(c, op, v) { if (op !== 'in') throw new Error('not ' + op); const set = v.slice(1, -1).split(','); this.preds.push(r => !set.includes(String(get(r, c)))); return this }
  or(s) { const ps = splitTop(s).map(termPred); this.preds.push(r => ps.some(p => p(r))); return this }
  order(c, o) { this._order = [c, o?.ascending !== false]; return this }
  limit(n) { this._limit = n; return this }
  range(a, b) { this._range = [a, b]; return this }
  maybeSingle() { this._single = 'maybe'; return this }
  single() { this._single = 'one'; return this }
  insert(rows) { this.mode = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this }
  update(vals) { this.mode = 'update'; this.payload = vals; return this }
  upsert(row) { this.mode = 'upsert'; this.payload = row; return this }
  matched() { return this.rows().filter(r => this.preds.every(p => p(r))) }
  exec() {
    const db = this.db
    if (this.mode === 'insert') {
      const created = this.payload.map(r => ({ id: crypto.randomUUID(), created_at: new Date(db.now()).toISOString(), read: false, ...r }))
      if (this.table === 'notifications') {
        for (const c of created) {
          if (c.campaign_id && this.rows().some(x => x.campaign_id === c.campaign_id && x.account_id === c.account_id)) {
            return { data: null, error: { message: 'duplicate key (campaign once)' } }
          }
        }
      }
      this.rows().push(...created)
      db.log.push({ op: 'insert', table: this.table, rows: created })
      return { data: this._single ? created[0] : created, error: null }
    }
    if (this.mode === 'update') {
      const hit = this.matched()
      for (const r of hit) Object.assign(r, this.payload)
      return { data: hit, error: null }
    }
    if (this.mode === 'upsert') {
      const key = this.table === 'notification_sync_state' ? 'account_id' : 'id'
      const ex = this.rows().find(r => r[key] === this.payload[key])
      if (ex) Object.assign(ex, this.payload); else this.rows().push({ ...this.payload })
      return { data: null, error: null }
    }
    let out = this.matched()
    if (this._head) return { data: null, count: out.length, error: null }
    if (this._order) {
      const [c, asc] = this._order
      out = [...out].sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1))
    }
    if (this._range) out = out.slice(this._range[0], this._range[1] + 1)
    if (this._limit != null) out = out.slice(0, this._limit)
    if (this._single) return { data: out[0] ?? null, error: null }
    return { data: out, error: null }
  }
  then(res, rej) { try { res(this.exec()) } catch (e) { rej(e) } }
}

function fakeDb(tables = {}, startMs = Date.parse('2026-10-07T10:00:00Z')) {
  let clock = startMs
  const db = { tables, log: [], now: () => clock, advance: ms => { clock += ms } }
  db.client = { from: t => new Q(db, t) }
  return db
}

module.exports = { fakeDb }
