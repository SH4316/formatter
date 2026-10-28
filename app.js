import { FORMATS, MAX_INPUT_BYTES } from './lib/formats.js'

const $ = selector => document.querySelector(selector)
const settings = $('#settings')
const source = $('#source')
const formatSelect = $('#format')
const formatButton = $('#format-button')
const compactButton = $('#compact-button')
const feedback = $('#feedback')
let worker, timer, copyTimer, fileName = '', rawValue = null, job = 0, busy = false

const notes = {
  json: 'Formatting keeps your data and its original key order. Compact removes unnecessary JSON whitespace.',
  xml: 'Preserve text keeps text-node whitespace. Reindent all can change whitespace in mixed-content XML.',
  html: 'Whitespace follows HTML display rules by default. Embedded code formatting is optional.',
  sql: 'Line width controls inline expressions. SQL formatting does not validate query correctness.',
  markdown: 'Choose whether prose keeps its line breaks or wraps to the target line width.',
}

function notify(kind, message) {
  feedback.className = `feedback ${kind}`
  feedback.setAttribute('role', kind === 'error' ? 'alert' : 'status')
  feedback.textContent = message
}

function count(value) {
  const bytes = new TextEncoder().encode(value).length
  return `${value ? value.split(/\r\n|\r|\n/).length : 0} lines · ${bytes < 1024 ? `${bytes.toLocaleString('en-US')} B` : `${(bytes / 1024).toFixed(1)} KiB`}`
}

function currentValue() {
  return rawValue ?? source.value
}

function render() {
  const hasInput = Boolean(source.value.trim())
  formatButton.disabled = compactButton.disabled = !hasInput || busy
  formatButton.setAttribute('aria-busy', String(busy))
  formatButton.firstChild.textContent = busy ? 'Working…' : 'Format'
  compactButton.hidden = formatSelect.value !== 'json'
  $('#copy-source').disabled = $('#download').disabled = !source.value || busy
  $('#clear').disabled = !source.value && !busy
  $('#example').hidden = Boolean(source.value)
  $('#source-count').textContent = count(currentValue())
  $('#source-format').textContent = FORMATS[formatSelect.value].label
  document.querySelectorAll('[data-formats]').forEach(fieldset => { fieldset.hidden = !fieldset.dataset.formats.split(' ').includes(formatSelect.value) })
  $('#format-note').textContent = notes[formatSelect.value] || 'Indentation and line width follow the selected language’s syntax rules.'
  settings.querySelector('[name="printWidth"]').disabled = false
}

function cancel() {
  job++
  clearTimeout(timer)
  worker?.terminate()
  worker = null
  busy = false
}

function invalidate(message = 'Select Format to apply your formatting options to this code.') {
  cancel()
  source.removeAttribute('aria-invalid')
  notify('', source.value ? message : 'Pick a format, add your code, then select Format.')
  render()
}

function options() {
  const values = {}
  for (const element of settings.elements) {
    if (!element.name || element.name === 'format' || element.tagName === 'FIELDSET') continue
    values[element.name] = element.type === 'checkbox' ? element.checked : element.value
  }
  return values
}

function format(action = 'format') {
  if (busy || !source.value.trim()) return
  if (!settings.reportValidity()) return
  if (new TextEncoder().encode(currentValue()).length > MAX_INPUT_BYTES) { notify('error', 'This input is too large. Use a file or text smaller than 1 MiB.'); return }
  if (formatSelect.value === 'xml') {
    const document = new DOMParser().parseFromString(source.value, 'application/xml')
    const error = document.getElementsByTagNameNS('http://www.mozilla.org/newlayout/xml/parsererror.xml', 'parsererror')[0]
    if (error) { source.setAttribute('aria-invalid', 'true'); notify('error', error.textContent.replace(/This page contains the following errors:|Below is a rendering of the page up to the first error\./g, '').trim().slice(0, 600)); return }
  }
  cancel()
  const id = job
  busy = true
  notify('', 'Formatting locally…')
  source.removeAttribute('aria-invalid')
  render()
  try {
    worker = new Worker(new URL('./formatter.worker.js', import.meta.url), { type: 'module' })
    timer = setTimeout(() => { if (id !== job) return; cancel(); notify('error', 'This input took too long to format. Try a smaller section.'); render() }, 15000)
    worker.onmessage = ({ data }) => {
      if (data.id !== job) return
      clearTimeout(timer)
      busy = false
      if (data.error) { source.setAttribute('aria-invalid', 'true'); notify('error', data.error.slice(0, 2000)) }
      else {
        rawValue = data.result
        source.value = rawValue
        source.setSelectionRange(0, 0)
        source.scrollTop = source.scrollLeft = 0
        notify('success', action === 'compact' ? 'Compacted. Your JSON is ready.' : `Formatted. Your ${FORMATS[formatSelect.value].label} is ready.`)
      }
      worker?.terminate(); worker = null
      render()
    }
    worker.onerror = () => { if (id !== job) return; cancel(); notify('error', 'The formatter could not load. Reload the page and try again.'); render() }
    worker.postMessage({ id, input: currentValue(), format: formatSelect.value, options: options(), action })
  } catch { cancel(); notify('error', 'The formatter could not start. Serve this folder over HTTP and reload the page.'); render() }
}

async function copy(input, button) {
  try {
    await navigator.clipboard.writeText(currentValue())
    clearTimeout(copyTimer)
    button.title = 'Copied!'
    notify('success', 'Copied to clipboard.')
    copyTimer = setTimeout(() => { button.title = button.getAttribute('aria-label') }, 2000)
  } catch { input.focus(); input.select(); notify('error', 'Clipboard access is unavailable. The text is selected; use Ctrl+C or ⌘C to copy.') }
}

async function loadFile(file) {
  cancel(); const id = job
  if (file.size > MAX_INPUT_BYTES) { notify('error', 'This file is too large. Choose a file smaller than 1 MiB.'); render(); return }
  busy = true; notify('', 'Reading your file…'); render()
  try {
    const bytes = await file.arrayBuffer()
    if (id !== job) return
    const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    const extension = file.name.split('.').pop().toLowerCase()
    const aliases = { yml: 'yaml', md: 'markdown', mdx: 'markdown', gql: 'graphql', js: 'javascript', mjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', htm: 'html', svg: 'xml' }
    const detected = aliases[extension] || extension
    if (FORMATS[detected]) formatSelect.value = detected
    source.value = value
    rawValue = value
    fileName = file.name
    busy = false
    source.removeAttribute('aria-invalid')
    notify('success', `“${file.name}” loaded. Select Format to continue.`)
  } catch { if (id !== job) return; busy = false; notify('error', 'Could not read this as UTF-8 text. Choose a text file and try again.') }
  render()
}

settings.onsubmit = event => { event.preventDefault(); format() }
settings.addEventListener('input', () => invalidate())
source.addEventListener('input', () => { fileName = ''; rawValue = null; invalidate() })
$('#example').onclick = () => { cancel(); source.value = FORMATS[formatSelect.value].sample; rawValue = null; fileName = ''; invalidate(); source.focus(); source.setSelectionRange(0, 0); source.scrollTop = source.scrollLeft = 0 }
formatButton.onclick = () => format()
compactButton.onclick = () => format('compact')
$('#clear').onclick = () => { cancel(); source.value = ''; rawValue = null; fileName = ''; source.removeAttribute('aria-invalid'); notify('', 'Cleared. Ready for a fresh start.'); render(); source.focus() }
$('#copy-source').onclick = () => copy(source, $('#copy-source'))
$('#upload').onclick = () => $('#file-input').click()
$('#file-input').onchange = event => { const file = event.target.files[0]; if (file) void loadFile(file); event.target.value = '' }
$('#download').onclick = () => {
  if (!source.value || busy) return
  const url = URL.createObjectURL(new Blob([currentValue()], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  const name = fileName ? fileName.replace(/\.[^.]*$/, '') : 'formatted'
  link.href = url; link.download = `${name}.${FORMATS[formatSelect.value].extension}`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
$('#wrap-lines').onchange = event => { source.wrap = event.target.checked ? 'soft' : 'off' }
$('.workbench').onkeydown = event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); format() }
}
const panel = $('#source-panel')
panel.ondragover = event => { if (!event.dataTransfer.types.includes('Files')) return; event.preventDefault(); panel.classList.add('dragging') }
panel.ondragleave = event => { if (!panel.contains(event.relatedTarget)) panel.classList.remove('dragging') }
panel.ondrop = event => { if (!event.dataTransfer.files.length) return; event.preventDefault(); panel.classList.remove('dragging'); void loadFile(event.dataTransfer.files[0]) }
render()
