function normalizeOptionalEmail(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

module.exports = { normalizeOptionalEmail };
