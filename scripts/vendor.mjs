import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'

await mkdir('vendor/prettier/plugins', { recursive: true })
await rm('vendor/licenses', { recursive: true, force: true })
await mkdir('vendor/licenses', { recursive: true })
const usedPackages = new Set(['node_modules/prettier'])
await cp('node_modules/prettier/standalone.mjs', 'vendor/prettier/standalone.mjs')
for (const name of ['babel', 'estree', 'html', 'postcss', 'typescript', 'yaml', 'markdown', 'graphql']) {
  await cp(`node_modules/prettier/plugins/${name}.mjs`, `vendor/prettier/plugins/${name}.mjs`)
}
for (const [entry, output] of [['@prettier/plugin-xml', 'xml'], ['sql-formatter', 'sql']]) {
  const result = await build({
    stdin: { contents: `export * from '${entry}'; ${output === 'xml' ? `export { default } from '${entry}';` : ''}`, resolveDir: process.cwd() },
    bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true,
    legalComments: 'linked', metafile: true, outfile: `vendor/${output}.mjs`,
    banner: { js: '/* Bundled and minified for browser use by this project. See ../THIRD-PARTY-NOTICES.txt and ./licenses/ for upstream licenses and notices. */' },
  })
  for (const input of Object.keys(result.metafile.inputs)) {
    const match = input.match(/^node_modules\/(?:@[^/]+\/)?[^/]+/)
    if (match) usedPackages.add(match[0])
  }
}
const versions = {}
const packages = []
for (const path of [...usedPackages].sort()) {
  const pkg = JSON.parse(await readFile(`${path}/package.json`, 'utf8'))
  if (['prettier', '@prettier/plugin-xml', 'sql-formatter'].includes(pkg.name)) versions[pkg.name] = pkg.version
  const files = (await readdir(path)).filter(file => /^(?:licen[cs]e|copying|notice|third[-_ ]party[-_ ]notices|authors)(?:[._-].*)?$/i.test(file)).sort()
  if (!files.some(file => /^licen[cs]e(?:[._-]|$)/i.test(file))) throw new Error(`Missing upstream license for ${pkg.name}`)
  if (pkg.name === 'prettier' && !files.includes('THIRD-PARTY-NOTICES.md')) throw new Error('Missing notices for dependencies embedded in Prettier')
  const notices = []
  for (const file of files) {
    const name = `${pkg.name.replaceAll('/', '-')}-${file}`
    await cp(`${path}/${file}`, `vendor/licenses/${name}`)
    notices.push(`licenses/${name}`)
  }
  packages.push({ name: pkg.name, version: pkg.version, license: pkg.license, notices })
}
await writeFile('vendor/versions.json', JSON.stringify(versions, null, 2) + '\n')
await writeFile('vendor/manifest.json', JSON.stringify({ packages }, null, 2) + '\n')
console.log(`Browser libraries and complete license/notice files for ${packages.length} shipped packages saved in vendor/.`)
