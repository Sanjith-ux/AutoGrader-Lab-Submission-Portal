import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RoleSelector from '../components/RoleSelector'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}

    if (!form.email.trim()) nextErrors.email = 'Enter your university email address.'
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!form.password) nextErrors.password = 'Enter your password.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) navigate(role === 'student' ? '/student-dashboard' : '/lecturer-dashboard')
  }

  return (
    <main className="auth-layout">
      <section className="welcome-panel" aria-label="LabTrack introduction">
        <div className="brand-mark"><span>LT</span></div>
        <p className="eyebrow">Laboratory management, made clear</p>
        <h1>Keep every lab<br />within reach.</h1>
        <p className="welcome-copy">One calm place for schedules, submissions, attendance, and the feedback that moves your work forward.</p>
        <div className="welcome-note"><span className="note-dot" aria-hidden="true" />Built for focused lab days</div>
      </section>

      <section className="form-panel">
        <div className="form-wrapper">
          <div className="mobile-brand"><div className="brand-mark"><span>LT</span></div><strong>LabTrack</strong></div>
          <div className="form-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to your portal</h2>
            <p>Access your lab schedule, submissions, attendance, and feedback.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <RoleSelector role={role} onChange={setRole} />
            <div className="field-group">
              <label htmlFor="email">University email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@university.edu" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
              {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
            </div>
            <div className="field-group">
              <div className="label-row"><label htmlFor="password">Password</label><a href="#forgot-password" className="text-link">Forgot password?</a></div>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
              {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
            </div>
            <button className="submit-button" type="submit">Sign in <span aria-hidden="true">→</span></button>
          </form>

          {role === 'student' && <p className="account-prompt">New to LabTrack? <Link to="#create-account">Create an account</Link></p>}
          <p className="form-footer">By continuing, you agree to your university&apos;s portal policies.</p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage