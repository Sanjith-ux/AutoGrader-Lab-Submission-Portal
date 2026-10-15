import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import { createTestContext, testMongoUri, testSecret, tokenFor } from '../testing/context.js'

describe('authentication API (isolated test database)', { skip: !testMongoUri && 'set MONGODB_TEST_URI to run database tests' }, () => {
  let ctx
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const newEmail = (label) => {
    const email = `auth-${label}-${suffix}@example.test`
    ctx.trackEmail(email)
    return email
  }
  const post = (path, payload, token) => ctx.json(path, token, { method: 'POST', body: JSON.stringify(payload) })
  const register = (payload) => post('/api/auth/register', payload)
  const login = (payload) => post('/api/auth/login', payload)
  const me = (token) => ctx.json('/api/auth/me', token)

  before(async () => { ctx = await createTestContext() })
  after(async () => { await ctx.cleanup() })

  describe('registration', () => {
    test('creates an account without returning or storing the plaintext password', async () => {
      const email = newEmail('ok')
      const { status, body } = await register({ name: 'New Student', email: `  ${email.toUpperCase()}  `, password: 'password123', role: 'student' })
      assert.equal(status, 201)
      assert.equal(body.user.email, email)
      assert.equal(body.user.role, 'student')
      assert.ok(!/password|\$2[aby]\$/i.test(JSON.stringify(body)))

      const stored = await User.findOne({ email }).select('+password').lean()
      assert.notEqual(stored.password, 'password123')
      assert.match(stored.password, /^\$2[aby]\$/)
    })

    test('rejects duplicate emails with 409', async () => {
      const email = newEmail('dup')
      assert.equal((await register({ name: 'First User', email, password: 'password123', role: 'student' })).status, 201)
      const second = await register({ name: 'Second User', email: email.toUpperCase(), password: 'password123', role: 'lecturer' })
      assert.equal(second.status, 409)
    })

    const invalid = [
      ['missing body', undefined],
      ['non-text name', { name: {}, email: 'a@example.test', password: 'password123', role: 'student' }],
      ['one-character name', { name: 'A', email: 'a@example.test', password: 'password123', role: 'student' }],
      ['non-text email', { name: 'Valid Name', email: 5, password: 'password123', role: 'student' }],
      ['operator object as email', { name: 'Valid Name', email: { $ne: null }, password: 'password123', role: 'student' }],
      ['malformed email', { name: 'Valid Name', email: 'not-an-email', password: 'password123', role: 'student' }],
      ['short password', { name: 'Valid Name', email: 'a@example.test', password: 'short', role: 'student' }],
      ['password longer than bcrypt\'s 72 bytes', { name: 'Valid Name', email: 'a@example.test', password: 'x'.repeat(73), role: 'student' }],
      ['non-text password', { name: 'Valid Name', email: 'a@example.test', password: ['password123'], role: 'student' }],
      ['unknown role', { name: 'Valid Name', email: 'a@example.test', password: 'password123', role: 'admin' }],
      ['non-text role', { name: 'Valid Name', email: 'a@example.test', password: 'password123', role: { $ne: 'x' } }],
    ]
    for (const [name, payload] of invalid) {
      test(`rejects ${name} with 400 and never creates an account`, async () => {
        const { status, body } = await ctx.json('/api/auth/register', null, { method: 'POST', ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) })
        assert.equal(status, 400)
        assert.ok(Array.isArray(body.errors) && body.errors.length > 0)
        assert.equal(await User.countDocuments({ email: 'a@example.test' }), 0)
      })
    }
  })

  describe('login', () => {
    test('returns a token and the safe user profile for valid credentials', async () => {
      const email = newEmail('login')
      await register({ name: 'Login User', email, password: 'password123', role: 'lecturer' })
      const { status, body } = await login({ email: email.toUpperCase(), password: 'password123' })
      assert.equal(status, 200)
      assert.equal(typeof body.token, 'string')
      assert.equal(body.user.role, 'lecturer')
      assert.ok(!/password/i.test(JSON.stringify(body.user)))
      const payload = jwt.verify(body.token, testSecret)
      assert.equal(payload.sub, body.user.id)
      assert.ok(payload.exp > payload.iat)
    })

    test('gives the same generic 401 for a wrong password and an unknown account', async () => {
      const email = newEmail('generic')
      await register({ name: 'Generic User', email, password: 'password123', role: 'student' })
      const wrongPassword = await login({ email, password: 'wrong-password' })
      const unknownUser = await login({ email: `nobody-${suffix}@example.test`, password: 'password123' })
      assert.equal(wrongPassword.status, 401)
      assert.equal(unknownUser.status, 401)
      assert.deepEqual(wrongPassword.body, unknownUser.body)
    })

    test('rejects non-text and operator-injection credentials with 400', async () => {
      assert.equal((await login({ email: { $ne: null }, password: 'password123' })).status, 400)
      assert.equal((await login({ email: 'a@example.test', password: { $gt: '' } })).status, 400)
      assert.equal((await login({})).status, 400)
      assert.equal((await ctx.json('/api/auth/login', null, { method: 'POST' })).status, 400)
    })
  })

  describe('token verification', () => {
    test('accepts a valid token and returns the profile without secrets', async () => {
      const { status, body } = await me(ctx.tokens.lecturer)
      assert.equal(status, 200)
      assert.equal(body.user.id, ctx.lecturer._id.toString())
      assert.ok(!/password/i.test(JSON.stringify(body)))
    })

    test('rejects missing, malformed, expired, wrongly signed, unsigned, and orphaned tokens with 401', async () => {
      const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: ctx.lecturer._id.toString(), role: 'lecturer' })).toString('base64url')}.`
      const deleted = await User.create({ name: 'Soon Deleted', email: newEmail('deleted'), password: 'password123', role: 'lecturer' })
      const deletedToken = tokenFor(deleted)
      await User.deleteOne({ _id: deleted._id })

      const cases = {
        'no token': null,
        'garbage': 'garbage',
        'expired': tokenFor(ctx.lecturer, { expiresIn: -10 }),
        'wrong secret': jwt.sign({}, 'a-different-secret', { subject: ctx.lecturer._id.toString() }),
        'alg none': unsigned,
        'non-ObjectId subject': jwt.sign({}, testSecret, { subject: 'abc' }),
        'missing subject': jwt.sign({ role: 'lecturer' }, testSecret),
        'deleted user': deletedToken,
      }
      for (const [name, token] of Object.entries(cases)) {
        const { status, body } = await me(token)
        assert.equal(status, 401, name)
        assert.ok(body.message, name)
      }
      assert.equal((await ctx.json('/api/auth/me', null, { headers: { Authorization: 'Token abc' } })).status, 401)
    })

    test('reports an expired token with a specific message', async () => {
      const { body } = await me(tokenFor(ctx.lecturer, { expiresIn: -10 }))
      assert.match(body.message, /expired/i)
    })
  })

  describe('rate limiting', () => {
    test('blocks repeated failed sign-ins with 429 and Retry-After', async () => {
      const email = newEmail('limit')
      await register({ name: 'Limit User', email, password: 'password123', role: 'student' })
      let blocked
      for (let attempt = 1; attempt <= 15 && !blocked; attempt += 1) {
        const result = await login({ email, password: `wrong-${attempt}` })
        if (result.status === 429) blocked = result
        else assert.equal(result.status, 401)
      }
      assert.ok(blocked, 'expected a 429 within 15 failed attempts')
      assert.ok(Number(blocked.headers.get('retry-after')) > 0)
      assert.equal((await login({ email, password: 'password123' })).status, 429)
    })
  })

  test('responses carry security headers and no framework banner', async () => {
    const response = await ctx.request('/api/health')
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(response.headers.get('x-frame-options'), 'DENY')
    assert.equal(response.headers.get('x-powered-by'), null)
  })

  test('CORS allows only the configured origins', async () => {
    const allowed = await ctx.request('/api/health', null, { headers: { Origin: 'http://localhost:5173' } })
    const denied = await ctx.request('/api/health', null, { headers: { Origin: 'https://evil.example' } })
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.equal(denied.headers.get('access-control-allow-origin'), null)
  })

  test('the test database name is protected from accidental production use', async () => {
    assert.match(mongoose.connection.name, /test/i)
  })
})
