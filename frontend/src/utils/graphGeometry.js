/**
 * Геометрические утилиты для будущего SVG-графа.
 */

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
