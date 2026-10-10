import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const roles = ['student', 'lecturer']

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.')
  }
  return process.env.JWT_SECRET
}

function validateCredentials({ name, email, password, role }, includeName = true) {
  const errors = []
  if (includeName && (!name || !name.trim())) errors.push('Name is required.')
  if (!email || !email.trim()) errors.push('Email is required.')
  else if (!emailPattern.test(email.trim())) errors.push('Enter a valid email address.')
  if (!password) errors.push('Password is required.')
  else if (password.length < 8) errors.push('Password must be at least 8 characters.')
  if (includeName && !roles.includes(role)) errors.push('Role must be either student or lecturer.')
  return errors
}

function createToken(user) {
  return jwt.sign({ role: user.role }, getJwtSecret(), {
    subject: user._id.toString(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    const errors = validateCredentials({ name, email, password, role })
    if (errors.length) {
      res.status(400).json({ message: 'Validation failed.', errors })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      res.status(409).json({ message: 'An account with this email already exists.' })
      return
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role })
    res.status(201).json({ user: user.toSafeObject() })
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'An account with this email already exists.' })
      return
    }
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const errors = validateCredentials({ email, password }, false)
    if (errors.length) {
      res.status(400).json({ message: 'Validation failed.', errors })
      return
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password.' })
      return
    }

    res.json({ token: createToken(user), user: user.toSafeObject() })
  } catch (error) {
    next(error)
  }
})

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user.toSafeObject() })
})

export default router
