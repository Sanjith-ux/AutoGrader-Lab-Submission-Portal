import SubmissionWithdrawal from '../components/SubmissionWithdrawal'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StudentSidebar from '../components/StudentSidebar'
import { fetchAssignment } from '../api/assignments'
import { fetchSubmissions, uploadSubmission } from '../api/submissions'
import SubmissionChecks from '../components/SubmissionChecks'
import SubmissionFiles from '../components/SubmissionFiles'

function getExtension(fileName) {
  const extension = fileName.split('.').pop().toLowerCase()
  return extension === 'jpeg' ? 'jpg' : extension
}

function CheckRow({ label, state, children }) {
  return <div className={`submission-check ${state}`}><span className="check-symbol" aria-hidden="true">{state === 'pass' ? '✓' : state === 'error' ? '!' : 'i'}</span><div><strong>{label}</strong><p>{children}</p></div></div>
}

function AssignmentDetailsPage() {
  const { assignmentId } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [submission, setSubmission] = useState(null)
  const [labels, setLabels] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [rejectedCompliance, setRejectedCompliance] = useState(null)
  useEffect(() => {
    Promise.all([fetchAssignment(assignmentId), fetchSubmissions(assignmentId)]).then(([nextAssignment, submissions]) => {
      setAssignment(nextAssignment)
      setSubmission(submissions[0] || null)
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
    const missingRequiredTypes = assignment.requiredFiles.filter((label) => !labels.includes(label))

    return { hasFiles, invalidFiles, oversizedFiles, isLate, missingRequiredTypes }
  }, [assignment, selectedFiles, labels])
  const assignmentStatus = submission?.withdrawnAt ? 'Withdrawn' : submission ? 'Submitted' : 'Not submitted'

  const canSubmit = assignment?.status === 'Published' && checks.hasFiles && selectedFiles.length <= 20 && checks.invalidFiles.length === 0 && checks.oversizedFiles.length === 0 && (!checks.isLate || assignment.allowLateSubmissions) && !isUploading

  function handleFileChange(event) {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
    setLabels(files.map((file) => assignment.requiredFiles.find((label) => [file.name.toLowerCase(), file.name.replace(/\.[^.]+$/, '').toLowerCase()].includes(label.toLowerCase())) || (assignment.requiredFiles.length === 1 ? assignment.requiredFiles[0] : '')))
    setUploadError('')
    setRejectedCompliance(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    setIsUploading(true)
    setUploadError('')
    setRejectedCompliance(null)
    try {
      setSubmission(await uploadSubmission(assignmentId, selectedFiles, labels))
      setSelectedFiles([])
      setLabels([])
      event.target.reset()
    } catch (error) { setUploadError(error.message); setRejectedCompliance(error.compliance || null) } finally { setIsUploading(false) }
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
                <label className="upload-dropzone" htmlFor="assignment-files"><span className="upload-icon">↑</span><strong>Choose files to upload</strong><small>{assignment.allowedFileTypes.join(', ')} · up to {assignment.maxFileSize} MB each</small><input id="assignment-files" type="file" accept={assignment.allowedFileTypes.flatMap((type) => type === 'JPG' ? ['.jpg', '.jpeg'] : [`.${type.toLowerCase()}`]).join(',')} multiple disabled={isUploading} onChange={handleFileChange} /></label>
                {selectedFiles.length > 0 && <div className="selected-files" aria-label="Selected files">{selectedFiles.map((file, index) => <div className="selected-file" key={`${index}-${file.name}-${file.size}`}><span className="file-type">{getExtension(file.name).toUpperCase()}</span><span><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || 'File'}</small><label>Attachment requirement<select disabled={isUploading} value={labels[index] || ''} onChange={(event) => setLabels((current) => current.map((label, position) => position === index ? event.target.value : label))}><option value="">Supporting attachment</option>{assignment.requiredFiles.map((label) => <option key={label}>{label}</option>)}</select></label></span></div>)}</div>}
                <div className="automatic-checks"><div className="checks-heading"><h3>Automatic submission check</h3><span>Preview · server verifies on upload</span></div>
                  <CheckRow label="File selected" state={checks.hasFiles ? 'pass' : 'error'}>{checks.hasFiles ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected.` : 'Choose at least one file to continue.'}</CheckRow>
                  <CheckRow label="Allowed file type" state={!checks.hasFiles ? 'warning' : checks.invalidFiles.length ? 'error' : 'pass'}>{!checks.hasFiles ? 'Waiting for a file.' : checks.invalidFiles.length ? `Unsupported: ${checks.invalidFiles.map((file) => file.name).join(', ')}` : 'All selected file types are supported.'}</CheckRow>
                  <CheckRow label="File size limit" state={!checks.hasFiles ? 'warning' : checks.oversizedFiles.length ? 'error' : 'pass'}>{!checks.hasFiles ? `Files must be ${assignment.maxFileSize} MB or smaller.` : checks.oversizedFiles.length ? `One or more files exceed ${assignment.maxFileSize} MB.` : `All selected files are within ${assignment.maxFileSize} MB.`}</CheckRow>
                  <CheckRow label="Submission deadline" state={checks.isLate ? 'warning' : 'pass'}>{checks.isLate ? 'This assignment deadline has passed. Your submission would be late.' : 'This submission is before the deadline.'}</CheckRow>
                  <CheckRow label="Required attachments" state={!checks.hasFiles ? 'warning' : checks.missingRequiredTypes.length ? 'warning' : 'pass'}>{!checks.hasFiles ? `Required: ${assignment.requiredFiles.join(', ')}.` : checks.missingRequiredTypes.length ? `Still needed: ${checks.missingRequiredTypes.join(', ')}.` : 'All required attachment labels are included.'}</CheckRow>
                </div>
                {checks.missingRequiredTypes.length > 0 && checks.hasFiles && <p className="review-message">You may submit, but missing attachment labels will be recorded as a failed requirement check.</p>}
                {selectedFiles.length > 20 && <p className="field-error">Upload at most 20 files per attempt.</p>}
                {checks.isLate && !assignment.allowLateSubmissions && <p className="field-error">Late submissions are not allowed for this assignment.</p>}
                {assignment.status !== 'Published' && <p className="field-error">This assignment is closed for submissions.</p>}
                {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
                {rejectedCompliance && <SubmissionChecks compliance={rejectedCompliance} />}
                {submission && <div className="detail-block"><p className="submission-success" role="status">Submission saved on {new Date(submission.submittedAt).toLocaleString()}. {submission.timing}. {submission.reviewStatus}.</p><SubmissionWithdrawal submission={submission} /><SubmissionFiles submission={submission} /><SubmissionChecks compliance={submission.compliance} /><Link to="/student/submissions">View submission history and feedback</Link></div>}
                <button className="submit-button" type="submit" disabled={!canSubmit}>{isUploading ? 'Uploading…' : submission ? 'Submit another attempt' : 'Submit assignment'} <span aria-hidden="true">→</span></button>
              </form>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AssignmentDetailsPage
