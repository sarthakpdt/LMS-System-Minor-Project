/** Valid MongoDB ObjectId (24 hex chars). Rejects "undefined", "null", empty. */
export function isValidObjectId(id: unknown): boolean {
  if (id == null) return false;
  const s = String(id).trim();
  if (!s || s === 'undefined' || s === 'null') return false;
  return /^[a-f\d]{24}$/i.test(s);
}

export function resolveCourseId(source: {
  courseId?: unknown;
  _id?: unknown;
}): string | null {
  if (isValidObjectId(source.courseId)) return String(source.courseId).trim();
  if (isValidObjectId(source._id)) return String(source._id).trim();
  return null;
}
