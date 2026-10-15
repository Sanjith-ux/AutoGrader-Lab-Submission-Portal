const objectIdPattern = /^[0-9a-fA-F]{24}$/

export function isValidObjectId(value) {
  return typeof value === 'string' && objectIdPattern.test(value)
}
