import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import mongoose from 'mongoose'
import Assignment from '../src/models/Assignment.js'
import { createTestContext, testMongoUri, tokenFor } from '../testing/context.js'

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

describe('assignment API (isolated test database)', { skip: !testMongoUri && 'set MONGODB_TEST_URI to run database tests' }, () => {
  let ctx
  let counter = 0
  const body = (extra = {}) => JSON.stringify({ ...validPayload, title: `Assignment ${(counter += 1)}`, ...extra })

  before(async () => { ctx = await createTestContext() })
  after(async () => { await ctx.cleanup() })

  const create = (extra = {}, token = ctx.tokens.lecturer) => ctx.json('/api/assignments', token, { method: 'POST', body: body(extra) })
  const patch = (id, change, token = ctx.tokens.lecturer) => ctx.json(`/api/assignments/${id}`, token, { method: 'PATCH', body: JSON.stringify(change) })

  describe('authentication and authorization', () => {
    test('every endpoint rejects requests without a valid token (401)', async () => {
      const { body: created } = await create()
      const id = created.assignment._id
      const calls = [['/api/assignments', {}], [`/api/assignments/${id}`, {}], ['/api/assignments', { method: 'POST', body: body() }], [`/api/assignments/${id}`, { method: 'PATCH', body: '{}' }], [`/api/assignments/${id}`, { method: 'DELETE' }]]
      for (const token of [null, 'garbage', 'a.b.c']) {
        for (const [path, options] of calls) {
          const { status } = await ctx.json(path, token, options)
          assert.equal(status, 401, `${options.method || 'GET'} ${path} with token ${token}`)
        }
      }
    })

    test('students cannot create, edit, publish, or delete (403) and cannot change data', async () => {
      const { body: created } = await create()
      const id = created.assignment._id
      assert.equal((await create({}, ctx.tokens.student)).status, 403)
      assert.equal((await patch(id, { title: 'Hijacked' }, ctx.tokens.student)).status, 403)
      assert.equal((await patch(id, { status: 'Published' }, ctx.tokens.student)).status, 403)
      assert.equal((await ctx.json(`/api/assignments/${id}`, ctx.tokens.student, { method: 'DELETE' })).status, 403)
      const stored = await Assignment.findById(id).lean()
      assert.equal(stored.status, 'Draft')
      assert.notEqual(stored.title, 'Hijacked')
    })

    test('a token claiming the lecturer role does not help a student (role comes from the database)', async () => {
      const forged = tokenFor({ _id: ctx.student._id, role: 'lecturer' })
      assert.equal((await create({}, forged)).status, 403)
    })

    test('a lecturer cannot read, edit, or delete another lecturer\'s assignment (404)', async () => {
      const { body: created } = await create()
      const id = created.assignment._id
      assert.equal((await ctx.json(`/api/assignments/${id}`, ctx.tokens.otherLecturer)).status, 404)
      assert.equal((await patch(id, { title: 'Stolen' }, ctx.tokens.otherLecturer)).status, 404)
      assert.equal((await ctx.json(`/api/assignments/${id}`, ctx.tokens.otherLecturer, { method: 'DELETE' })).status, 404)
      const stored = await Assignment.findById(id).lean()
      assert.ok(stored)
      assert.notEqual(stored.title, 'Stolen')
      const listed = await ctx.json('/api/assignments', ctx.tokens.otherLecturer)
      assert.ok(!listed.body.assignments.some((item) => item._id === id))
    })
  })

  describe('create', () => {
    test('stores a valid assignment owned by the caller and ignores client-supplied ownership', async () => {
      const { status, body: result } = await create({ title: '  Spaced  title ', allowedFileTypes: ['pdf', 'PDF'], lecturer: ctx.otherLecturer._id.toString(), _id: new mongoose.Types.ObjectId().toString(), createdAt: '2000-01-01' })
      assert.equal(status, 201)
      const { assignment } = result
      assert.equal(assignment.title, 'Spaced  title')
      assert.deepEqual(assignment.allowedFileTypes, ['PDF'])
      assert.equal(assignment.status, 'Draft')
      assert.equal(assignment.lecturer._id, ctx.lecturer._id.toString())
      assert.deepEqual(Object.keys(assignment.lecturer).sort(), ['_id', 'name'])
      const stored = await Assignment.findById(assignment._id).lean()
      assert.equal(stored.lecturer.toString(), ctx.lecturer._id.toString())
      assert.notEqual(new Date(stored.createdAt).getFullYear(), 2000)
    })

    test('rejects invalid payloads with 400, a list of errors, and stores nothing', async () => {
      const before = await Assignment.countDocuments({ lecturer: ctx.lecturer._id })
      const { status, body: result } = await create({ title: '', totalMarks: -5, deadline: 'nope', allowedFileTypes: ['EXE'], status: 'Archived' })
      assert.equal(status, 400)
      assert.ok(result.errors.length >= 5)
      assert.equal(await Assignment.countDocuments({ lecturer: ctx.lecturer._id }), before)
    })

    test('rejects malformed JSON and non-object bodies', async () => {
      const malformed = await ctx.json('/api/assignments', ctx.tokens.lecturer, { method: 'POST', body: '{bad json' })
      assert.equal(malformed.status, 400)
      assert.equal(malformed.body.message, 'Request body must be valid JSON.')
      assert.equal((await ctx.json('/api/assignments', ctx.tokens.lecturer, { method: 'POST', body: '[]' })).status, 400)
      assert.equal((await ctx.json('/api/assignments', ctx.tokens.lecturer, { method: 'POST', body: '"text"' })).status, 400)
      assert.equal((await ctx.json('/api/assignments', ctx.tokens.lecturer, { method: 'POST' })).status, 400)
    })

    test('rejects oversized bodies with 413', async () => {
      const { status } = await create({ description: 'x'.repeat(200 * 1024) })
      assert.equal(status, 413)
    })

    test('prevents duplicate titles per lecturer and module, case-insensitively (409)', async () => {
      const title = `Unique ${Date.now()}`
      assert.equal((await create({ title })).status, 201)
      assert.equal((await create({ title: title.toUpperCase() })).status, 409)
      assert.equal((await create({ title, module: 'A different module' })).status, 201)
      assert.equal((await create({ title }, ctx.tokens.otherLecturer)).status, 201)
    })
  })

  describe('read', () => {
    test('students see only Published assignments; lecturers see only their own', async () => {
      const draft = (await create({ title: `Hidden ${Date.now()}` })).body.assignment
      const published = (await create({ title: `Visible ${Date.now()}`, status: 'Published' })).body.assignment
      const closed = (await create({ title: `Closed ${Date.now()}`, status: 'Closed' })).body.assignment

      const studentList = (await ctx.json('/api/assignments', ctx.tokens.student)).body.assignments
      assert.ok(studentList.some((item) => item._id === published._id))
      assert.ok(studentList.every((item) => item.status === 'Published'))
      assert.ok(!studentList.some((item) => [draft._id, closed._id].includes(item._id)))

      assert.equal((await ctx.json(`/api/assignments/${draft._id}`, ctx.tokens.student)).status, 404)
      assert.equal((await ctx.json(`/api/assignments/${closed._id}`, ctx.tokens.student)).status, 404)
      assert.equal((await ctx.json(`/api/assignments/${published._id}`, ctx.tokens.student)).status, 200)

      const lecturerList = (await ctx.json('/api/assignments', ctx.tokens.lecturer)).body.assignments
      assert.ok([draft, published, closed].every((item) => lecturerList.some((listed) => listed._id === item._id)))
      assert.ok(lecturerList.every((item) => item.lecturer._id === ctx.lecturer._id.toString()))
    })

    test('never exposes lecturer emails or password data', async () => {
      const text = JSON.stringify((await ctx.json('/api/assignments', ctx.tokens.student)).body)
      assert.ok(!text.includes('@example.test'))
      assert.ok(!/password/i.test(text))
    })

    test('handles malformed ids (400) and unknown ids (404)', async () => {
      for (const id of ['not-an-object-id', '123', '507f1f77bcf86cd79943901', '%20']) {
        assert.equal((await ctx.json(`/api/assignments/${id}`, ctx.tokens.lecturer)).status, 400, `GET ${id}`)
        assert.equal((await patch(id, {})).status, 400, `PATCH ${id}`)
        assert.equal((await ctx.json(`/api/assignments/${id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 400, `DELETE ${id}`)
      }
      const missing = new mongoose.Types.ObjectId().toString()
      assert.equal((await ctx.json(`/api/assignments/${missing}`, ctx.tokens.lecturer)).status, 404)
      assert.equal((await patch(missing, {})).status, 404)
      assert.equal((await ctx.json(`/api/assignments/${missing}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 404)
    })

    test('unknown API routes return a JSON 404', async () => {
      const { status, body: result } = await ctx.json('/api/does-not-exist', ctx.tokens.lecturer)
      assert.equal(status, 404)
      assert.ok(result.message)
    })
  })

  describe('update and publish', () => {
    test('updates fields, persists them, and rejects invalid values without changing data', async () => {
      const { _id } = (await create()).body.assignment
      assert.equal((await patch(_id, { title: 'Renamed title', totalMarks: 80 })).status, 200)
      let stored = await Assignment.findById(_id).lean()
      assert.equal(stored.title, 'Renamed title')
      assert.equal(stored.totalMarks, 80)

      for (const change of [{ totalMarks: 0 }, { deadline: 'bad' }, { allowedFileTypes: ['EXE'] }, { requiredFiles: [] }, { status: 'Archived' }, { maxFileSizeMB: 500 }]) {
        assert.equal((await patch(_id, change)).status, 400, JSON.stringify(change))
      }
      stored = await Assignment.findById(_id).lean()
      assert.equal(stored.totalMarks, 80)
      assert.equal(stored.status, 'Draft')
    })

    test('cannot reassign ownership through an update', async () => {
      const { _id } = (await create()).body.assignment
      assert.equal((await patch(_id, { lecturer: ctx.otherLecturer._id.toString() })).status, 200)
      assert.equal((await Assignment.findById(_id).lean()).lecturer.toString(), ctx.lecturer._id.toString())
    })

    test('publishing makes an assignment visible to students; it cannot return to Draft (409)', async () => {
      const { _id } = (await create()).body.assignment
      assert.equal((await ctx.json(`/api/assignments/${_id}`, ctx.tokens.student)).status, 404)
      assert.equal((await patch(_id, { status: 'Published' })).status, 200)
      assert.equal((await ctx.json(`/api/assignments/${_id}`, ctx.tokens.student)).status, 200)
      assert.equal((await patch(_id, { status: 'Draft' })).status, 409)
      assert.equal((await patch(_id, { status: 'Closed' })).status, 200)
      assert.equal((await patch(_id, { status: 'Draft' })).status, 409)
      assert.equal((await ctx.json(`/api/assignments/${_id}`, ctx.tokens.student)).status, 404)
    })

    test('renaming into an existing title returns 409', async () => {
      const first = (await create()).body.assignment
      const second = (await create()).body.assignment
      assert.equal((await patch(second._id, { title: first.title })).status, 409)
    })
  })

  describe('delete', () => {
    test('removes only the targeted assignment and then returns 404', async () => {
      const target = (await create()).body.assignment
      const bystander = (await create()).body.assignment
      assert.equal((await ctx.json(`/api/assignments/${target._id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 200)
      assert.equal(await Assignment.exists({ _id: target._id }), null)
      assert.ok(await Assignment.exists({ _id: bystander._id }))
      assert.equal((await ctx.json(`/api/assignments/${target._id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 404)
    })
  })

  describe('database failure', () => {
    test('answers 503 with a generic message instead of crashing, then recovers', async () => {
      await mongoose.connection.close()
      try {
        const { status, body: result } = await ctx.json('/api/assignments', ctx.tokens.lecturer)
        assert.equal(status, 503)
        assert.ok(!/mongo|buffering|users\./i.test(JSON.stringify(result)), 'internal details must not leak')
      } finally {
        await mongoose.connect(testMongoUri, { bufferTimeoutMS: 1500 })
      }
      assert.equal((await ctx.json('/api/assignments', ctx.tokens.lecturer)).status, 200)
    })
  })
})
