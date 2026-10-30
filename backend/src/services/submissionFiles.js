import { randomUUID } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { fileTypeFromFile } from 'file-type'
import yauzl from 'yauzl'

export const uploadRoot = path.resolve(process.env.SUBMISSION_STORAGE_DIR || fileURLToPath(new URL('../../storage/submissions', import.meta.url)))
export const maxFiles = 20
export function submissionError(status, message, compliance) {
  return Object.assign(new Error(message), { status, compliance })
}

export async function removeUploadDirectory(directory) {
  // Only server-created attempt directories under our configured private root.
  if (directory && path.dirname(directory) === uploadRoot) await rm(directory, { recursive: true, force: true })
}

export async function receiveFiles(req, res, maxFileSizeMB) {
  const directory = path.join(uploadRoot, randomUUID())
  await mkdir(directory, { recursive: true, mode: 0o700 })
  req.uploadDirectory = directory
  const upload = multer({
    storage: multer.diskStorage({ destination: directory, filename: (_req, _file, done) => done(null, randomUUID()) }),
    limits: { fileSize: maxFileSizeMB * 1024 * 1024, files: maxFiles, fields: 1, fieldSize: 16 * 1024, parts: maxFiles + 1 },
  }).array('files', maxFiles)
  await new Promise((resolve, reject) => upload(req, res, (error) => {
    if (error && /Boundary not found|Unexpected end of (form|multipart data|file)|Malformed part header|Request aborted/i.test(error.message)) reject(submissionError(400, 'Invalid or incomplete multipart upload.'))
    else if (error) reject(error)
    else resolve()
  }))
  if (!req.files?.length) throw submissionError(400, 'Choose at least one file.')
}

function archiveEntries(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true, strictFileNames: true, validateEntrySizes: true }, (error, zip) => {
      if (error) return reject(submissionError(400, 'The ZIP or DOCX archive is invalid.'))
      const entries = new Set()
      let entryCount = 0
      let totalSize = 0
      zip.on('error', () => { zip.close(); reject(submissionError(400, 'The ZIP or DOCX archive is invalid.')) })
      zip.on('entry', (entry) => {
        totalSize += entry.uncompressedSize
        if (++entryCount > 10000 || totalSize > 500 * 1024 * 1024 || (entry.generalPurposeBitFlag & 1)) {
          zip.close()
          reject(submissionError(400, 'Archives must be unencrypted, contain at most 10,000 entries and expand to at most 500 MB.'))
          return
        }
        entries.add(entry.fileName)
        zip.readEntry()
      })
      zip.on('end', () => resolve(entries))
      zip.readEntry()
    })
  })
}

export async function inspectFile(file) {
  const originalName = path.posix.basename(file.originalname.replaceAll('\\', '/')).replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200)
  const extension = path.extname(originalName).slice(1).toLowerCase()
  let detected
  try { detected = await fileTypeFromFile(file.path) } catch { throw submissionError(400, 'The uploaded file is invalid or truncated.') }
  let type = { pdf: 'PDF', docx: 'DOCX', jpg: 'JPG', jpeg: 'JPG', png: 'PNG', zip: 'ZIP' }[detected?.ext]
  if (['zip', 'docx'].includes(detected?.ext)) {
    const entries = await archiveEntries(file.path)
    const isDocx = entries.has('[Content_Types].xml') && entries.has('word/document.xml')
    if (extension === 'docx' && isDocx) type = 'DOCX'
    else if (extension === 'docx') type = undefined
  }
  const extensionType = { pdf: 'PDF', docx: 'DOCX', jpg: 'JPG', jpeg: 'JPG', png: 'PNG', zip: 'ZIP' }[extension]
  if (!type || type !== extensionType || !file.size) throw submissionError(400, `File contents do not match a supported format: ${originalName || 'unnamed file'}.`)
  return { originalName, type, mimeType: { PDF: 'application/pdf', DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', JPG: 'image/jpeg', PNG: 'image/png', ZIP: 'application/zip' }[type], size: file.size, storagePath: path.relative(uploadRoot, file.path) }
}

export function checkCompliance(assignment, files, submittedAt) {
  const onTime = submittedAt <= assignment.deadline
  const labels = new Set(files.map((file) => file.attachment.toLowerCase().trim()))
  const missing = assignment.requiredFiles.filter((name) => !labels.has(name.toLowerCase().trim()))
  const checks = {
    deadline: { passed: onTime, message: onTime ? 'Submitted on or before the deadline.' : 'Submitted after the deadline; marked late.' },
    fileType: { passed: files.every((file) => assignment.allowedFileTypes.includes(file.type)), message: `Accepted formats: ${assignment.allowedFileTypes.join(', ')}. File contents and extensions were checked.` },
    fileSize: { passed: files.every((file) => file.size <= assignment.maxFileSizeMB * 1024 * 1024), message: `Maximum ${assignment.maxFileSizeMB} MB per file.` },
    requiredFiles: { passed: missing.length === 0, message: missing.length ? `Missing attachments: ${missing.join(', ')}.` : 'All required attachment labels are present.' },
  }
  return { passed: Object.values(checks).every((check) => check.passed), checks }
}
