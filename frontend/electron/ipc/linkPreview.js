const { ipcMain } = require('electron');

const PAGE_TIMEOUT_MS = 8000;
const IMAGE_TIMEOUT_MS = 12000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseMetaTags(html) {
  const map = {};
  const re = /<meta\s+[^>]*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const key = (tag.match(/(?:property|name)=["']([^"']+)["']/i) || [])[1];
    const content = (tag.match(/content=["']([^"']*)["']/i) || [])[1];
    if (key && content != null && map[key] === undefined) {
      map[key.toLowerCase()] = decodeEntities(content).trim();
    }
  }
  return map;
}

function parseTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
}

function firstMeta(meta, keys) {
  for (const key of keys) {
    if (meta[key]) return meta[key];
  }
  return '';
}

function resolveUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return '';
  }
}

function parseFavicon(html, base) {
  const re = /<link\s+[^>]*>/gi;
  let match;
  let fallback = '';
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const rel = (tag.match(/rel=["']([^"']+)["']/i) || [])[1] || '';
    const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    const relLower = rel.toLowerCase();
    if (/\bicon\b/.test(relLower) || relLower === 'shortcut icon') {
      const resolved = resolveUrl(href, base);
      if (resolved) {
        if (/apple-touch-icon/.test(relLower)) return resolved;
        if (!fallback) fallback = resolved;
      }
    }
  }
  return fallback;
}

async function fetchText(url, timeoutMs, maxBytes) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Linkspace/0.1' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (maxBytes && Number(response.headers.get('content-length')) > maxBytes) {
    throw new Error('Response too large');
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxBytes) throw new Error('Response too large');
  return { text: Buffer.from(buffer).toString('utf8'), contentType, finalUrl: response.url || url };
}

async function fetchImageDataUrl(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Linkspace/0.1' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error('Not an image');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error('Image too large');
  return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
}

function registerLinkPreviewIpc() {
  ipcMain.handle('link:unfurl', async (_event, url) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return { ok: false, error: 'Некорректный URL' };
    }

    try {
      const { text: html, finalUrl } = await fetchText(url, PAGE_TIMEOUT_MS, MAX_HTML_BYTES);
      const meta = parseMetaTags(html);
      const pageUrl = finalUrl || url;
      const title = firstMeta(meta, ['og:title', 'twitter:title']) || parseTitle(html);
      const description = firstMeta(meta, ['og:description', 'twitter:description', 'description']);
      const imageHref = firstMeta(meta, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);
      const favicon = parseFavicon(html, pageUrl);

      let image = '';
      if (imageHref) {
        const imageUrl = resolveUrl(imageHref, pageUrl);
        if (imageUrl) {
          try {
            image = await fetchImageDataUrl(imageUrl);
          } catch {
            image = '';
          }
        }
      }

      return {
        ok: true,
        url: pageUrl,
        title: title.slice(0, 300),
        description: description.slice(0, 500),
        image,
        favicon,
      };
    } catch (error) {
      return { ok: false, error: error.message || 'Не удалось загрузить страницу' };
    }
  });
}

module.exports = { registerLinkPreviewIpc };
