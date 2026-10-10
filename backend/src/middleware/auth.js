import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.')
  }
  return process.env.JWT_SECRET
}

export async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication token is required.' })
    return
  }

  const token = authorization.slice(7)
  let payload
  try {
    payload = jwt.verify(token, getJwtSecret())
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Authentication token has expired.' })
      return
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Authentication token is invalid.' })
      return
    }
    next(error)
    return
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    res.status(401).json({ message: 'User associated with this token no longer exists.' })
    return
  }

  req.user = user
  next()
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to access this resource.' })
      return
    }
    next()
  }
}
