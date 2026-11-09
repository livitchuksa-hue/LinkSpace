import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

export function renderMarkdown(source) {
  if (!source) return '';
  return md.render(String(source));
}

export function markdownPlainText(source, maxLength = 1200) {
  if (!source) return '';
  const html = renderMarkdown(String(source));
  const element = document.createElement('div');
  element.innerHTML = html;
  const text = (element.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
