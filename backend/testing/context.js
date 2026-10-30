import jwt from 'jsonwebtoken'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parse } from 'dotenv'
import mongoose from 'mongoose'
import Assignment from '../src/models/Assignment.js'
import Submission from '../src/models/Submission.js'
import User from '../src/models/User.js'

// Never load .env into the environment or use its credentials to connect.
export const testSecret = 'automated-test-secret-that-is-not-used-anywhere-else'
process.env.JWT_SECRET = testSecret

export const testMongoUri = process.env.MONGODB_TEST_URI
// Each test process gets private temporary file storage, never backend/storage.
process.env.SUBMISSION_STORAGE_DIR = mkdtempSync(path.join(tmpdir(), 'labtrack-submission-test-'))
const { default: app } = await import('../src/app.js')
const { removeUploadDirectory, uploadRoot } = await import('../src/services/submissionFiles.js')

function configuredDatabaseUris() {
  let localUri
  try {
    // Read only for a safety comparison, even when npm test has not loaded dotenv.
    localUri = parse(readFileSync(new URL('../.env', import.meta.url))).MONGODB_URI
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  return [process.env.MONGODB_URI, localUri].filter(Boolean)
}

export function assertSafeTestDatabase(uri, developmentUris = configuredDatabaseUris()) {
  let parsed
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error('Refusing to run tests: MONGODB_TEST_URI must be a valid MongoDB URI.')
  }
  const databaseName = parsed.pathname.slice(1)
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !/^[a-z0-9_-]+_test$/i.test(databaseName)) {
    throw new Error('Refusing to run tests: use an explicit MongoDB database name ending in _test.')
  }
  if ([...parsed.searchParams.keys()].some((key) => key.toLowerCase() === 'dbname')) {
    throw new Error('Refusing to run tests: database overrides are not allowed.')
  }
  for (const developmentUri of developmentUris) {
    let developmentName
    try {
      developmentName = decodeURIComponent(new URL(developmentUri).pathname.slice(1))
    } catch {
      throw new Error('Refusing to run tests: cannot verify the configured development database.')
    }
    if (databaseName.toLowerCase() === developmentName.toLowerCase()) {
      throw new Error('Refusing to run tests: the test database must differ from the development database.')
    }
  }
  return databaseName
}

export function tokenFor(user, options = {}) {
  return jwt.sign({ role: user.role }, testSecret, { subject: user._id.toString(), expiresIn: '5m', ...options })
}

export async function createTestContext() {
  assertSafeTestDatabase(testMongoUri)
  await mongoose.connect(testMongoUri, { bufferTimeoutMS: 1500, serverSelectionTimeoutMS: 5000 })
  await Assignment.init()

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const [lecturer, otherLecturer, student] = await User.create([
    { name: 'Test Lecturer', email: `lecturer-${suffix}@example.test`, password: 'password123', role: 'lecturer' },
    { name: 'Other Lecturer', email: `other-${suffix}@example.test`, password: 'password123', role: 'lecturer' },
    { name: 'Test Student', email: `student-${suffix}@example.test`, password: 'password123', role: 'student' },
  ])
  const server = app.listen(0)
  const users = [lecturer, otherLecturer, student]
  const extraUserEmails = []

  function request(path, token, options = {}) {
    return fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      ...options,
      headers: { ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    })
  }

  return {
    lecturer,
    otherLecturer,
    student,
    storageRoot: uploadRoot,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    tokens: { lecturer: tokenFor(lecturer), otherLecturer: tokenFor(otherLecturer), student: tokenFor(student) },
    request,
    json: (path, token, options) => request(path, token, options).then(async (response) => ({ status: response.status, headers: response.headers, body: await response.json() })),
    trackEmail: (email) => extraUserEmails.push(email),
    async cleanup() {
      // Refuse destructive cleanup if any test has switched the shared connection.
      const databaseName = assertSafeTestDatabase(testMongoUri)
      if (mongoose.connection.name !== databaseName) throw new Error('Refusing cleanup on an unexpected database.')
      const assignmentIds = await Assignment.find({ lecturer: { $in: users.map((user) => user._id) } }).distinct('_id')
      const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      for (const submission of submissions) {
        for (const file of submission.files) await removeUploadDirectory(path.dirname(path.join(uploadRoot, file.storagePath)))
      }
      await Submission.deleteMany({ assignment: { $in: assignmentIds } })
      await Assignment.deleteMany({ lecturer: { $in: users.map((user) => user._id) } })
      await User.deleteMany({ $or: [{ _id: { $in: users.map((user) => user._id) } }, { email: { $in: extraUserEmails } }] })
      await new Promise((resolve) => server.close(resolve))
      await mongoose.disconnect()
    },
  }
}
