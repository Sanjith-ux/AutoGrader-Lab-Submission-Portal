import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RoleSelector from '../components/RoleSelector'
import { useAuth } from '../auth/useAuth.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '', form: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Enter your name.'
    if (!form.email.trim()) nextErrors.email = 'Enter your university email address.'
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!form.password) nextErrors.password = 'Create a password.'
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.'
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, role })
      navigate('/', { state: { registrationSuccess: 'Your account was created. Sign in to continue.' } })
    } catch (error) {
      setErrors({ form: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="welcome-panel" aria-label="LabTrack introduction">
        <div className="brand-mark"><span>LT</span></div>
        <p className="eyebrow">Laboratory management, made clear</p>
        <h1>Start your<br />lab journey.</h1>
        <p className="welcome-copy">Create your LabTrack account to keep schedules, submissions, attendance, and feedback within reach.</p>
        <div className="welcome-note"><span className="note-dot" aria-hidden="true" />Built for focused lab days</div>
      </section>
      <section className="form-panel">
        <div className="form-wrapper">
          <div className="mobile-brand"><div className="brand-mark"><span>LT</span></div><strong>LabTrack</strong></div>
          <div className="form-heading"><p className="eyebrow">Create your account</p><h2>Join your portal</h2><p>Use your university details to get started.</p></div>
          {errors.form && <p className="auth-error" role="alert">{errors.form}</p>}
          <form onSubmit={handleSubmit} noValidate>
            <RoleSelector role={role} onChange={setRole} />
            <div className="field-group"><label htmlFor="name">Full name</label><input id="name" name="name" value={form.name} onChange={handleChange} autoComplete="name" aria-invalid={Boolean(errors.name)} />{errors.name && <p className="field-error">{errors.name}</p>}</div>
            <div className="field-group"><label htmlFor="email">University email</label><input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@university.edu" autoComplete="email" aria-invalid={Boolean(errors.email)} />{errors.email && <p className="field-error">{errors.email}</p>}</div>
            <div className="field-group"><label htmlFor="password">Password</label><input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" aria-invalid={Boolean(errors.password)} />{errors.password && <p className="field-error">{errors.password}</p>}</div>
            <div className="field-group"><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} />{errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}</div>
            <button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'} <span aria-hidden="true">→</span></button>
          </form>
          <p className="account-prompt">Already have an account? <Link to="/">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
