import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { describe, mock, test } from 'node:test'
import { validateAssignmentPayload } from '../src/controllers/assignments.js'
import { errorHandler, notFound } from '../src/middleware/errorHandler.js'
import { createRateLimiter } from '../src/middleware/rateLimit.js'
import { getAllowedOrigins, securityHeaders } from '../src/middleware/security.js'
import { isValidObjectId } from '../src/utils/objectId.js'

function fakeResponse(statusCode = 200) {
  const res = new EventEmitter()
  res.statusCode = statusCode
  res.headers = {}
  res.body = undefined
  res.headersSent = false
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (body) => { res.body = body; return res }
  res.setHeader = (name, value) => { res.headers[name] = value }
  return res
}

const validPayload = {
  title: 'API testing assignment',
  module: 'Web Application Development',
  description: 'Implement and test a REST API.',
  deadline: '2030-10-15T12:00:00.000Z',
  totalMarks: 50,
  allowedFileTypes: ['PDF', 'ZIP'],
  requiredFiles: ['Report', 'Source files'],
  maxFileSizeMB: 10,
  lateSubmissionAllowed: false,
  status: 'Draft',
}

function errorsFor(payload, partial = false) {
  try {
    validateAssignmentPayload(payload, partial)
  } catch (error) {
    assert.equal(error.status, 400)
    return error.details
  }
  return []
}

describe('assignment payload validation', () => {
  test('accepts a valid payload and normalizes values', () => {
    const result = validateAssignmentPayload({ ...validPayload, title: '  Padded  ', allowedFileTypes: ['pdf', 'PDF', ' zip '], totalMarks: '50', unknown: 'dropped', lecturer: 'someone' })
    assert.equal(result.title, 'Padded')
    assert.deepEqual(result.allowedFileTypes, ['PDF', 'ZIP'])
    assert.equal(result.totalMarks, 50)
    assert.ok(result.deadline instanceof Date)
    assert.equal(result.unknown, undefined)
    assert.equal(result.lecturer, undefined)
  })

  test('accepts empty optional submission requirements (as stored by older or API-created assignments)', () => {
    assert.deepEqual(errorsFor({ ...validPayload, submissionRequirements: '' }), [])
    assert.deepEqual(errorsFor({ ...validPayload, submissionRequirements: '   ' }), [])
  })

  const invalidCases = [
    ['missing title', { title: '' }, 'title'],
    ['title that is not text', { title: 123 }, 'title'],
    ['title that is too long', { title: 'x'.repeat(151) }, 'title'],
    ['missing module', { module: '   ' }, 'module'],
    ['missing description', { description: undefined }, 'description'],
    ['description that is too long', { description: 'x'.repeat(5001) }, 'description'],
    ['non-text submission requirements', { submissionRequirements: { a: 1 } }, 'submission requirements'],
    ['unparseable deadline', { deadline: 'not-a-date' }, 'deadline'],
    ['null deadline', { deadline: null }, 'deadline'],
    ['numeric deadline', { deadline: 0 }, 'deadline'],
    ['boolean deadline', { deadline: true }, 'deadline'],
    ['deadline before 2000', { deadline: '1999-12-31T00:00:00Z' }, 'deadline'],
    ['deadline after 2100', { deadline: '2101-01-01T00:00:00Z' }, 'deadline'],
    ['zero marks', { totalMarks: 0 }, 'marks'],
    ['negative marks', { totalMarks: -5 }, 'marks'],
    ['fractional marks', { totalMarks: 1.5 }, 'marks'],
    ['marks above the maximum', { totalMarks: 1001 }, 'marks'],
    ['non-numeric marks', { totalMarks: 'abc' }, 'marks'],
    ['boolean marks', { totalMarks: true }, 'marks'],
    ['array marks', { totalMarks: [5] }, 'marks'],
    ['empty allowed file types', { allowedFileTypes: [] }, 'allowed file types'],
    ['unsupported file type', { allowedFileTypes: ['EXE'] }, 'unsupported'],
    ['non-text file type', { allowedFileTypes: [123] }, 'allowed file types'],
    ['allowed file types not a list', { allowedFileTypes: 'PDF' }, 'allowed file types'],
    ['empty required files', { requiredFiles: [] }, 'required files'],
    ['blank required file', { requiredFiles: ['Report', '  '] }, 'required files'],
    ['too many required files', { requiredFiles: Array.from({ length: 21 }, (_, index) => `File ${index}`) }, 'required files'],
    ['zero file size', { maxFileSizeMB: 0 }, 'file size'],
    ['file size above the maximum', { maxFileSizeMB: 101 }, 'file size'],
    ['non-boolean late flag', { lateSubmissionAllowed: 'yes' }, 'latesubmissionallowed'],
    ['unknown status', { status: 'Archived' }, 'status'],
  ]
  for (const [name, change, expected] of invalidCases) {
    test(`rejects ${name}`, () => {
      const errors = errorsFor({ ...validPayload, ...change })
      assert.ok(errors.some((message) => message.toLowerCase().includes(expected)), `expected an error mentioning "${expected}", got ${JSON.stringify(errors)}`)
    })
  }

  test('rejects an empty or non-object body on create', () => {
    assert.ok(errorsFor(undefined).length >= 5)
    assert.ok(errorsFor([]).length >= 5)
    assert.ok(errorsFor('text').length >= 5)
  })

  test('partial updates validate only the supplied fields', () => {
    assert.deepEqual(errorsFor({ status: 'Published' }, true), [])
    assert.ok(errorsFor({ totalMarks: 0 }, true).length === 1)
  })
})

describe('object id validation', () => {
  test('accepts only 24-character hexadecimal strings', () => {
    assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true)
    for (const value of ['abc', '', '507f1f77bcf86cd79943901', '12 characters', 'zzzzzzzzzzzzzzzzzzzzzzzz', null, undefined, 42, {}, ['507f1f77bcf86cd799439011']]) {
      assert.equal(isValidObjectId(value), false, `${JSON.stringify(value)} should be rejected`)
    }
  })
})

describe('rate limiter', () => {
  test('allows requests up to the limit, then answers 429 with Retry-After', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2, message: 'slow down' })
    const results = []
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = fakeResponse()
      limiter({ ip: '1.1.1.1' }, res, () => results.push('next'))
      if (res.statusCode === 429) results.push(res)
    }
    assert.deepEqual(results.slice(0, 2), ['next', 'next'])
    assert.equal(results[2].statusCode, 429)
    assert.equal(results[2].body.message, 'slow down')
    assert.ok(Number(results[2].headers['Retry-After']) >= 1)
  })

  test('tracks each client separately', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, message: 'no' })
    let allowed = 0
    limiter({ ip: 'a' }, fakeResponse(), () => { allowed += 1 })
    limiter({ ip: 'b' }, fakeResponse(), () => { allowed += 1 })
    assert.equal(allowed, 2)
  })

  test('resets after the window passes', async () => {
    const limiter = createRateLimiter({ windowMs: 30, max: 1, message: 'no' })
    let allowed = 0
    limiter({ ip: 'a' }, fakeResponse(), () => { allowed += 1 })
    const blocked = fakeResponse()
    limiter({ ip: 'a' }, blocked, () => { allowed += 1 })
    assert.equal(blocked.statusCode, 429)
    await new Promise((resolve) => setTimeout(resolve, 50))
    limiter({ ip: 'a' }, fakeResponse(), () => { allowed += 1 })
    assert.equal(allowed, 2)
  })

  test('does not count successful responses when skipSuccessful is set', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, message: 'no', skipSuccessful: true })
    let allowed = 0
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = fakeResponse(200)
      limiter({ ip: 'a' }, res, () => { allowed += 1 })
      res.emit('finish')
    }
    assert.equal(allowed, 3)

    const failing = fakeResponse(401)
    limiter({ ip: 'a' }, failing, () => {})
    failing.emit('finish')
    const blocked = fakeResponse()
    limiter({ ip: 'a' }, blocked, () => {})
    assert.equal(blocked.statusCode, 429)
  })
})

describe('error handler', () => {
  function handle(error) {
    const res = fakeResponse()
    const logger = mock.method(console, 'error', () => {})
    errorHandler(error, {}, res, () => {})
    logger.mock.restore()
    return res
  }
  function named(name, extra = {}) {
    return Object.assign(new Error(`${name} internal detail`), { name }, extra)
  }

  test('maps client errors to 4xx responses', () => {
    assert.equal(handle(named('SyntaxError', { type: 'entity.parse.failed' })).statusCode, 400)
    assert.equal(handle(named('PayloadTooLargeError', { type: 'entity.too.large' })).statusCode, 413)
    assert.equal(handle(named('CastError')).statusCode, 400)
    assert.equal(handle(named('MongoServerError', { code: 11000 })).statusCode, 409)
    const validation = handle(named('ValidationError', { errors: { title: { message: 'Title is required' } } }))
    assert.equal(validation.statusCode, 400)
    assert.deepEqual(validation.body.errors, ['Title is required'])
  })

  test('passes through safe application errors with their status and details', () => {
    const res = handle(Object.assign(new Error('Validation failed.'), { status: 400, details: ['one'] }))
    assert.equal(res.statusCode, 400)
    assert.deepEqual(res.body, { message: 'Validation failed.', errors: ['one'] })
  })

  test('reports database outages as 503 without internal detail', () => {
    for (const name of ['MongoServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError']) {
      const res = handle(named(name))
      assert.equal(res.statusCode, 503)
      assert.ok(!JSON.stringify(res.body).includes('internal detail'))
    }
    assert.equal(handle(named('MongooseError', { message: 'Operation `users.findOne()` buffering timed out after 1500ms' })).statusCode, 503)
  })

  test('hides the details of unexpected errors', () => {
    const res = handle(new Error('connect mongodb://admin:hunter2@db.internal:27017 failed; JWT_SECRET=abc'))
    assert.equal(res.statusCode, 500)
    assert.deepEqual(res.body, { message: 'An unexpected server error occurred.' })
  })

  test('does not treat 5xx statuses as safe to expose', () => {
    const res = handle(Object.assign(new Error('secret path /etc/passwd'), { status: 502 }))
    assert.equal(res.statusCode, 500)
    assert.ok(!JSON.stringify(res.body).includes('passwd'))
  })

  test('notFound answers with JSON', () => {
    const res = fakeResponse()
    notFound({}, res)
    assert.equal(res.statusCode, 404)
    assert.ok(res.body.message)
  })
})

describe('security headers and CORS', () => {
  test('sets defensive headers', () => {
    const res = fakeResponse()
    let called = false
    securityHeaders({}, res, () => { called = true })
    assert.equal(called, true)
    assert.equal(res.headers['X-Content-Type-Options'], 'nosniff')
    assert.equal(res.headers['X-Frame-Options'], 'DENY')
    assert.equal(res.headers['Cache-Control'], 'no-store')
  })

  test('defaults to the local Vite origins and honours CORS_ORIGIN', () => {
    const original = process.env.CORS_ORIGIN
    delete process.env.CORS_ORIGIN
    assert.ok(getAllowedOrigins().includes('http://localhost:5173'))
    process.env.CORS_ORIGIN = 'https://a.example, https://b.example'
    assert.deepEqual(getAllowedOrigins(), ['https://a.example', 'https://b.example'])
    if (original === undefined) delete process.env.CORS_ORIGIN
    else process.env.CORS_ORIGIN = original
  })
})
