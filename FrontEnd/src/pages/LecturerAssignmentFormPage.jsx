import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LecturerSidebar from '../components/LecturerSidebar'
import { createAssignmentRequest, fetchAssignment, updateAssignmentRequest } from '../api/assignments'

const fileTypes = ['PDF', 'DOCX', 'JPG', 'PNG', 'ZIP']
const emptyForm = { status: 'Draft', title: '', subject: '', description: '', deadline: '', totalMarks: '', submissionRequirements: '', allowedFileTypes: ['PDF'], requiredFiles: '', maxFileSize: '10', allowLateSubmissions: true }

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function LecturerAssignmentFormPage({ edit = false }) {
  const navigate = useNavigate()
  const { assignmentId } = useParams()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(edit)
  const [isSaving, setIsSaving] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const isDraft = !edit || form.status === 'Draft'

  useEffect(() => {
    if (!edit) return undefined
    fetchAssignment(assignmentId)
      .then((assignment) => setForm({ ...assignment, deadline: toDateTimeLocal(assignment.deadline), subject: assignment.module || assignment.subject, maxFileSize: assignment.maxFileSizeMB || assignment.maxFileSize, allowLateSubmissions: assignment.lateSubmissionAllowed ?? assignment.allowLateSubmissions, requiredFiles: Array.isArray(assignment.requiredFiles) ? assignment.requiredFiles.join(', ') : assignment.requiredFiles }))
      .catch((error) => { setRequestError(error.message); setLoadFailed(true) })
      .finally(() => setIsLoading(false))
    return undefined
  }, [edit, assignmentId])

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function toggleFileType(type) {
    setForm((current) => ({ ...current, allowedFileTypes: current.allowedFileTypes.includes(type) ? current.allowedFileTypes.filter((item) => item !== type) : [...current.allowedFileTypes, type] }))
    setErrors((current) => ({ ...current, allowedFileTypes: '' }))
  }

  function validate() {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Enter an assignment title.'
    else if (form.title.trim().length > 150) nextErrors.title = 'Keep the title to 150 characters or fewer.'
    if (!form.subject.trim()) nextErrors.subject = 'Enter the lab subject.'
    else if (form.subject.trim().length > 100) nextErrors.subject = 'Keep the subject to 100 characters or fewer.'
    if (!form.description.trim()) nextErrors.description = 'Add the assignment instructions.'
    else if (form.description.trim().length > 5000) nextErrors.description = 'Keep the instructions to 5000 characters or fewer.'
    if (!form.deadline) nextErrors.deadline = 'Choose a deadline.'
    else if (Number.isNaN(new Date(form.deadline).getTime())) nextErrors.deadline = 'Enter a valid deadline.'
    if (!form.totalMarks || !Number.isInteger(Number(form.totalMarks)) || Number(form.totalMarks) < 1 || Number(form.totalMarks) > 1000) nextErrors.totalMarks = 'Enter total marks as a whole number from 1 to 1000.'
    if (!form.submissionRequirements.trim()) nextErrors.submissionRequirements = 'Describe what students must submit.'
    if (!form.requiredFiles.trim()) nextErrors.requiredFiles = 'List the required files.'
    if (form.requiredFiles.split(',').every((item) => !item.trim())) nextErrors.requiredFiles = 'List the required files.'
    if (form.allowedFileTypes.length === 0) nextErrors.allowedFileTypes = 'Select at least one allowed file type.'
    return nextErrors
  }

  function save(status) {
    if (isSaving) return
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    const assignment = { ...form, status }
    setIsSaving(true)
    const request = edit ? updateAssignmentRequest(assignmentId, assignment) : createAssignmentRequest(assignment)
    const message = status === 'Draft' ? 'Draft saved successfully.' : edit && form.status === status ? 'Assignment updated successfully.' : 'Assignment published successfully.'
    request.then(() => navigate('/lecturer/assignments', { state: { message } })).catch((error) => setRequestError(error.message)).finally(() => setIsSaving(false))
  }

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>{edit ? 'Edit Assignment' : 'Create Assignment'}</h1><p className="student-header-copy">{edit ? 'Update the assignment details and publish changes for your students.' : 'Set up a clear laboratory task with requirements students can follow.'}</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>
        <div className="student-content lecturer-content">
          {isLoading ? <p className="empty-state">Loading assignment…</p> : loadFailed ? <div className="empty-state lecturer-empty"><strong>Unable to load this assignment</strong><p role="alert">{requestError}</p><button className="secondary-action-button" type="button" onClick={() => navigate('/lecturer/assignments')}>Back to assignments</button></div> : <form className="lecturer-assignment-form" onSubmit={(event) => event.preventDefault()} noValidate>
            {requestError && <p className="field-error" role="alert">{requestError}</p>}
            <section className="lecturer-form-panel"><div className="section-heading"><div><p className="eyebrow">Assignment details</p><h2>What are students working on?</h2></div></div><div className="form-grid"><div className="field-group"><label htmlFor="title">Assignment title</label><input id="title" name="title" value={form.title} onChange={updateField} aria-invalid={Boolean(errors.title)} />{errors.title && <p className="field-error">{errors.title}</p>}</div><div className="field-group"><label htmlFor="subject">Lab subject</label><input id="subject" name="subject" value={form.subject} onChange={updateField} aria-invalid={Boolean(errors.subject)} />{errors.subject && <p className="field-error">{errors.subject}</p>}</div></div><div className="field-group"><label htmlFor="description">Description and instructions</label><textarea id="description" name="description" rows="5" value={form.description} onChange={updateField} aria-invalid={Boolean(errors.description)} />{errors.description && <p className="field-error">{errors.description}</p>}</div></section>

            <section className="lecturer-form-panel"><div className="section-heading"><div><p className="eyebrow">Schedule and marks</p><h2>Set the assessment parameters</h2></div></div><div className="form-grid"><div className="field-group"><label htmlFor="deadline">Deadline</label><input id="deadline" name="deadline" type="datetime-local" value={form.deadline} onChange={updateField} aria-invalid={Boolean(errors.deadline)} />{errors.deadline && <p className="field-error">{errors.deadline}</p>}</div><div className="field-group"><label htmlFor="totalMarks">Total marks</label><input id="totalMarks" name="totalMarks" type="number" min="1" value={form.totalMarks} onChange={updateField} aria-invalid={Boolean(errors.totalMarks)} />{errors.totalMarks && <p className="field-error">{errors.totalMarks}</p>}</div></div><div className="field-group"><label htmlFor="submissionRequirements">Submission requirements</label><textarea id="submissionRequirements" name="submissionRequirements" rows="3" value={form.submissionRequirements} onChange={updateField} aria-invalid={Boolean(errors.submissionRequirements)} />{errors.submissionRequirements && <p className="field-error">{errors.submissionRequirements}</p>}</div></section>

            <section className="lecturer-form-panel"><div className="section-heading"><div><p className="eyebrow">File requirements</p><h2>Control student submissions</h2></div></div><fieldset className="file-type-options"><legend>Allowed file types</legend><div className="file-type-grid">{fileTypes.map((type) => <label className="file-type-option" key={type}><input type="checkbox" checked={form.allowedFileTypes.includes(type)} onChange={() => toggleFileType(type)} />{type}</label>)}</div>{errors.allowedFileTypes && <p className="field-error">{errors.allowedFileTypes}</p>}</fieldset><div className="form-grid"><div className="field-group"><label htmlFor="requiredFiles">Required files</label><input id="requiredFiles" name="requiredFiles" value={form.requiredFiles} onChange={updateField} placeholder="e.g. Report and source files" aria-invalid={Boolean(errors.requiredFiles)} />{errors.requiredFiles && <p className="field-error">{errors.requiredFiles}</p>}</div><div className="field-group"><label htmlFor="maxFileSize">Maximum file size per file</label><select id="maxFileSize" name="maxFileSize" value={form.maxFileSize} onChange={updateField}><option value="5">5 MB</option><option value="10">10 MB</option><option value="20">20 MB</option><option value="50">50 MB</option></select></div></div><label className="toggle-option"><input type="checkbox" name="allowLateSubmissions" checked={form.allowLateSubmissions} onChange={updateField} /><span><strong>Allow late submissions</strong><small>Students can submit after the deadline and the submission will be marked late.</small></span></label></section>

            <div className="form-actions"><button className="secondary-action-button" type="button" onClick={() => navigate('/lecturer/assignments')} disabled={isSaving}>Cancel</button><div>{isDraft && <button className="secondary-action-button" type="button" onClick={() => save('Draft')} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save as Draft'}</button>}<button className="primary-action-button" type="button" onClick={() => save(isDraft ? 'Published' : form.status)} disabled={isSaving}>{isSaving ? 'Saving…' : isDraft ? 'Publish Assignment' : 'Update Assignment'} <span aria-hidden="true">→</span></button></div></div>
          </form>}
        </div>
      </section>
    </main>
  )
}

export default LecturerAssignmentFormPage
