/**
 * Maps raw MongoDB / Mongoose errors to user-friendly messages.
 */
function mapMongoError(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';

  if (err.name === 'ValidationError') {
    const fields = Object.values(err.errors || {}).map((e) => e.message);
    if (fields.length) return `Invalid data: ${fields.join('; ')}`;
    return 'Invalid data provided. Please check your inputs.';
  }

  if (err.code === 11000) {
    const keyPattern = err.keyPattern || {};
    const keyValue = err.keyValue || {};

    if (keyPattern._id || keyValue._id) {
      return 'Configuration already exists. Please refresh the page and try saving again.';
    }
    if (keyPattern.code || (keyValue.code && keyValue.branch)) {
      const code = keyValue.code || 'this code';
      return `A course with code "${code}" already exists for this branch and year.`;
    }
    return 'This record already exists. Please use a unique value or edit the existing entry.';
  }

  if (err.name === 'CastError') {
    return 'Invalid identifier provided. Please refresh and try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

function mongoErrorStatus(err) {
  if (err?.code === 11000) return 409;
  if (err?.name === 'ValidationError' || err?.name === 'CastError') return 400;
  return 500;
}

module.exports = { mapMongoError, mongoErrorStatus };
