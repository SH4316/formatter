import { FORMATS, DEFAULT_OPTIONS, MAX_INPUT_BYTES } from './formats.js'

function sortJSON(input) {
  let position = 0
  const whitespace = () => { while (/\s/.test(input[position] ?? '') && position < input.length) position++ }
  const string = () => {
    const start = position++
    while (position < input.length) {
      if (input[position] === '\\') position += 2
      else if (input[position++] === '"') break
    }
    return input.slice(start, position)
  }
  const value = () => {
    whitespace()
    if (input[position] === '"') return string()
    if (input[position] === '{') {
      position++; whitespace()
      const entries = []
      while (input[position] !== '}') {
        whitespace(); const key = string(); whitespace(); position++
        entries.push({ key, decoded: JSON.parse(key), value: value() }); whitespace()
        if (input[position] !== ',') break
        position++
      }
      position++
      entries.sort((a, b) => a.decoded < b.decoded ? -1 : a.decoded > b.decoded ? 1 : 0)
      return `{${entries.map(entry => `${entry.key}:${entry.value}`).join(',')}}`
    }
    if (input[position] === '[') {
      position++; whitespace()
      const values = []
      while (input[position] !== ']') {
        values.push(value()); whitespace()
        if (input[position] !== ',') break
        position++
      }
      position++
      return `[${values.join(',')}]`
    }
    const start = position
    while (position < input.length && !/[\s,}\]]/.test(input[position])) position++
    return input.slice(start, position)
  }
  return value()
}

function compactJSON(input) {
  let result = '', quoted = false, escaped = false
  for (const character of input) {
    if (quoted || !/\s/.test(character)) result += character
    if (escaped) { escaped = false; continue }
    if (quoted && character === '\\') escaped = true
    else if (character === '"') quoted = !quoted
  }
  return result
}

async function loadPlugin(name) {
  if (name !== 'xml') return import(`../vendor/prettier/plugins/${name}.mjs`)
  const { default: plugin } = await import('../vendor/xml.mjs')
  return { ...plugin, parsers: { xml: { ...plugin.parsers.xml, parse(...args) {
    const ast = plugin.parsers.xml.parse(...args)
    if (!ast.element) throw new SyntaxError('XML needs one root element.')
    function validate(node) {
      if (node.END_NAME && node.END_NAME !== node.Name) throw new SyntaxError(`Closing tag </${node.END_NAME}> does not match <${node.Name}> (line ${node.location.startLine}).`)
      const attributes = new Set()
      for (const attribute of node.attribute) {
        if (attributes.has(attribute.Name)) throw new SyntaxError(`Duplicate XML attribute “${attribute.Name}” (line ${node.location.startLine}).`)
        attributes.add(attribute.Name)
      }
      for (const child of node.content?.element ?? []) validate(child)
    }
    validate(ast.element)
    return ast
  } } } }
}

export async function formatCode(input, format, options = {}, action = 'format') {
  const definition = FORMATS[format]
  if (!definition) throw new Error('Choose a supported format.')
  if (!input.trim()) throw new Error('Add some code or load an example first.')
  if (new TextEncoder().encode(input).length > MAX_INPUT_BYTES) throw new Error('This input is too large. Use a file or text smaller than 1 MiB.')
  if (!['format', 'compact'].includes(action) || (action === 'compact' && format !== 'json')) throw new Error('Compact is available for JSON only.')
  const settings = { ...DEFAULT_OPTIONS, ...options }
  const tabWidth = settings.indent === 'tab' ? 2 : Number(settings.indent)
  if (![2, 4, 8].includes(tabWidth) || !['2', '4', '8', 'tab'].includes(String(settings.indent))) throw new Error('Choose 2, 4, or 8 spaces, or tabs.')
  const printWidth = Number(settings.printWidth)
  if (!Number.isInteger(printWidth) || printWidth < 40 || printWidth > 240) throw new Error('Line width must be a whole number from 40 to 240.')
  if (format === 'json') {
    JSON.parse(input)
    if (settings.sortKeys) input = sortJSON(input)
  }
  let result
  if (action === 'compact') result = compactJSON(input)
  else if (format === 'sql') {
    const { format: sqlFormat } = await import('../vendor/sql.mjs')
    result = sqlFormat(input, { language: settings.sqlDialect, keywordCase: settings.keywordCase, tabWidth, useTabs: settings.indent === 'tab', expressionWidth: printWidth })
  } else {
    const prettier = await import('../vendor/prettier/standalone.mjs')
    const names = new Set(definition.plugins)
    if (settings.embedded && ['html', 'markdown'].includes(format)) for (const name of ['babel', 'estree', 'html', 'postcss', 'typescript', 'yaml', 'graphql']) names.add(name)
    const plugins = await Promise.all([...names].map(loadPlugin))
    result = await prettier.format(input, {
      parser: definition.parser, plugins, tabWidth, useTabs: settings.indent === 'tab', printWidth, endOfLine: 'lf',
      singleQuote: settings.singleQuote, semi: settings.semi, trailingComma: settings.trailingComma,
      bracketSpacing: settings.bracketSpacing, singleAttributePerLine: settings.singleAttributePerLine,
      embeddedLanguageFormatting: settings.embedded ? 'auto' : 'off', proseWrap: settings.proseWrap,
      htmlWhitespaceSensitivity: settings.htmlWhitespace, xmlWhitespaceSensitivity: settings.xmlWhitespace,
      xmlQuoteAttributes: settings.xmlQuote, xmlSortAttributesByKey: settings.xmlSortAttributes,
      xmlSelfClosingSpace: settings.xmlSelfClosingSpace,
    })
  }
  result = result.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (settings.finalNewline) result += '\n'
  return settings.endOfLine === 'crlf' ? result.replace(/\n/g, '\r\n') : result
}
