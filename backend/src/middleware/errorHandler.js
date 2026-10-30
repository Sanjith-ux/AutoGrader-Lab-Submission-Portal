const databaseUnavailableNames = new Set([
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongoServerSelectionError',
  'MongooseServerSelectionError',
  'MongoNotConnectedError',
  'MongoTopologyClosedError',
])
const databaseUnavailableMessage = /buffering timed out|before initial connection|connection (is )?closed/i

function isDatabaseUnavailable(error) {
  return databaseUnavailableNames.has(error.name) || (error.name === 'MongooseError' && databaseUnavailableMessage.test(error.message))
}

export function notFound(req, res) {
  res.status(404).json({ message: 'The requested resource was not found.' })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error.name === 'MulterError') {
    const oversized = error.code === 'LIMIT_FILE_SIZE'
    res.status(oversized ? 413 : 400).json({ message: oversized ? 'A file exceeds the assignment size limit.' : 'Invalid upload. Use the files field, at most 20 files, and one attachments field.' })
    return
  }

  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Request body must be valid JSON.' })
    return
  }
  if (error.type === 'entity.too.large') {
    res.status(413).json({ message: 'Request body is too large.' })
    return
  }
  if (error.name === 'ValidationError' && error.errors) {
    res.status(400).json({ message: 'Validation failed.', errors: Object.values(error.errors).map((item) => item.message) })
    return
  }
  if (error.name === 'CastError') {
    res.status(400).json({ message: 'A provided identifier or value has an invalid format.' })
    return
  }
  if (error.code === 11000) {
    res.status(409).json({ message: 'A record with these details already exists.' })
    return
  }
  if (isDatabaseUnavailable(error)) {
    console.error(`Database unavailable: ${error.name}`)
    res.status(503).json({ message: 'The database is temporarily unavailable. Please try again shortly.' })
    return
  }
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    res.status(error.status).json({ message: error.message, ...(error.details ? { errors: error.details } : {}), ...(error.compliance ? { compliance: error.compliance } : {}) })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'An unexpected server error occurred.' })
}
