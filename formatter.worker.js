import { formatCode } from './lib/format.js'

self.onmessage = async ({ data }) => {
  try {
    const result = await formatCode(data.input, data.format, data.options, data.action)
    self.postMessage({ id: data.id, result })
  } catch (error) {
    self.postMessage({ id: data.id, error: error.message || 'Formatting failed. Check your input and options.', line: error.loc?.start?.line, column: error.loc?.start?.column })
  }
}
