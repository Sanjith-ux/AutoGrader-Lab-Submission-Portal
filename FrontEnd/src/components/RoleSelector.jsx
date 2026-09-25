function RoleSelector({ role, onChange }) {
  return (
    <fieldset className="role-selector">
      <legend>Sign in as</legend>
      <div className="role-options">
        <label className={role === 'student' ? 'role-option is-selected' : 'role-option'}>
          <input type="radio" name="role" value="student" checked={role === 'student'} onChange={(event) => onChange(event.target.value)} />
          <span>Student</span>
        </label>
        <label className={role === 'lecturer' ? 'role-option is-selected' : 'role-option'}>
          <input type="radio" name="role" value="lecturer" checked={role === 'lecturer'} onChange={(event) => onChange(event.target.value)} />
          <span>Lecturer</span>
        </label>
      </div>
    </fieldset>
  )
}

export default RoleSelector