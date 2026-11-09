export const NODE_WIDTH = 196;
export const NODE_HEIGHT = 112;

export function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function nodeCenter(node) {
  const width = Number(node?.width) || NODE_WIDTH;
  const height = Number(node?.height) || NODE_HEIGHT;
  return {
    x: (node?.x || 0) + width / 2,
    y: (node?.y || 0) + height / 2,
  };
}

export function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function catmullRomSegment(p0, p1, p2, p3) {
  const c1x = p1.x + (p2.x - p0.x) / 6;
  const c1y = p1.y + (p2.y - p0.y) / 6;
  const c2x = p2.x - (p3.x - p1.x) / 6;
  const c2y = p2.y - (p3.y - p1.y) / 6;
  return `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
}

export function smoothClosedPath(points) {
  if (!Array.isArray(points) || points.length < 3) return '';
  const count = points.length;
  const at = (index) => points[((index % count) + count) % count];
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < count; i += 1) {
    d += ` ${catmullRomSegment(at(i - 1), at(i), at(i + 1), at(i + 2))}`;
  }
  return `${d} Z`;
}

export function smoothOpenPath(points) {
  if (!Array.isArray(points) || !points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  const count = points.length;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < count - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(count - 1, i + 2)];
    d += ` ${catmullRomSegment(p0, p1, p2, p3)}`;
  }
  return d;
}

export function clientToWorld(clientX, clientY, rect, view) {
  return {
    x: (clientX - rect.left - view.x) / view.scale,
    y: (clientY - rect.top - view.y) / view.scale,
  };
}
