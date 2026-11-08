const OBJECT_TYPES = new Set(['NOTE', 'FILE', 'FOLDER', 'LINK']);

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidObjectType(type) {
  return OBJECT_TYPES.has(type);
}

export function validateObjectPayload(payload) {
  if (!payload || !isNonEmptyString(payload.title)) {
    return 'Название объекта обязательно';
  }
  if (!isValidObjectType(payload.type)) {
    return 'Некорректный тип объекта';
  }
  return null;
}
