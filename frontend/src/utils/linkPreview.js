export function parseLinkPreview(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      image: typeof parsed.image === 'string' ? parsed.image : '',
      favicon: typeof parsed.favicon === 'string' ? parsed.favicon : '',
    };
  } catch {
    return null;
  }
}

export function serializeLinkPreview(data) {
  if (!data) return null;
  const preview = {
    title: (data.title || '').slice(0, 300),
    description: (data.description || '').slice(0, 500),
    image: data.image || '',
    favicon: data.favicon || '',
  };
  if (!preview.title && !preview.description && !preview.image) return null;
  return JSON.stringify(preview);
}

export function linkDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
