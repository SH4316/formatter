import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { cp, mkdir, rm, access } from 'node:fs/promises'

await access('vendor/versions.json')
await rm('dist', { recursive: true, force: true })
await mkdir('dist')
for (const path of ['index.html', 'styles.css', 'app.js', 'formatter.worker.js', 'lib', 'vendor', 'assets', '_headers', 'THIRD-PARTY-NOTICES.txt']) {
  await cp(path, `dist/${path}`, { recursive: true })
}
console.log('Static formatter and local libraries copied to dist/. No application bundler required.')

// Keep the exact reviewed font and its redistribution notices in every deployment.
for (const root of ['.', 'dist']) {
  const font = await readFile(root + '/assets/fonts/ibm-plex-sans.woff2')
  if (createHash('sha256').update(font).digest('hex') !== 'e2291e842cf5af167122a22881a740c7f2dda7716f1e8cd76680264f4a859470') throw new Error('IBM Plex Sans changed: review its version and license before updating the checksum.')
  const license = await readFile(root + '/assets/licenses/IBMPlexSans-OFL.txt', 'utf8')
  const notices = await readFile(root + '/THIRD-PARTY-NOTICES.txt', 'utf8')
  if (!license.includes('Copyright 2019 IBM Corp.') || !license.includes('SIL OPEN FONT LICENSE Version 1.1') || !notices.includes('e2291e842cf5af167122a22881a740c7f2dda7716f1e8cd76680264f4a859470')) throw new Error('Required IBM Plex Sans notices are missing.')
}
console.log('Verified IBM Plex Sans checksum and redistribution notices.')
