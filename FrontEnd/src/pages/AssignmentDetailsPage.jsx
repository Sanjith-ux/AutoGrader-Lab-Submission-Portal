import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StudentSidebar from '../components/StudentSidebar'
import { fetchAssignment } from '../api/assignments'
import { getAssignmentStatus, setAssignmentStatus } from '../data/assignments'

function getExtension(fileName) {
  return fileName.split('.').pop().toLowerCase()
}

function CheckRow({ label, state, children }) {
  return <div className={`submission-check ${state}`}><span className="check-symbol" aria-hidden="true">{state === 'pass' ? '✓' : state === 'error' ? '!' : 'i'}</span><div><strong>{label}</strong><p>{children}</p></div></div>
}

function AssignmentDetailsPage() {
  const { assignmentId } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    fetchAssignment(assignmentId).then((nextAssignment) => {
      setAssignment(nextAssignment)
      setSubmitted(getAssignmentStatus(nextAssignment.id) === 'Submitted')
    }).catch((requestError) => setError(requestError.message))
  }, [assignmentId])

  const checks = useMemo(() => {
    if (!assignment) return { hasFiles: false, invalidFiles: [], oversizedFiles: [], isLate: false, missingRequiredTypes: [] }
    const hasFiles = selectedFiles.length > 0
    const allowedExtensions = assignment.allowedFileTypes.map((type) => type.toLowerCase())
    const maxFileSize = assignment.maxFileSize * 1024 * 1024
    const invalidFiles = selectedFiles.filter((file) => !allowedExtensions.includes(getExtension(file.name)))
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxFileSize)
    const isLate = new Date() > new Date(assignment.dueDateTime)
    const selectedExtensions = new Set(selectedFiles.map((file) => getExtension(file.name)))
    const missingRequiredTypes = assignment.requiredExtensions.filter((extension) => !selectedExtensions.has(extension))

    return { hasFiles, invalidFiles, oversizedFiles, isLate, missingRequiredTypes }
  }, [assignment, selectedFiles])
  const assignmentStatus = submitted ? 'Submitted' : 'Not submitted'

  const canSubmit = checks.hasFiles && checks.invalidFiles.length === 0 && checks.oversizedFiles.length === 0 && checks.missingRequiredTypes.length === 0 && !checks.isLate

  function handleFileChange(event) {
    setSelectedFiles(Array.from(event.target.files || []))
    setSubmitted(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    setAssignmentStatus(assignment.id, 'Submitted')
    setSubmitted(true)
  }

  if (error) return <main className="student-dashboard"><StudentSidebar /><section className="student-main"><div className="student-content"><p className="field-error" role="alert">{error}</p></div></section></main>
  if (!assignment) return <main className="student-dashboard"><StudentSidebar /><section className="student-main"><div className="student-content"><p className="empty-state">Loading assignment…</p></div></section></main>

  return (
    <main className="student-dashboard">
      <StudentSidebar />
      <section className="student-main assignment-details-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Student workspace</p><h1>Assignment details</h1><p className="student-header-copy">Review the brief and upload your work when it is ready.</p></div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>
        <div className="student-content assignment-details-content">
          <Link className="back-link assignment-back" to="/student/assignments">← Back to assignments</Link>
          <div className="assignment-detail-grid">
            <section className="assignment-brief">
              <p className="assignment-subject">{assignment.subject}</p>
              <h2>{assignment.title}</h2>
              <div className="brief-meta"><span><strong>Due</strong>{assignment.dueDate}</span><span><strong>Marks</strong>{assignment.marks}</span></div>
              <div className="detail-block"><h3>Instructions</h3><p>{assignment.instructions}</p></div>
              <div className="detail-block"><h3>Required files</h3><ul className="required-files">{assignment.requiredFiles.map((file) => <li key={file}>{file}</li>)}</ul></div>
            </section>

            <section className="submission-panel">
              <div className="section-heading"><div><p className="eyebrow">Your work</p><h2>Submit assignment</h2></div><span className={`assignment-status ${assignmentStatus.toLowerCase().replace(' ', '-')}`}>{assignmentStatus}</span></div>
              <form onSubmit={handleSubmit}>
                <label className="upload-dropzone" htmlFor="assignment-files"><span className="upload-icon">↑</span><strong>Choose files to upload</strong><small>{assignment.allowedFileTypes.join(', ')} · up to {assignment.maxFileSize} MB each</small><input id="assignment-files" type="file" accept={assignment.allowedFileTypes.map((type) => `.${type.toLowerCase()}`).join(',')} multiple onChange={handleFileChange} /></label>
                {selectedFiles.length > 0 && <div className="selected-files" aria-label="Selected files">{selectedFiles.map((file) => <div className="selected-file" key={`${file.name}-${file.size}`}><span className="file-type">{getExtension(file.name).toUpperCase()}</span><span><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || 'File'}</small></span></div>)}</div>}
                <div className="automatic-checks"><div className="checks-heading"><h3>Automatic submission check</h3><span>Live</span></div>
                  <CheckRow label="File selected" state={checks.hasFiles ? 'pass' : 'error'}>{checks.hasFiles ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected.` : 'Choose at least one file to continue.'}</CheckRow>
                  <CheckRow label="Allowed file type" state={!checks.hasFiles ? 'warning' : checks.invalidFiles.length ? 'error' : 'pass'}>{!checks.hasFiles ? 'Waiting for a file.' : checks.invalidFiles.length ? `Unsupported: ${checks.invalidFiles.map((file) => file.name).join(', ')}` : 'All selected file types are supported.'}</CheckRow>
                  <CheckRow label="File size limit" state={!checks.hasFiles ? 'warning' : checks.oversizedFiles.length ? 'error' : 'pass'}>{!checks.hasFiles ? `Files must be ${assignment.maxFileSize} MB or smaller.` : checks.oversizedFiles.length ? `One or more files exceed ${assignment.maxFileSize} MB.` : `All selected files are within ${assignment.maxFileSize} MB.`}</CheckRow>
                  <CheckRow label="Submission deadline" state={checks.isLate ? 'warning' : 'pass'}>{checks.isLate ? 'This assignment deadline has passed. Your submission would be late.' : 'This submission is before the deadline.'}</CheckRow>
                  <CheckRow label="Required file types" state={!checks.hasFiles ? 'warning' : checks.missingRequiredTypes.length ? 'warning' : 'pass'}>{!checks.hasFiles ? `Required: ${assignment.requiredFiles.join(', ')}.` : checks.missingRequiredTypes.length ? `Still needed: ${checks.missingRequiredTypes.join(', ')}.` : 'All required file types are included.'}</CheckRow>
                </div>
                {submitted && <p className="submission-success" role="status">Submission received. Your assignment status is now Submitted for this session.</p>}
                <button className="submit-button" type="submit" disabled={!canSubmit}>{submitted ? 'Submitted' : 'Submit assignment'} <span aria-hidden="true">→</span></button>
              </form>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AssignmentDetailsPage