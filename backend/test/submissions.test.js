import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { after, before, describe, test } from 'node:test'
import mongoose from 'mongoose'
import Assignment from '../src/models/Assignment.js'
import Submission from '../src/models/Submission.js'
import User from '../src/models/User.js'
import { createTestContext, testMongoUri, tokenFor } from '../testing/context.js'

const pdf = await readFile(new URL('./fixtures/report.pdf', import.meta.url))
const png = await readFile(new URL('./fixtures/image.png', import.meta.url))
const zip = await readFile(new URL('./fixtures/source.zip', import.meta.url))
const docx = await readFile(new URL('./fixtures/report.docx', import.meta.url))
const jpg = await readFile(new URL('./fixtures/image.jpg', import.meta.url))
const payload = { title: 'Submission integration', module: 'Testing', description: 'Upload your report.', deadline: '2099-01-01T00:00:00Z', totalMarks: 50, allowedFileTypes: ['PDF', 'DOCX', 'PNG', 'JPG', 'ZIP'], requiredFiles: ['Report'], maxFileSizeMB: 1, lateSubmissionAllowed: false, status: 'Published' }

describe('persistent submissions API (isolated test database)', { skip: !testMongoUri && 'set MONGODB_TEST_URI to run database tests' }, () => {
  let ctx
  let otherStudentToken
  let serial = 0
  before(async () => {
    ctx = await createTestContext()
    const email = `other-student-${Date.now()}@example.test`
    ctx.trackEmail(email)
    otherStudentToken = tokenFor(await User.create({ name: 'Other Student', email, password: 'password123', role: 'student' }))
  })
  after(async () => { await ctx?.cleanup() })

  async function assignment(extra = {}, token = ctx.tokens.lecturer) {
    const result = await ctx.json('/api/assignments', token, { method: 'POST', body: JSON.stringify({ ...payload, title: `Submission assignment ${++serial}`, ...extra }) })
    assert.equal(result.status, 201)
    return result.body.assignment
  }
  function upload(id, files = [{ name: 'report.pdf', bytes: pdf }], labels = ['Report'], token = ctx.tokens.student) {
    const form = new FormData()
    for (const file of files) form.append('files', new Blob([file.bytes], { type: file.mime || 'application/octet-stream' }), file.name)
    form.append('attachments', typeof labels === 'string' ? labels : JSON.stringify(labels))
    return ctx.json(`/api/submissions/assignments/${id}`, token, { method: 'POST', body: form })
  }
  const review = (id, change, token = ctx.tokens.lecturer) => ctx.json(`/api/submissions/${id}/review`, token, { method: 'PATCH', body: JSON.stringify(change) })
  const details = (id, token = ctx.tokens.student) => ctx.json(`/api/submissions/${id}`, token)

  test('stores a genuine PDF, metadata, requirements and pass results in MongoDB with private generated paths', async () => {
    const a = await assignment()
    const { status, body } = await upload(a._id)
    assert.equal(status, 201)
    const s = body.submission
    assert.equal(s.student._id, ctx.student._id.toString())
    assert.equal(s.assignment._id, a._id)
    assert.equal(s.timing, 'On time')
    assert.equal(s.reviewStatus, 'Awaiting Review')
    assert.equal(s.marks, null)
    assert.equal(s.compliance.passed, true)
    assert.equal(Object.keys(s.compliance.checks).length, 4)
    assert.ok(!JSON.stringify(s).includes('storagePath'))
    assert.ok(!JSON.stringify(s).includes('password'))
    const stored = await Submission.findById(s._id).lean()
    assert.equal(stored.files[0].size, pdf.length)
    assert.match(stored.files[0].storagePath, /^[a-f0-9-]+\/[a-f0-9-]+$/)
    assert.deepEqual(await readFile(path.join(ctx.storageRoot, stored.files[0].storagePath)), pdf)
    assert.equal(stored.requirements.totalMarks, 50)
    assert.ok(new Date(stored.submittedAt).getTime() <= Date.now())
  })

  test('accepts genuine PNG, JPEG, DOCX and ZIP files based on contents rather than declared MIME', async () => {
    const a = await assignment({ requiredFiles: ['Report', 'Source files', 'Diagram'] })
    const result = await upload(a._id, [{ name: 'report.docx', bytes: docx, mime: 'text/plain' }, { name: 'source.zip', bytes: zip }, { name: 'diagram.png', bytes: png }, { name: 'image.jpeg', bytes: jpg }], ['Report', 'Source files', 'Diagram', ''])
    assert.equal(result.status, 201, JSON.stringify(result.body))
    assert.deepEqual(result.body.submission.files.map((file) => file.type), ['DOCX', 'ZIP', 'PNG', 'JPG'])
    assert.equal(result.body.submission.compliance.passed, true)
  })

  test('requires authentication and the student role for upload before creating files', async () => {
    const a = await assignment()
    const directories = await readdir(ctx.storageRoot).catch(() => [])
    assert.equal((await upload(a._id, undefined, undefined, null)).status, 401)
    assert.equal((await upload(a._id, undefined, undefined, ctx.tokens.lecturer)).status, 403)
    assert.equal((await ctx.json('/api/submissions', null)).status, 401)
    assert.deepEqual(await readdir(ctx.storageRoot).catch(() => []), directories)
  })

  test('rejects Draft and Closed assignments and invalid or missing IDs', async () => {
    for (const status of ['Draft', 'Closed']) assert.equal((await upload((await assignment({ status }))._id)).status, 404)
    assert.equal((await upload('invalid')).status, 400)
    assert.equal((await upload(new mongoose.Types.ObjectId().toString())).status, 404)
  })

  test('rejects forged extensions, unsupported files, invalid archives and empty files without records or orphan files', async () => {
    const a = await assignment()
    const directories = await readdir(ctx.storageRoot)
    for (const file of [{ name: 'fake.pdf', bytes: Buffer.from('this is not a PDF') }, { name: 'image.pdf', bytes: png }, { name: 'report.exe', bytes: pdf }, { name: 'fake.docx', bytes: zip }, { name: 'broken.zip', bytes: Buffer.from('PK\x03\x04broken archive') }, { name: 'empty.pdf', bytes: Buffer.alloc(0) }]) {
      const result = await upload(a._id, [file])
      assert.equal(result.status, 400, JSON.stringify(result.body))
    }
    assert.equal(await Submission.countDocuments({ assignment: a._id }), 0)
    assert.deepEqual(await readdir(ctx.storageRoot), directories)
    assert.equal((await Assignment.findById(a._id).select('+submissionCount')).submissionCount, 0)
  })

  test('rejects genuine file formats excluded by the assignment with clear failed checks', async () => {
    const a = await assignment({ allowedFileTypes: ['PDF'] })
    const result = await upload(a._id, [{ name: 'image.png', bytes: png }])
    assert.equal(result.status, 400)
    assert.equal(result.body.compliance.checks.fileType.passed, false)
    assert.equal(await Submission.countDocuments({ assignment: a._id }), 0)
  })

  test('enforces per-file size and file-count limits and cleans partial uploads', async () => {
    const a = await assignment()
    const directories = await readdir(ctx.storageRoot)
    assert.equal((await upload(a._id, [{ name: 'large.pdf', bytes: Buffer.concat([pdf, Buffer.alloc(1024 * 1024)]) }])).status, 413)
    assert.equal((await upload(a._id, Array.from({ length: 21 }, () => ({ name: 'report.pdf', bytes: pdf })), Array(21).fill('Report'))).status, 400)
    assert.equal(await Submission.countDocuments({ assignment: a._id }), 0)
    assert.deepEqual(await readdir(ctx.storageRoot), directories)
  })

  test('rejects missing files, invalid attachment labels and malformed multipart bodies', async () => {
    const a = await assignment()
    for (const labels of ['not-json', {}, [], [123], ['x'.repeat(201)]]) assert.equal((await upload(a._id, undefined, labels)).status, 400)
    assert.equal((await upload(a._id, [], [])).status, 400)
    const malformed = await ctx.json(`/api/submissions/assignments/${a._id}`, ctx.tokens.student, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data' }, body: 'broken' })
    assert.equal(malformed.status, 400)
    assert.equal(await Submission.countDocuments({ assignment: a._id }), 0)
  })

  test('records missing required attachments as failed compliance without assigning lecturer marks', async () => {
    const a = await assignment({ requiredFiles: ['Report', 'Source files'] })
    const result = await upload(a._id)
    assert.equal(result.status, 201)
    const s = result.body.submission
    assert.equal(s.compliance.passed, false)
    assert.equal(s.compliance.checks.requiredFiles.passed, false)
    assert.match(s.compliance.checks.requiredFiles.message, /Source files/)
    assert.equal(s.marks, null)
    assert.equal(s.reviewStatus, 'Awaiting Review')
  })

  test('records late submissions when permitted and rejects them when prohibited', async () => {
    const late = await assignment({ deadline: '2020-01-01', lateSubmissionAllowed: true })
    const result = await upload(late._id)
    assert.equal(result.status, 201)
    assert.equal(result.body.submission.timing, 'Late')
    assert.equal(result.body.submission.compliance.checks.deadline.passed, false)
    const prohibited = await assignment({ deadline: '2020-01-01', lateSubmissionAllowed: false })
    assert.equal((await upload(prohibited._id)).status, 409)
    assert.equal(await Submission.countDocuments({ assignment: prohibited._id }), 0)
    assert.equal((await ctx.json(`/api/assignments/${prohibited._id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 200)
  })

  test('lists only the student’s own submissions and the lecturer’s own assignments, including filtered queries', async () => {
    const a = await assignment()
    const b = await assignment({}, ctx.tokens.otherLecturer)
    const own = (await upload(a._id)).body.submission
    const other = (await upload(b._id, undefined, undefined, otherStudentToken)).body.submission
    const mine = (await ctx.json('/api/submissions', ctx.tokens.student)).body.submissions
    assert.ok(mine.some((s) => s._id === own._id))
    assert.ok(!mine.some((s) => s._id === other._id))
    const lecturer = (await ctx.json('/api/submissions', ctx.tokens.lecturer)).body.submissions
    assert.ok(lecturer.some((s) => s._id === own._id))
    assert.ok(!lecturer.some((s) => s._id === other._id))
    assert.deepEqual((await ctx.json(`/api/submissions?assignment=${b._id}`, ctx.tokens.lecturer)).body.submissions, [])
    assert.equal((await ctx.json('/api/submissions?assignment=invalid', ctx.tokens.student)).status, 400)
  })

  test('protects details and downloads from other students, other lecturers and unauthenticated requests', async () => {
    const s = (await upload((await assignment())._id)).body.submission
    const filePath = `/api/submissions/${s._id}/files/${s.files[0]._id}`
    for (const token of [otherStudentToken, ctx.tokens.otherLecturer]) {
      assert.equal((await details(s._id, token)).status, 404)
      assert.equal((await ctx.json(filePath, token)).status, 404)
    }
    assert.equal((await details(s._id, null)).status, 401)
    assert.equal((await ctx.json(filePath, null)).status, 401)
    for (const token of [ctx.tokens.student, ctx.tokens.lecturer]) {
      const response = await ctx.request(filePath, token)
      assert.equal(response.status, 200)
      assert.match(response.headers.get('content-disposition'), /attachment/)
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf)
    }
    assert.equal((await details('invalid')).status, 400)
    assert.equal((await details(new mongoose.Types.ObjectId().toString())).status, 404)
    assert.equal((await ctx.json(`/api/submissions/${s._id}/files/invalid`, ctx.tokens.student)).status, 400)
    assert.equal((await ctx.json(`/api/submissions/${s._id}/files/${new mongoose.Types.ObjectId()}`, ctx.tokens.student)).status, 404)
    const stored = await Submission.findById(s._id).lean()
    assert.equal((await ctx.request(`/storage/submissions/${stored.files[0].storagePath}`, null)).status, 404)
  })

  test('persists private review drafts and publishes final marks independently of compliance', async () => {
    const s = (await upload((await assignment({ requiredFiles: ['Report', 'Source files'] }))._id)).body.submission
    const compliance = s.compliance
    const draft = await review(s._id, { marks: 0, feedback: 'Draft feedback', reviewStatus: 'Draft' })
    assert.equal(draft.status, 200)
    assert.equal(draft.body.submission.marks, 0)
    const studentDraft = (await details(s._id)).body.submission
    assert.equal(studentDraft.marks, null)
    assert.equal(studentDraft.feedback, '')
    assert.equal((await review(s._id, { marks: 42, feedback: 'Reviewed by lecturer', reviewStatus: 'Graded', compliance: { passed: true }, student: ctx.lecturer._id })).status, 200)
    const student = (await details(s._id)).body.submission
    assert.equal(student.marks, 42)
    assert.equal(student.feedback, 'Reviewed by lecturer')
    assert.equal(student.reviewedBy.name, 'Test Lecturer')
    assert.deepEqual(Object.keys(student.reviewedBy).sort(), ['_id', 'name'])
    assert.deepEqual(student.compliance, compliance)
    assert.equal(student.student._id, ctx.student._id.toString())
    const stored = await Submission.findById(s._id).lean()
    assert.equal(stored.reviewedBy.toString(), ctx.lecturer._id.toString())
    assert.ok(stored.reviewedAt)
  })

  test('grade visibility: saving a draft persists the score but hides it from the student list and details', async () => {
    const s = (await upload((await assignment())._id)).body.submission
    assert.equal((await review(s._id, { marks: 25, feedback: 'Private draft feedback', reviewStatus: 'Draft' })).status, 200)
    const stored = await Submission.findById(s._id).lean()
    assert.equal(stored.marks, 25)
    assert.equal(stored.feedback, 'Private draft feedback')
    assert.equal(stored.reviewStatus, 'Draft')
    const listed = (await ctx.json('/api/submissions', ctx.tokens.student)).body.submissions.find((item) => item._id === s._id)
    const detail = (await details(s._id)).body.submission
    for (const value of [listed, detail]) {
      assert.equal(value.marks, null)
      assert.equal(value.feedback, '')
      assert.equal(value.reviewStatus, 'Draft')
    }
  })

  test('grade visibility: publishing persists marks and feedback and exposes only the correct student/assignment/attempt', async () => {
    const a = await assignment()
    const s = (await upload(a._id)).body.submission
    assert.equal((await review(s._id, { marks: 42, feedback: 'Published result', reviewStatus: 'Graded' })).status, 200)
    const stored = await Submission.findById(s._id).lean()
    assert.equal(stored.marks, 42)
    assert.equal(stored.feedback, 'Published result')
    assert.equal(stored.reviewStatus, 'Graded')
    for (const value of [(await details(s._id)).body.submission, (await ctx.json('/api/submissions', ctx.tokens.student)).body.submissions.find((item) => item._id === s._id)]) {
      assert.equal(value._id, s._id)
      assert.equal(value.student._id, ctx.student._id.toString())
      assert.equal(value.assignment._id, a._id)
      assert.equal(value.marks, 42)
      assert.equal(value.requirements.totalMarks, 50)
      assert.equal(value.feedback, 'Published result')
      assert.equal(value.reviewStatus, 'Graded')
    }
  })

  test('grade visibility: fresh requests, MongoDB reconnection and a new student login retain the published result', async () => {
    const s = (await upload((await assignment())._id)).body.submission
    await review(s._id, { marks: 42, feedback: 'Persistent published feedback', reviewStatus: 'Graded' })
    assert.equal((await details(s._id)).body.submission.marks, 42)
    await mongoose.disconnect()
    await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 5000, bufferTimeoutMS: 1500 })
    // Browser logout discards its JWT; a new login must load the same persisted result.
    const login = await ctx.json('/api/auth/login', null, { method: 'POST', body: JSON.stringify({ email: ctx.student.email, password: 'password123' }) })
    assert.equal(login.status, 200)
    const detail = await details(s._id, login.body.token)
    assert.equal(detail.status, 200)
    assert.equal(detail.body.submission.marks, 42)
    assert.equal(detail.body.submission.feedback, 'Persistent published feedback')
    const listed = (await ctx.json('/api/submissions', login.body.token)).body.submissions.find((item) => item._id === s._id)
    assert.equal(listed.marks, 42)
    assert.equal(listed.reviewStatus, 'Graded')
  })

  test('grade visibility: another student cannot read the published result through details or filtered lists', async () => {
    const a = await assignment()
    const s = (await upload(a._id)).body.submission
    await review(s._id, { marks: 42, feedback: 'Student-private published result', reviewStatus: 'Graded' })
    assert.equal((await details(s._id, otherStudentToken)).status, 404)
    const otherList = await ctx.json(`/api/submissions?assignment=${a._id}`, otherStudentToken)
    assert.equal(otherList.status, 200)
    assert.ok(!otherList.body.submissions.some((item) => item._id === s._id))
    assert.ok(!JSON.stringify(otherList.body).includes('Student-private published result'))
    assert.equal((await details(s._id)).body.submission.marks, 42)
  })

  test('grade visibility: updating a published review keeps the same attempt and exposes the updated score and feedback', async () => {
    const s = (await upload((await assignment())._id)).body.submission
    await review(s._id, { marks: 42, feedback: 'First published result', reviewStatus: 'Graded' })
    assert.equal((await details(s._id)).body.submission.marks, 42)
    const updated = await review(s._id, { marks: 47, feedback: 'Updated published result', reviewStatus: 'Graded' })
    assert.equal(updated.status, 200)
    const stored = await Submission.findById(s._id).lean()
    assert.equal(stored.reviewStatus, 'Graded')
    assert.equal(stored.marks, 47)
    assert.equal(stored.feedback, 'Updated published result')
    for (const value of [(await details(s._id)).body.submission, (await ctx.json('/api/submissions', ctx.tokens.student)).body.submissions.find((item) => item._id === s._id)]) {
      assert.equal(value._id, s._id)
      assert.equal(value.marks, 47)
      assert.equal(value.feedback, 'Updated published result')
      assert.equal(value.reviewStatus, 'Graded')
    }
  })

  test('grade visibility: newer pending and draft attempts do not remove an older published attempt from the student API', async () => {
    const a = await assignment()
    const first = (await upload(a._id)).body.submission
    await review(first._id, { marks: 42, feedback: 'Published first attempt', reviewStatus: 'Graded' })
    const pending = (await upload(a._id)).body.submission
    const draft = (await upload(a._id)).body.submission
    await review(draft._id, { marks: 49, feedback: 'Private newer attempt', reviewStatus: 'Draft' })
    const result = await ctx.json(`/api/submissions?assignment=${a._id}`, ctx.tokens.student)
    assert.equal(result.status, 200)
    assert.equal(result.body.submissions.length, 3)
    assert.equal(result.body.submissions.find((item) => item._id === first._id).marks, 42)
    assert.equal(result.body.submissions.find((item) => item._id === first._id).feedback, 'Published first attempt')
    assert.equal(result.body.submissions.find((item) => item._id === pending._id).marks, null)
    assert.equal(result.body.submissions.find((item) => item._id === draft._id).marks, null)
    assert.equal(result.body.submissions.find((item) => item._id === draft._id).feedback, '')
  })

  test('rejects unauthorized and invalid reviews without changing marks or compliance', async () => {
    const s = (await upload((await assignment())._id)).body.submission
    const valid = { marks: 20, feedback: 'Feedback', reviewStatus: 'Graded' }
    assert.equal((await review(s._id, valid, ctx.tokens.student)).status, 403)
    assert.equal((await review(s._id, valid, ctx.tokens.otherLecturer)).status, 404)
    assert.equal((await review(s._id, valid, null)).status, 401)
    for (const change of [{ marks: -1 }, { marks: 51 }, { marks: '20' }, { marks: null }, { marks: {} }, { feedback: {} }, { feedback: 'x'.repeat(5001) }, { reviewStatus: 'Unknown' }]) {
      assert.equal((await review(s._id, { ...valid, ...change })).status, 400)
    }
    const stored = await Submission.findById(s._id).lean()
    assert.equal(stored.marks, null)
    assert.equal(stored.reviewStatus, 'Awaiting Review')
    assert.equal((await review(s._id, { marks: null, feedback: 'Still reviewing', reviewStatus: 'Draft' })).status, 200)
  })

  test('retains previous attempts and freezes the requirements used for each check', async () => {
    const a = await assignment()
    const first = (await upload(a._id)).body.submission
    assert.equal((await ctx.json(`/api/assignments/${a._id}`, ctx.tokens.lecturer, { method: 'PATCH', body: JSON.stringify({ totalMarks: 100, requiredFiles: ['Report', 'Diagram'] }) })).status, 200)
    const second = (await upload(a._id)).body.submission
    assert.notEqual(first._id, second._id)
    assert.equal(first.compliance.passed, true)
    assert.equal(second.compliance.passed, false)
    const persistedFirst = (await details(first._id)).body.submission
    assert.equal(persistedFirst.requirements.totalMarks, 50)
    assert.deepEqual(persistedFirst.requirements.requiredFiles, ['Report'])
    assert.equal((await review(first._id, { marks: 75, feedback: '', reviewStatus: 'Graded' })).status, 400)
    assert.equal(await Submission.countDocuments({ assignment: a._id }), 2)
  })

  test('prevents assignment deletion with existing submissions or an upload reservation', async () => {
    const a = await assignment()
    const s = (await upload(a._id)).body.submission
    assert.equal((await ctx.json(`/api/assignments/${a._id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 409)
    assert.equal((await details(s._id)).status, 200)
    const reserved = await assignment()
    await Assignment.updateOne({ _id: reserved._id }, { $inc: { submissionCount: 1 } })
    assert.equal((await ctx.json(`/api/assignments/${reserved._id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 409)
    await Assignment.updateOne({ _id: reserved._id }, { $inc: { submissionCount: -1 } })
    assert.equal((await ctx.json(`/api/assignments/${reserved._id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 200)
  })

  test('rechecks late policy after a slow upload crosses the deadline and releases its reservation', async () => {
    const a = await assignment()
    let release
    const gate = new Promise((resolve) => { release = resolve })
    const boundary = 'labtrack-slow-upload'
    async function* body() {
      yield Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="report.pdf"\r\nContent-Type: application/pdf\r\n\r\n`)
      await gate
      yield pdf
      yield Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="attachments"\r\n\r\n["Report"]\r\n--${boundary}--\r\n`)
    }
    const responsePromise = fetch(`${ctx.baseUrl}/api/submissions/assignments/${a._id}`, { method: 'POST', headers: { Authorization: `Bearer ${ctx.tokens.student}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body: body(), duplex: 'half', signal: AbortSignal.timeout(10000) })
    try {
      let reserved = false
      for (let attempt = 0; attempt < 100 && !reserved; attempt++) {
        reserved = (await Assignment.findById(a._id).select('+submissionCount')).submissionCount === 1
        if (!reserved) await new Promise((resolve) => setTimeout(resolve, 20))
      }
      assert.ok(reserved, 'upload must reserve the assignment before receiving files')
      assert.equal((await ctx.json(`/api/assignments/${a._id}`, ctx.tokens.lecturer, { method: 'DELETE' })).status, 409)
      await Assignment.updateOne({ _id: a._id }, { $set: { deadline: new Date('2020-01-01') } })
    } finally { release() }
    const response = await responsePromise
    assert.equal(response.status, 409)
    assert.equal(await Submission.countDocuments({ assignment: a._id }), 0)
    assert.equal((await Assignment.findById(a._id).select('+submissionCount')).submissionCount, 0)
  })

  test('cleans partial files and releases the reservation when a client interrupts an upload', async () => {
    const a = await assignment()
    const directories = await readdir(ctx.storageRoot)
    const request = http.request(`${ctx.baseUrl}/api/submissions/assignments/${a._id}`, { method: 'POST', headers: { Authorization: `Bearer ${ctx.tokens.student}`, 'Content-Type': 'multipart/form-data; boundary=interrupted-upload' } })
    request.on('error', () => {})
    request.write('--interrupted-upload\r\nContent-Disposition: form-data; name="files"; filename="report.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4\n')
    try {
      let reserved = false
      for (let attempt = 0; attempt < 100 && !reserved; attempt++) {
        reserved = (await Assignment.findById(a._id).select('+submissionCount')).submissionCount === 1
        if (!reserved) await new Promise((resolve) => setTimeout(resolve, 20))
      }
      assert.ok(reserved)
    } finally { request.destroy() }
    let cleaned = false
    for (let attempt = 0; attempt < 100 && !cleaned; attempt++) {
      cleaned = (await Assignment.findById(a._id).select('+submissionCount')).submissionCount === 0
      if (!cleaned) await new Promise((resolve) => setTimeout(resolve, 20))
    }
    assert.ok(cleaned, 'interrupted uploads must release the assignment reservation')
    assert.equal(await Submission.countDocuments({ assignment: a._id }), 0)
    assert.deepEqual(await readdir(ctx.storageRoot), directories)
  })

  test('retains records, review, file bytes and authenticated access after MongoDB reconnection', async () => {
    const s = (await upload((await assignment())._id)).body.submission
    assert.equal((await review(s._id, { marks: 39, feedback: 'Persistent feedback', reviewStatus: 'Graded' })).status, 200)
    await mongoose.disconnect()
    await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 5000 })
    const result = await details(s._id)
    assert.equal(result.status, 200)
    assert.equal(result.body.submission.marks, 39)
    assert.equal(result.body.submission.feedback, 'Persistent feedback')
    assert.equal(result.body.submission.compliance.passed, true)
    const file = await ctx.request(`/api/submissions/${s._id}/files/${s.files[0]._id}`, ctx.tokens.student)
    assert.equal(file.status, 200)
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), pdf)
  })
})
