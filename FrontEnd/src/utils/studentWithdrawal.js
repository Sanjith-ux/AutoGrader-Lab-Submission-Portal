export function studentWithdrawalState(submission, now = Date.now()) {
  if (submission.withdrawnAt) return { allowed: false, reason: 'This submission is already withdrawn. Only the owning lecturer can restore it.' }
  if (submission.reviewStatus !== 'Awaiting Review') return { allowed: false, reason: 'Lecturer review has started or a grade has been published. Student withdrawal is no longer available.' }
  const eligibility = submission.studentWithdrawal
  if (!eligibility?.allowed) return { allowed: false, reason: eligibility?.reason || 'Withdrawal availability could not be confirmed. Refresh your submissions.' }
  if (!(now < new Date(eligibility.deadline).getTime())) return { allowed: false, reason: 'The assignment deadline has passed. Student withdrawal is no longer available.' }
  return { allowed: true, reason: '' }
}
