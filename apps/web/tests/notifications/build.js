// Compiles lib/notifications.ts and lib/notificationCampaigns.ts for the
// node test runner. Two things tsc alone cannot do for a plain-node run:
//   • rewrite the `@/…` path aliases to relative requires;
//   • satisfy `import 'server-only'`, which Next resolves itself and which is
//     not an installed package — an empty stub stands in for it here.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const web = path.join(__dirname, '..', '..')
const out = path.join(web, '.notifications-test')

fs.rmSync(out, { recursive: true, force: true })
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc', { paths: [web] }), '-p', path.join(web, 'tsconfig.notifications-test.json')], { stdio: 'inherit', cwd: web })

;(function rewrite(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) { rewrite(p); continue }
    if (!p.endsWith('.js')) continue
    const src = fs.readFileSync(p, 'utf8').replace(/require\("@\/([^"]+)"\)/g, (_, mod) => {
      let rel = path.relative(path.dirname(p), path.join(out, mod)).split(path.sep).join('/')
      if (!rel.startsWith('.')) rel = './' + rel
      return `require("${rel}")`
    })
    fs.writeFileSync(p, src)
  }
})(out)

fs.mkdirSync(path.join(out, 'node_modules', 'server-only'), { recursive: true })
fs.writeFileSync(path.join(out, 'node_modules', 'server-only', 'index.js'), '')
