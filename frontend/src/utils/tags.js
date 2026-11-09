export function parseTags(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return null;
  return JSON.stringify(tags.map((tag) => ({
    name: String(tag.name || '').trim(),
    color: tag.color || '#8f8f8f',
  })).filter((tag) => tag.name));
}

/** Реестр тегов: name (lowercase) -> { name, color } — первый встреченный цвет. */
export function tagRegistry(objects) {
  const registry = new Map();
  for (const object of objects || []) {
    for (const tag of parseTags(object.tags)) {
      const name = String(tag?.name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!registry.has(key)) {
        registry.set(key, { name, color: tag.color || '#8f8f8f' });
      }
    }
  }
  return [...registry.values()];
}

export function tagKey(name) {
  return String(name || '').trim().toLowerCase();
}
