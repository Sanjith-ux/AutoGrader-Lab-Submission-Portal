import { API_BASE_URL } from './config.js'
const TOKEN_KEY = 'labtrack_token'

// Messages for statuses where the server text is less helpful than a clear instruction.
const statusMessages = {
  401: 'Your session has expired or is invalid. Please sign in again.',
  403: 'You do not have permission to do that.',
  429: 'Too many requests. Please wait a moment and try again.',
  503: 'The database is temporarily unavailable. Please try again shortly.',
}

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(localStorage.getItem(TOKEN_KEY) ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to connect to LabTrack. Check that the backend is running.')
  }

  if (response.ok && options.responseType === 'blob') return response.blob()
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.errors?.join(' ') || data.message
    const error = new Error(statusMessages[response.status] || detail || 'The request could not be completed.')
    error.status = response.status
    error.compliance = data.compliance
    throw error
  }
  return data
}
