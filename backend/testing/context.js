import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import app from '../src/app.js'
import Assignment from '../src/models/Assignment.js'
import User from '../src/models/User.js'

// Tests never read backend/.env, so they cannot use the real JWT secret or database.
export const testSecret = 'automated-test-secret-that-is-not-used-anywhere-else'
process.env.JWT_SECRET = testSecret

export const testMongoUri = process.env.MONGODB_TEST_URI

export function assertSafeTestDatabase(uri) {
  const databaseName = new URL(uri).pathname.replace(/^\//, '')
  if (!/test/i.test(databaseName)) {
    throw new Error(`Refusing to run tests: database "${databaseName}" must contain "test" in its name.`)
  }
  if (process.env.MONGODB_URI && uri === process.env.MONGODB_URI) {
    throw new Error('Refusing to run tests: MONGODB_TEST_URI must differ from MONGODB_URI.')
  }
}

export function tokenFor(user, options = {}) {
  return jwt.sign({ role: user.role }, testSecret, { subject: user._id.toString(), expiresIn: '5m', ...options })
}

export async function createTestContext() {
  assertSafeTestDatabase(testMongoUri)
  await mongoose.connect(testMongoUri, { bufferTimeoutMS: 1500 })
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
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    })
  }

  return {
    lecturer,
    otherLecturer,
    student,
    tokens: { lecturer: tokenFor(lecturer), otherLecturer: tokenFor(otherLecturer), student: tokenFor(student) },
    request,
    json: (path, token, options) => request(path, token, options).then(async (response) => ({ status: response.status, headers: response.headers, body: await response.json() })),
    trackEmail: (email) => extraUserEmails.push(email),
    async cleanup() {
      await Assignment.deleteMany({ lecturer: { $in: users.map((user) => user._id) } })
      await User.deleteMany({ $or: [{ _id: { $in: users.map((user) => user._id) } }, { email: { $in: extraUserEmails } }] })
      await new Promise((resolve) => server.close(resolve))
      await mongoose.disconnect()
    },
  }
}
