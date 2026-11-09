const FILE_COLORS = {
  image: { bg: '#fbcfe8', fg: '#9d174d', border: '#f9a8d4' },
  audio: { bg: '#ddd6fe', fg: '#5b21b6', border: '#c4b5fd' },
  video: { bg: '#fecaca', fg: '#991b1b', border: '#fca5a5' },
  archive: { bg: '#fef9c3', fg: '#854d0e', border: '#fde047' },
  code: { bg: '#a5f3fc', fg: '#155e75', border: '#67e8f9' },
  document: { bg: '#fde68a', fg: '#78350f', border: '#fcd34d' },
  data: { bg: '#bbf7d0', fg: '#14532d', border: '#86efac' },
  default: { bg: '#e2e8f0', fg: '#334155', border: '#cbd5e1' },
};

const EXTENSION_GROUPS = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif', 'avif'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  video: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  code: ['js', 'jsx', 'ts', 'tsx', 'vue', 'java', 'py', 'html', 'htm', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'sql', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'php', 'rb'],
  document: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'ppt', 'pptx'],
  data: ['csv', 'xls', 'xlsx', 'ods', 'db', 'sqlite'],
};

const TYPE_APPEARANCE = {
  NOTE: { bg: '#e0e7ff', fg: '#3730a3', border: '#c7d2fe' },
  FOLDER: { bg: '#fef3c7', fg: '#92400e', border: '#fde68a' },
  LINK: { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
};

export function normalizeHex(color) {
  if (typeof color !== 'string') return null;
  const value = color.trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

export function readableOn(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return '#1f2937';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#1f2937' : '#ffffff';
}

function fileExtension(name) {
  if (!name) return '';
  const clean = String(name).split(/[\\/]/).pop() || '';
  const index = clean.lastIndexOf('.');
  if (index <= 0 || index === clean.length - 1) return '';
  return clean.slice(index + 1).toLowerCase();
}

function fileAppearance(path, title) {
  const extension = fileExtension(path || title);
  for (const [group, extensions] of Object.entries(EXTENSION_GROUPS)) {
    if (extensions.includes(extension)) {
      return FILE_COLORS[group];
    }
  }
  return FILE_COLORS.default;
}

export function isImageNode(node) {
  if (node?.type !== 'FILE') return false;
  const extension = fileExtension(node.path || node.title);
  return EXTENSION_GROUPS.image.includes(extension);
}

export function nodeAppearance(node) {
  const custom = normalizeHex(node?.color);
  if (custom) {
    return { bg: custom, fg: readableOn(custom), border: custom };
  }
  if (node?.type === 'FILE') {
    return fileAppearance(node.path, node.title);
  }
  return TYPE_APPEARANCE[node?.type] || TYPE_APPEARANCE.NOTE;
}
