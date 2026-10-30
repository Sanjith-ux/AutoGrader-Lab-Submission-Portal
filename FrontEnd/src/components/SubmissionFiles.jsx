import { useState } from 'react'
import { downloadFile } from '../api/submissions'

export default function SubmissionFiles({ submission }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function download(file) {
    setError('')
    setBusy(true)
    try { await downloadFile(submission.id, file) } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <div>{submission.files.map((file) => <div className="uploaded-file" key={file._id}><span><strong>{file.originalName}</strong><small>{file.attachment || 'Supporting attachment'} · {file.type} · {(file.size / 1024 / 1024).toFixed(2)} MB</small></span><button className="secondary-action-button" type="button" disabled={busy} onClick={() => download(file)}>Download</button></div>)}{error && <p className="field-error" role="alert">{error}</p>}</div>
}
