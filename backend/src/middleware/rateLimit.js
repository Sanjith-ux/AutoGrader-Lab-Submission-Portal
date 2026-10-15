export function createRateLimiter({ windowMs, max, message, skipSuccessful = false }) {
  const clients = new Map()

  function prune(now) {
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key)
    }
  }

  return function rateLimiter(req, res, next) {
    const now = Date.now()
    if (clients.size > 1000) prune(now)

    const key = req.ip || 'unknown'
    let entry = clients.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      clients.set(key, entry)
    }

    if (entry.count >= max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
      res.status(429).json({ message })
      return
    }

    entry.count += 1
    if (skipSuccessful) {
      res.on('finish', () => {
        if (res.statusCode < 400 && entry.count > 0) entry.count -= 1
      })
    }
    next()
  }
}
