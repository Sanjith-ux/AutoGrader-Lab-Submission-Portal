const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

export function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGIN
  if (!configured) return defaultOrigins
  return configured.split(',').map((origin) => origin.trim()).filter(Boolean)
}

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cache-Control', 'no-store')
  next()
}
