import { onBeforeUnmount, reactive } from 'vue';
import { clamp, clientToWorld, nodeCenter, pointInPolygon, smoothOpenPath } from '../utils/graphGeometry';
import { graphStore } from '../stores/graphStore';
import { uiStore } from '../stores/uiStore';

const REGION_SNAP_DISTANCE = 12;
const MIN_REGION_POINTS = 3;
const MIN_NODE_WIDTH = 180;
const MIN_NODE_HEIGHT = 110;
const MAX_NODE_WIDTH = 760;
const MAX_NODE_HEIGHT = 600;

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function roundPoint(point) {
  return {
    x: Math.round(point.x * 100) / 100,
    y: Math.round(point.y * 100) / 100,
  };
}

function bboxCornerPoints(a, b) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ].map(roundPoint);
}

function ellipsePreviewPoints(a, b) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = Math.max(4, (maxX - minX) / 2);
  const ry = Math.max(4, (maxY - minY) / 2);
  const result = [];
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    result.push(roundPoint({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) }));
  }
  return result;
}

function parseRegionPoints(coordinates) {
  try {
    const parsed = JSON.parse(coordinates || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((point) => ({ x: Number(point?.x) || 0, y: Number(point?.y) || 0 }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  } catch {
    return [];
  }
}

/**
 * Панорамирование, масштаб, перетаскивание узлов и областей, рисование областей.
 */
export function useGraphInteraction({ onMoveEnd, onResizeEnd, onRegionComplete, onRegionMoveEnd }) {
  onBeforeUnmount(cancelInertia);
  const interaction = reactive({
    mode: null,
    nodeId: null,
    regionId: null,
    startClient: { x: 0, y: 0 },
    startView: { x: 0, y: 0 },
    startNode: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    startRegionPoints: [],
    attachedNodes: [],
    regionHandleIndex: -1,
    startHandlePoint: { x: 0, y: 0 },
    startBBox: { minX: 0, minY: 0, width: 0, height: 0 },
    regionPoints: [],
    regionShape: 'polygon',
    moved: false,
    panTrail: [],
    inertiaRaf: null,
    inertiaV: { x: 0, y: 0 },
  });

  function cancelInertia() {
    if (interaction.inertiaRaf != null) {
      cancelAnimationFrame(interaction.inertiaRaf);
      interaction.inertiaRaf = null;
    }
    interaction.inertiaV = { x: 0, y: 0 };
  }

  function startInertia(vx, vy) {
    cancelInertia();
    interaction.inertiaV = { x: vx, y: vy };
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      const decay = Math.exp(-dt / 140);
      interaction.inertiaV.x *= decay;
      interaction.inertiaV.y *= decay;
      graphStore.view.x += interaction.inertiaV.x * dt;
      graphStore.view.y += interaction.inertiaV.y * dt;
      if (Math.hypot(interaction.inertiaV.x, interaction.inertiaV.y) < 0.03) {
        interaction.inertiaRaf = null;
        return;
      }
      interaction.inertiaRaf = requestAnimationFrame(step);
    };
    interaction.inertiaRaf = requestAnimationFrame(step);
  }

  function getRect(element) {
    return element.getBoundingClientRect();
  }

  function onWheel(event, root) {
    cancelInertia();
    const rect = getRect(root);
    const world = clientToWorld(event.clientX, event.clientY, rect, graphStore.view);
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    const nextScale = clamp(graphStore.view.scale * factor, 0.2, 3.2);
    graphStore.view.x = event.clientX - rect.left - world.x * nextScale;
    graphStore.view.y = event.clientY - rect.top - world.y * nextScale;
    graphStore.view.scale = nextScale;
  }

  function startPan(event) {
    startPanFrom({ x: event.clientX, y: event.clientY });
  }

  function startPanFrom(point) {
    cancelInertia();
    interaction.mode = 'pan';
    interaction.startClient = { x: point.x, y: point.y };
    interaction.startView = { x: graphStore.view.x, y: graphStore.view.y };
    interaction.panTrail = [{ x: point.x, y: point.y, t: performance.now() }];
    interaction.moved = true;
  }

  function startNodeDrag(event, node) {
    if (uiStore.tool === 'connect' || uiStore.tool === 'region') {
      return;
    }
    cancelInertia();
    interaction.mode = 'drag-node';
    interaction.nodeId = node.id;
    interaction.startClient = { x: event.clientX, y: event.clientY };
    interaction.startNode = { x: node.x || 0, y: node.y || 0 };
    interaction.moved = false;
  }

  function startNodeResize(event, node) {
    if (uiStore.tool !== 'select') {
      return;
    }
    cancelInertia();
    interaction.mode = 'resize-node';
    interaction.nodeId = node.id;
    interaction.startClient = { x: event.clientX, y: event.clientY };
    interaction.startSize = {
      width: Number(node.width) || 196,
      height: Number(node.height) || 112,
    };
    interaction.moved = false;
  }

  function startRegionDrag(event, region) {
    if (uiStore.tool !== 'select') {
      return;
    }
    const points = parseRegionPoints(region.coordinates);
    if (!points.length) return;
    cancelInertia();
    interaction.mode = 'drag-region';
    interaction.regionId = region.id;
    interaction.startClient = { x: event.clientX, y: event.clientY };
    interaction.startRegionPoints = points;
    interaction.attachedNodes = graphStore.objects
      .filter((node) => pointInPolygon(nodeCenter(node), points))
      .map((node) => ({ id: node.id, x: node.x || 0, y: node.y || 0 }));
    interaction.moved = false;
  }

  function startRegionVertexDrag(event, region, index) {
    if (uiStore.tool !== 'select') return;
    const points = parseRegionPoints(region.coordinates);
    const vertex = points[index];
    if (!vertex) return;
    cancelInertia();
    interaction.mode = 'region-vertex';
    interaction.regionId = region.id;
    interaction.regionHandleIndex = index;
    interaction.startClient = { x: event.clientX, y: event.clientY };
    interaction.startRegionPoints = points;
    interaction.startHandlePoint = { x: vertex.x, y: vertex.y };
    interaction.moved = false;
  }

  function startRegionMidpointDrag(event, region, edgeIndex) {
    if (uiStore.tool !== 'select') return;
    const points = parseRegionPoints(region.coordinates);
    if (points.length < 3) return;
    const a = points[edgeIndex % points.length];
    const b = points[(edgeIndex + 1) % points.length];
    if (!a || !b) return;
    const midpoint = roundPoint({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const nextPoints = [...points];
    nextPoints.splice(edgeIndex + 1, 0, midpoint);
    updateRegionPoints(region.id, nextPoints);
    cancelInertia();
    interaction.mode = 'region-vertex';
    interaction.regionId = region.id;
    interaction.regionHandleIndex = edgeIndex + 1;
    interaction.startClient = { x: event.clientX, y: event.clientY };
    interaction.startRegionPoints = nextPoints;
    interaction.startHandlePoint = { ...midpoint };
    interaction.moved = false;
  }

  function startRegionResizeDrag(event, region) {
    if (uiStore.tool !== 'select') return;
    const points = parseRegionPoints(region.coordinates);
    if (points.length < 3) return;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    cancelInertia();
    interaction.mode = 'region-resize';
    interaction.regionId = region.id;
    interaction.startClient = { x: event.clientX, y: event.clientY };
    interaction.startRegionPoints = points;
    interaction.startBBox = {
      minX,
      minY,
      width: Math.max(8, Math.max(...xs) - minX),
      height: Math.max(8, Math.max(...ys) - minY),
    };
    interaction.moved = false;
  }

  function addRegionPoint(event, root) {
    if (uiStore.tool !== 'region') return;
    cancelInertia();
    const world = clientToWorld(event.clientX, event.clientY, getRect(root), graphStore.view);

    if (interaction.mode !== 'region-points') {
      interaction.mode = 'region-points';
      interaction.regionPoints = [];
      interaction.regionShape = ['rectangle', 'ellipse'].includes(uiStore.regionToolShape)
        ? uiStore.regionToolShape
        : 'polygon';
    }

    const points = interaction.regionPoints;

    if (interaction.regionShape !== 'polygon') {
      if (points.length === 0) {
        points.push(roundPoint(world));
        interaction.moved = true;
        return;
      }
      if (points.length === 1) {
        const corners = bboxCornerPoints(points[0], roundPoint(world));
        if (onRegionComplete) {
          onRegionComplete(corners, interaction.regionShape);
        }
        resetRegion();
        return;
      }
      return;
    }

    const first = points[0];
    const snapDistance = REGION_SNAP_DISTANCE / graphStore.view.scale;
    if (points.length >= MIN_REGION_POINTS && first && distance(world, first) <= snapDistance) {
      finishRegion();
      return;
    }

    points.push(roundPoint(world));
    interaction.moved = true;
  }

  function finishRegion() {
    const points = interaction.regionPoints;
    const shape = interaction.regionShape || 'polygon';
    if (shape !== 'polygon') {
      if (points.length >= 2 && onRegionComplete) {
        onRegionComplete(bboxCornerPoints(points[0], points[points.length - 1]), shape);
      }
      resetRegion();
      return;
    }
    const rounded = points.map(roundPoint);
    if (rounded.length >= MIN_REGION_POINTS && onRegionComplete) {
      onRegionComplete(rounded, shape);
    }
    resetRegion();
  }

  function cancelRegion() {
    resetRegion();
  }

  function resetRegion() {
    interaction.mode = null;
    interaction.regionPoints = [];
    interaction.regionShape = 'polygon';
    interaction.moved = false;
  }

  function updateRegionPoints(regionId, points) {
    const region = graphStore.regions.find((item) => item.id === regionId);
    if (region) {
      region.coordinates = JSON.stringify(points);
    }
    return region;
  }

  function onPointerMove(event) {
    if (!interaction.mode) return;

    const dx = event.clientX - interaction.startClient.x;
    const dy = event.clientY - interaction.startClient.y;
    if (Math.hypot(dx, dy) > 4) {
      interaction.moved = true;
    }

    if (interaction.mode === 'pan') {
      graphStore.view.x = interaction.startView.x + dx;
      graphStore.view.y = interaction.startView.y + dy;
      const now = performance.now();
      interaction.panTrail.push({ x: event.clientX, y: event.clientY, t: now });
      while (interaction.panTrail.length > 2
          && now - interaction.panTrail[0].t > 120) {
        interaction.panTrail.shift();
      }
      return;
    }

    if (interaction.mode === 'drag-node') {
      const node = graphStore.objects.find((item) => item.id === interaction.nodeId);
      if (!node) return;
      node.x = interaction.startNode.x + dx / graphStore.view.scale;
      node.y = interaction.startNode.y + dy / graphStore.view.scale;
      return;
    }

    if (interaction.mode === 'resize-node') {
      const node = graphStore.objects.find((item) => item.id === interaction.nodeId);
      if (!node) return;
      node.width = clamp(
        interaction.startSize.width + dx / graphStore.view.scale,
        MIN_NODE_WIDTH,
        MAX_NODE_WIDTH
      );
      node.height = clamp(
        interaction.startSize.height + dy / graphStore.view.scale,
        MIN_NODE_HEIGHT,
        MAX_NODE_HEIGHT
      );
      return;
    }

    if (interaction.mode === 'drag-region') {
      const worldDx = dx / graphStore.view.scale;
      const worldDy = dy / graphStore.view.scale;
      const points = interaction.startRegionPoints.map((point) => roundPoint({
        x: point.x + worldDx,
        y: point.y + worldDy,
      }));
      updateRegionPoints(interaction.regionId, points);
      for (const attached of interaction.attachedNodes) {
        const node = graphStore.objects.find((item) => item.id === attached.id);
        if (node) {
          node.x = attached.x + worldDx;
          node.y = attached.y + worldDy;
        }
      }
      return;
    }

    if (interaction.mode === 'region-vertex') {
      const worldDx = dx / graphStore.view.scale;
      const worldDy = dy / graphStore.view.scale;
      const points = [...interaction.startRegionPoints];
      if (points[interaction.regionHandleIndex]) {
        points[interaction.regionHandleIndex] = roundPoint({
          x: interaction.startHandlePoint.x + worldDx,
          y: interaction.startHandlePoint.y + worldDy,
        });
        updateRegionPoints(interaction.regionId, points);
      }
      return;
    }

    if (interaction.mode === 'region-resize') {
      const worldDx = dx / graphStore.view.scale;
      const worldDy = dy / graphStore.view.scale;
      const { minX, minY, width, height } = interaction.startBBox;
      const scaleX = clamp((width + worldDx) / width, 0.15, 6);
      const scaleY = clamp((height + worldDy) / height, 0.15, 6);
      const points = interaction.startRegionPoints.map((point) => roundPoint({
        x: minX + (point.x - minX) * scaleX,
        y: minY + (point.y - minY) * scaleY,
      }));
      updateRegionPoints(interaction.regionId, points);
    }
  }

  async function onPointerUp() {
    if (interaction.mode === 'pan') {
      const trail = interaction.panTrail;
      if (trail.length >= 2) {
        const first = trail[0];
        const last = trail[trail.length - 1];
        const dt = last.t - first.t;
        if (dt > 8) {
          const vx = (last.x - first.x) / dt;
          const vy = (last.y - first.y) / dt;
          if (Math.hypot(vx, vy) > 0.08) {
            startInertia(vx, vy);
          }
        }
      }
      interaction.mode = null;
      interaction.panTrail = [];
      interaction.moved = false;
      return;
    }

    if (interaction.mode === 'drag-node' && interaction.moved && interaction.nodeId) {
      const node = graphStore.objects.find((item) => item.id === interaction.nodeId);
      if (node && onMoveEnd) {
        await onMoveEnd(node.id, node.x, node.y);
      }
    }

    if (interaction.mode === 'resize-node' && interaction.moved && interaction.nodeId && onResizeEnd) {
      const node = graphStore.objects.find((item) => item.id === interaction.nodeId);
      if (node) {
        await onResizeEnd(node.id, node.width, node.height);
      }
    }

    if ((interaction.mode === 'drag-region' || interaction.mode === 'region-vertex' || interaction.mode === 'region-resize')
        && interaction.moved && interaction.regionId) {
      const region = graphStore.regions.find((item) => item.id === interaction.regionId);
      if (region && onRegionMoveEnd) {
        await onRegionMoveEnd(region.id, region.coordinates);
      }
    }

    if (interaction.mode === 'drag-region') {
      for (const attached of interaction.attachedNodes) {
        const node = graphStore.objects.find((item) => item.id === attached.id);
        if (node && onMoveEnd) {
          await onMoveEnd(node.id, node.x, node.y);
        }
      }
    }

    if (interaction.mode === 'drag-node') {
      interaction.mode = null;
      interaction.nodeId = null;
      interaction.moved = false;
    }

    if (interaction.mode === 'resize-node') {
      interaction.mode = null;
      interaction.nodeId = null;
      interaction.moved = false;
    }

    if (interaction.mode === 'drag-region') {
      interaction.mode = null;
      interaction.regionId = null;
      interaction.startRegionPoints = [];
      interaction.attachedNodes = [];
      interaction.moved = false;
    }

    if (interaction.mode === 'region-vertex' || interaction.mode === 'region-resize') {
      interaction.mode = null;
      interaction.regionId = null;
      interaction.regionHandleIndex = -1;
      interaction.startRegionPoints = [];
      interaction.moved = false;
    }
  }

  function regionPreviewPoints() {
    const points = interaction.regionPoints;
    const shape = interaction.regionShape || 'polygon';
    if (shape === 'polygon') {
      if (!points.length) return null;
      return { kind: 'path', d: smoothOpenPath(points) };
    }
    if (points.length < 2) return null;
    const preview = shape === 'ellipse'
      ? ellipsePreviewPoints(points[0], points[points.length - 1])
      : bboxCornerPoints(points[0], points[points.length - 1]);
    return {
      kind: 'poly',
      points: preview.map((point) => `${point.x},${point.y}`).join(' '),
    };
  }

  return {
    interaction,
    onWheel,
    startPan,
    startPanFrom,
    startNodeDrag,
    startNodeResize,
    startRegionDrag,
    startRegionVertexDrag,
    startRegionMidpointDrag,
    startRegionResizeDrag,
    addRegionPoint,
    finishRegion,
    cancelRegion,
    onPointerMove,
    onPointerUp,
    regionPreviewPoints,
    clientToWorld,
  };
}
