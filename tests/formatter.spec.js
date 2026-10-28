import { test, expect } from '@playwright/test'
import { FORMATS } from '../lib/formats.js'

for (const [format, definition] of Object.entries(FORMATS)) {
  test(`formats ${definition.label} in the browser under the production CSP`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto('/')
    await page.getByLabel('Format', { exact: true }).selectOption(format)
    await page.getByRole('button', { name: 'Load an example' }).click()
    await expect(page.locator('textarea')).toHaveCount(1)
    await expect(page.getByLabel('Code', { exact: true })).toHaveValue(definition.sample)
    await page.getByRole('button', { name: 'Format', exact: true }).click()
    await expect(page.getByRole('status')).toContainText(`Your ${definition.label} is ready`)
    await expect(page.getByLabel('Code', { exact: true })).not.toHaveValue('')
    await expect(page.getByLabel('Code', { exact: true })).toBeEditable()
    expect(errors).toEqual([])
  })
}

test('sorts and compacts JSON without losing number precision', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Code', { exact: true }).fill('{"z":90071992547409931234567890,"a":[3,2,1]}')
  await page.getByRole('checkbox', { name: 'Sort object keys' }).check()
  await page.getByRole('button', { name: 'Compact JSON', exact: true }).click()
  await expect(page.getByLabel('Code', { exact: true })).toHaveValue('{"a":[3,2,1],"z":90071992547409931234567890}\n')
  await page.getByLabel('Code', { exact: true }).fill('{broken')
  await expect(page.getByRole('button', { name: 'Copy code', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Code', { exact: true })).toHaveValue('{broken')
  await expect(page.getByLabel('Code', { exact: true })).toHaveAttribute('aria-invalid', 'true')
})

test('uploads by extension, applies XML options, and catches malformed XML', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Upload source file', { exact: true }).setInputFiles({ name: 'document.xml', mimeType: 'text/xml', buffer: Buffer.from('<root z="2" a="1"><item/></root>') })
  await expect(page.getByLabel('Format', { exact: true })).toHaveValue('xml')
  await page.getByRole('checkbox', { name: 'Sort attributes', exact: true }).check()
  await page.getByLabel('Quotes', { exact: true }).selectOption('single')
  await page.getByLabel('Text handling', { exact: true }).selectOption('ignore')
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your XML is ready')
  const result = await page.getByLabel('Code', { exact: true }).inputValue()
  expect(result).toContain("a='1' z='2'")
  await page.getByLabel('Code', { exact: true }).fill('<a><b></a>')
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Code', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Code', { exact: true })).toHaveValue('<a><b></a>')
})

test('copies and downloads actual CRLF bytes and respects the final newline option', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByLabel('Code', { exact: true }).fill('{\n"one": {\n"two": 3\n}\n}')
  await page.getByLabel('Indentation', { exact: true }).selectOption('4')
  await page.getByLabel('Line endings', { exact: true }).selectOption('crlf')
  await page.getByRole('checkbox', { name: 'Final newline', exact: true }).uncheck()
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your JSON is ready')
  const expected = '{\r\n    "one": {\r\n        "two": 3\r\n    }\r\n}'
  await expect(page.getByLabel('Code', { exact: true })).toHaveValue(expected.replaceAll('\r\n', '\n'))
  // Changing an option leaves the current content and its line endings intact until Format.
  await page.getByLabel('Indentation', { exact: true }).selectOption('8')
  await page.getByRole('button', { name: 'Copy code', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('formatted.json')
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const value = Buffer.concat(chunks).toString()
  expect(value).toBe(expected)
  expect(value).toContain('\r\n    "one"')
  expect(value.replaceAll('\r\n', '')).not.toContain('\n')
  expect(value.endsWith('\n')).toBe(false)
})

test('formats in place, copies current edits, and clears without sending input', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const badRequests = []
  page.on('request', request => { if (request.method() !== 'GET' || !request.url().startsWith('http://127.0.0.1:4175/')) badRequests.push(request.url()) })
  await page.goto('/')
  await expect(page.getByText('Your input is not sent to a server.', { exact: true })).toBeVisible()
  await page.getByLabel('Code', { exact: true }).fill('{"hello":"안녕하세요 👋"}')
  await page.getByLabel('Code', { exact: true }).press('Control+Enter')
  await expect(page.getByRole('status')).toContainText('Your JSON is ready')
  const output = await page.getByLabel('Code', { exact: true }).inputValue()
  expect(output).toBe('{ "hello": "안녕하세요 👋" }\n')
  await page.getByRole('button', { name: 'Copy code', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(output)
  await page.getByLabel('Code', { exact: true }).fill('{"edited":true}')
  await page.getByRole('button', { name: 'Copy code', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('{"edited":true}')
  await page.getByLabel('Code', { exact: true }).fill('{\n"edited":true\n}')
  await page.getByLabel('Indentation', { exact: true }).selectOption('4')
  await expect(page.getByLabel('Code', { exact: true })).toHaveValue('{\n"edited":true\n}')
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByLabel('Code', { exact: true })).toHaveValue('{\n    "edited": true\n}\n')
  await page.getByRole('button', { name: 'Clear all', exact: true }).click()
  await expect(page.getByLabel('Code', { exact: true })).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Format', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Copy code', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeDisabled()
  expect(badRequests).toEqual([])
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0)
})

test('responsive options and editors do not overflow narrow screens', async ({ page }) => {
  await page.goto('/')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const format of ['json','xml','javascript','sql']) {
      await page.getByLabel('Format', { exact: true }).selectOption(format)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByLabel('Format', { exact: true }).selectOption('json')
  await page.getByRole('button', { name: 'Load an example' }).click()
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your JSON is ready')
})
