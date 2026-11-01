export default function SubmissionWithdrawal({ submission, audit = false }) {
  return <>
    {submission.withdrawnAt && <div className="review-message missing-message" role="note"><strong>Withdrawn submission</strong><p>{submission.withdrawalReason}</p><p>{new Date(submission.withdrawnAt).toLocaleString()} · {submission.withdrawnBy?.name || 'Account holder'}</p><p>This attempt is retained as history. Its files and any published marks remain available, but it is excluded from active grading and grade summaries.</p></div>}
    {audit && submission.withdrawalHistory?.length > 0 && <div className="detail-block"><h4>Withdrawal audit history</h4><ul className="required-files">{submission.withdrawalHistory.map((event, index) => <li key={event._id || index}>{event.action} · {new Date(event.at).toLocaleString()} · {event.actor?.name || 'Lecturer'}: {event.reason}</li>)}</ul></div>}
  </>
}
