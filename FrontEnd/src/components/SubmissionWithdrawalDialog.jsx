import { useEffect, useRef, useState } from 'react'
import { changeSubmissionWithdrawal } from '../api/submissions'

export default function SubmissionWithdrawalDialog({ submission, action, onClose, onComplete, studentInitiated = false }) {
  const dialogRef = useRef(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const withdrawing = action === 'withdraw'
  useEffect(() => { dialogRef.current.showModal() }, [])

  async function confirm(event) {
    event.preventDefault()
    if (busy) return
    if (reason.trim().length < 5 || reason.trim().length > 1000) { setError('Provide a reason of 5 to 1000 characters.'); return }
    setBusy(true)
    setError('')
    try {
      onComplete(await changeSubmissionWithdrawal(submission.id, action, reason.trim()))
      onClose()
    } catch (error) { setError(error.message); setBusy(false) }
  }

  return <dialog className="submission-withdrawal-dialog" ref={dialogRef} aria-labelledby="withdrawal-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <form onSubmit={confirm} noValidate>
      <h2 id="withdrawal-dialog-title">{withdrawing ? 'Withdraw' : 'Restore'} submission?</h2>
      <p>{submission.student} · {submission.assignment}</p>
      <p>{withdrawing ? `This removes the attempt from active submission counts and grading queues. It will be marked Withdrawn. Uploaded files, marks, feedback and academic history are retained. This does not allow the assignment to be permanently deleted. ${studentInitiated ? 'Only the owning lecturer can restore the attempt. Withdrawing does not extend the deadline or submit replacement work.' : 'You can restore the attempt later.'}` : 'This returns the attempt to active submissions with its original files, marks and review status. Existing published marks will count again. The withdrawal and this restoration remain in the audit history.'}</p>
      <div className="field-group"><label htmlFor="withdrawal-reason">{withdrawing ? 'Withdrawal' : 'Restoration'} reason</label><textarea id="withdrawal-reason" rows="4" maxLength={1000} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} aria-invalid={Boolean(error)} /></div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="review-actions"><button className="secondary-action-button" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="primary-action-button" type="submit" disabled={busy}>{busy ? 'Saving…' : withdrawing ? 'Confirm withdrawal' : 'Confirm restoration'}</button></div>
    </form>
  </dialog>
}
