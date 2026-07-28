/**
 * Build a parameterized SET clause from an allowlisted set of column names.
 * Never interpolate Object.keys(req.body) into SQL.
 */
function pickAllowlistedFields(body, allowedColumns) {
  const fields = [];
  const values = [];
  for (const key of allowedColumns) {
    if (body && Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      fields.push(key);
      values.push(body[key]);
    }
  }
  return { fields, values };
}

function buildParameterizedSet(fields, startIndex = 2) {
  return fields.map((f, i) => `${f} = $${i + startIndex}`).join(', ');
}

module.exports = { pickAllowlistedFields, buildParameterizedSet };
