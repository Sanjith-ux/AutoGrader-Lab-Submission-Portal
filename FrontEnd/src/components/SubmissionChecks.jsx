export default function SubmissionChecks({ compliance }) {
  const labels = { deadline: 'Deadline', fileType: 'Accepted format', fileSize: 'File size', requiredFiles: 'Required attachments' }
  return <div className="automatic-checks">{Object.entries(compliance.checks).map(([key, check]) => <div className={`submission-check ${check.passed ? 'pass' : 'error'}`} key={key}><span className="check-symbol" aria-hidden="true">{check.passed ? '✓' : '!'}</span><div><strong>{labels[key]}: {check.passed ? 'Pass' : 'Fail'}</strong><p>{check.message}</p></div></div>)}</div>
}
