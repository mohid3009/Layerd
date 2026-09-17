// Static check: every JSX component used in the portal files must be either
// imported or defined locally in that file — catches the class of runtime
// ReferenceErrors that esbuild cannot see.
const fs = require('fs')
const path = require('path')
const SRC = path.resolve(__dirname, '../3d_map/frontend/src')
const DIRS = [
  path.join(SRC, 'pages'),
  path.join(SRC, 'components', 'layout'),
  path.join(SRC, 'components', 'ui'),
  path.join(SRC, 'components'),
]
const files = [
  path.join(SRC, 'components', 'Building3DScene.jsx'),
  ...DIRS.flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith('.jsx')).map((f) => path.join(d, f))),
]
// globals allowed as JSX hosts (intrinsic-ish / DOM / valid lowercase)
const builtins = new Set(['Fragment', 'StrictMode', 'Suspense'])
let bad = 0
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  // collect imported identifiers
  const imported = new Set()
  for (const m of src.matchAll(/import\s+\{([^}]+)\}\s+from/g)) {
    for (const n of m[1].split(',')) {
      const name = n.trim().split(/\s+as\s+/).pop().trim()
      if (name) imported.add(name)
    }
  }
  for (const m of src.matchAll(/import\s+(\w+)\s*,?\s*(?:\{[^}]*\})?\s*from/g)) imported.add(m[1])
  // local definitions
  for (const m of src.matchAll(/(?:function|const|class)\s+([A-Z]\w*)/g)) imported.add(m[1])
  // JSX component usages (<Foo and <Foo.Bar — skip lowercase intrinsics)
  for (const m of src.matchAll(/<([A-Z][\w.]*)/g)) {
    const name = m[1].split('.')[0]
    if (!imported.has(name) && !builtins.has(name)) {
      console.log(`${path.basename(file)}: <${name}> is not imported or defined`)
      bad++
    }
  }
}
console.log(bad ? `${bad} undefined JSX component(s) found` : 'all JSX components resolve OK')
process.exit(bad ? 1 : 0)