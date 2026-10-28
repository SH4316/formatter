import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatCode } from '../lib/format.js'
import { FORMATS, MAX_INPUT_BYTES } from '../lib/formats.js'

for (const [format, definition] of Object.entries(FORMATS)) {
  test(`formats ${definition.label} and is idempotent`, async () => {
    const output = await formatCode(definition.sample, format)
    assert.ok(output.length > 0)
    assert.equal(await formatCode(output, format), output)
  })
}
test('sorts JSON recursively while preserving numbers, duplicate keys, and array order', async () => {
  const input = '{"z":90071992547409931234567890,"a":{"z":2,"a":1},"list":[3,2,1],"a":false,"__proto__":"safe"}'
  const output = await formatCode(input, 'json', { sortKeys: true }, 'compact')
  assert.equal(output, '{"__proto__":"safe","a":{"a":1,"z":2},"a":false,"list":[3,2,1],"z":90071992547409931234567890}\n')
  assert.match(await formatCode(input, 'json', { sortKeys: true }), /90071992547409931234567890/)
})
test('JSON compact preserves string whitespace and escape sequences', async () => {
  const input = ' { "value": " a b ", "quote": "a\\\" b", "number": 123456789012345678901 } '
  const output = await formatCode(input, 'json', { finalNewline: false }, 'compact')
  assert.equal(output, '{"value":" a b ","quote":"a\\\" b","number":123456789012345678901}')
})
test('indentation, CRLF, and final newline options are applied', async () => {
  for (const indent of ['2','4','8','tab']) {
    const output = await formatCode('{\n"one": {\n"two": 3\n}\n}', 'json', { indent, endOfLine: 'crlf', finalNewline: false })
    assert.ok(output.includes(`\r\n${indent === 'tab' ? '\t' : ' '.repeat(Number(indent))}"one"`))
    assert.ok(!output.replaceAll('\r\n', '').includes('\n'))
    assert.ok(!output.endsWith('\n'))
  }
})
test('JavaScript quote, semicolon, and trailing comma options work', async () => {
  const output = await formatCode('const value={name:"hello",ready:true};', 'javascript', { singleQuote: true, semi: false, trailingComma: 'none', bracketSpacing: false })
  assert.ok(output.includes("'hello'")); assert.ok(!output.includes(';')); assert.ok(output.includes('{name:'))
})
test('XML preserves mixed text, comments, CDATA, and processing instructions', async () => {
  const input = '<?xml version="1.0"?><root><p>Hello <b>world</b> !</p><!-- keep --><data><![CDATA[a < b && c]]></data></root>'
  const output = await formatCode(input, 'xml')
  assert.ok(output.includes('Hello <b>world</b> !'))
  assert.ok(output.includes('<!-- keep -->'))
  assert.ok(output.includes('<![CDATA[a < b && c]]>'))
})
test('XML attribute options are applied', async () => {
  const output = await formatCode('<root z="2" a="1"><item/></root>', 'xml', { xmlSortAttributes: true, xmlQuote: 'single', xmlSelfClosingSpace: true, xmlWhitespace: 'ignore', singleAttributePerLine: true })
  assert.ok(output.indexOf("a='1'") < output.indexOf("z='2'"))
  assert.ok(output.includes('<item />'))
})
test('SQL dialect and keyword case preserve literals', async () => {
  const output = await formatCode("SELECT name FROM users WHERE name = 'SELECT';", 'sql', { sqlDialect: 'postgresql', keywordCase: 'lower' })
  assert.match(output, /^select/); assert.ok(output.includes("'SELECT'"))
})
test('HTML embedded JavaScript and CSS can be formatted', async () => {
  const output = await formatCode('<html><head><style>a{color:red}</style></head><body><script>const x={a:1};</script></body></html>', 'html', { embedded: true })
  assert.ok(output.includes('color: red;')); assert.ok(output.includes('const x = { a: 1 };'))
})
for (const [format, input] of [['json','{"bad":}'],['xml','<root><child></root>'],['xml','<a x="1" x="2"/>'],['javascript','const = ;'],['yaml','items: [1, 2']]) {
  test(`rejects invalid ${format}: ${input}`, async () => assert.rejects(formatCode(input, format)))
}
test('rejects unsupported formats, oversized input, and invalid options', async () => {
  await assert.rejects(formatCode('anything','unknown'))
  await assert.rejects(formatCode(' ', 'json'))
  await assert.rejects(formatCode('x'.repeat(MAX_INPUT_BYTES + 1), 'javascript'), /too large/)
  await assert.rejects(formatCode('{}', 'json', { printWidth: 0 }), /Line width/)
  await assert.rejects(formatCode('{}', 'json', { indent: '3' }), /spaces/)
  await assert.rejects(formatCode('<a/>', 'xml', {}, 'compact'), /JSON only/)
})
