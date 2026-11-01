import assert from 'node:assert/strict'
import { test } from 'node:test'
import { studentWithdrawalState } from '../src/utils/studentWithdrawal.js'

const deadline = '2026-11-01T00:00:00Z'
const before = new Date(deadline).getTime() - 1
const attempt = { reviewStatus: 'Awaiting Review', withdrawnAt: null, studentWithdrawal: { allowed: true, reason: '', deadline } }

test('eligible own unreviewed attempt can be withdrawn strictly before the current deadline', () => {
  assert.deepEqual(studentWithdrawalState(attempt, before), { allowed: true, reason: '' })
})

test('withdrawal is unavailable at and after the deadline, even with stale API permission', () => {
  for (const now of [before + 1, before + 2]) {
    const state = studentWithdrawalState(attempt, now)
    assert.equal(state.allowed, false)
    assert.match(state.reason, /deadline has passed/i)
  }
})

test('draft and published reviews disable withdrawal with an explanation', () => {
  for (const reviewStatus of ['Draft', 'Graded']) {
    const state = studentWithdrawalState({ ...attempt, reviewStatus }, before)
    assert.equal(state.allowed, false)
    assert.match(state.reason, /review has started|published/i)
  }
})

test('withdrawn attempts remain history and cannot be withdrawn again or restored by the student', () => {
  const state = studentWithdrawalState({ ...attempt, withdrawnAt: '2026-10-31T00:00:00Z' }, before)
  assert.equal(state.allowed, false)
  assert.match(state.reason, /already withdrawn.*only the owning lecturer can restore/i)
})

test('server restrictions are respected without exposing private draft marks', () => {
  const reason = 'Lecturer review has started or a grade has been published.'
  assert.deepEqual(studentWithdrawalState({ ...attempt, studentWithdrawal: { allowed: false, reason, deadline } }, before), { allowed: false, reason })
})

test('missing authorization metadata or invalid deadlines never enable withdrawal', () => {
  for (const studentWithdrawal of [undefined, {}, { allowed: true }, { allowed: true, deadline: 'invalid' }]) assert.equal(studentWithdrawalState({ ...attempt, studentWithdrawal }, before).allowed, false)
})

test('current server deadline takes precedence over the original upload snapshot', () => {
  const state = studentWithdrawalState({ ...attempt, requirements: { deadline: '2099-01-01T00:00:00Z' }, studentWithdrawal: { allowed: true, deadline: '2026-10-01T00:00:00Z' } }, before)
  assert.equal(state.allowed, false)
})
