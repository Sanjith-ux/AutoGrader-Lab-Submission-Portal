import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { assertSafeTestDatabase } from '../testing/context.js'

describe('test database safeguards (no database connection)', () => {
  test('accepts an explicit test database separate from development', () => {
    assert.equal(assertSafeTestDatabase('mongodb://127.0.0.1:27028/labtrack_portal_test', ['mongodb://localhost:27017/labtrack']), 'labtrack_portal_test')
  })

  test('rejects missing, malformed, default, and misleading database names', () => {
    for (const uri of [undefined, '', 'invalid', 'mongodb://localhost', 'mongodb://localhost/', 'mongodb://localhost/labtrack', 'mongodb://localhost/latest', 'mongodb://localhost/test_production', 'mongodb://localhost/labtrack_test/other', 'https://localhost/labtrack_test']) {
      assert.throws(() => assertSafeTestDatabase(uri, []), /Refusing to run tests/)
    }
  })

  test('rejects development aliases even with different hosts, ports, credentials, options, or escaping', () => {
    for (const developmentUri of ['mongodb://localhost:27017/labtrack_portal_test', 'mongodb://user:secret@localhost/labtrack_portal_test?authSource=admin', 'mongodb://localhost/LABTRACK_PORTAL_TEST', 'mongodb://localhost/labtrack_portal_%74est']) {
      assert.throws(() => assertSafeTestDatabase('mongodb://127.0.0.1:27028/labtrack_portal_test', [developmentUri]), /must differ/)
    }
  })

  test('rejects database overrides and unverifiable development URIs', () => {
    assert.throws(() => assertSafeTestDatabase('mongodb://localhost/labtrack_portal_test?dbName=labtrack', []), /overrides/)
    assert.throws(() => assertSafeTestDatabase('mongodb://localhost/labtrack_portal_test', ['invalid']), /cannot verify/)
  })

  test('never includes URI credentials in refusal messages', () => {
    assert.throws(() => assertSafeTestDatabase('mongodb://user:private-password@localhost/labtrack', []), (error) => {
      assert.ok(!error.message.includes('private-password'))
      return true
    })
  })
})
