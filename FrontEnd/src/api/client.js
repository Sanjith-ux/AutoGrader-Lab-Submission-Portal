const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
const TOKEN_KEY = 'labtrack_token'

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem(TOKEN_KEY) ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } : {}),
        ...options.headers,
      },
      ...options,
    })
  } catch {
    throw new Error('Unable to connect to LabTrack. Check that the backend is running.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.errors?.join(' ') || data.message || 'The request could not be completed.')
  }
  return data
}
