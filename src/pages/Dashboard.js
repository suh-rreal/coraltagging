import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { corals } from '../data/corals';
import './Dashboard.css';

const NODE_POSITIONS = [
  // Two nodes on each of six center-to-corner radial lines (12 total).
  { x: '41.25%', y: '32.5%' },
  { x: '32.5%', y: '15%' },
  { x: '58.75%', y: '32.5%' },
  { x: '67.5%', y: '15%' },
  { x: '67.5%', y: '50%' },
  { x: '85%', y: '50%' },
  { x: '58.75%', y: '67.5%' },
  { x: '67.5%', y: '85%' },
  { x: '41.25%', y: '67.5%' },
  { x: '32.5%', y: '85%' },
  { x: '32.5%', y: '50%' },
  { x: '15%', y: '50%' },
  // One node at each side midpoint (6 total).
  { x: '50%', y: '0%' },
  { x: '87.5%', y: '25%' },
  { x: '87.5%', y: '75%' },
  { x: '50%', y: '100%' },
  { x: '12.5%', y: '75%' },
  { x: '12.5%', y: '25%' },
];

const MAP_CONFIG = {
  hexSize: 160,
  hexHeight: 160 * 0.8660254,
  gapX: 1,
  gapY: 30,
  rowOffset: (160 * 0.8660254) * 0.5,
  columns: 5,
  rows: 5,
};

export default function Dashboard() {
  const viewportRef = useRef(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const hexes = useMemo(() => buildHexes(corals, MAP_CONFIG), []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const viewWidth = viewport.clientWidth;
    const viewHeight = viewport.clientHeight;
    const centeredX = (viewWidth - mapWidth()) / 2;
    const centeredY = (viewHeight - mapHeight()) / 2;
    setCamera((prev) => ({ ...prev, x: centeredX, y: centeredY }));
  }, []);

  useEffect(() => {
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const handleNativeWheel = (event) => {
      event.preventDefault();
      zoomAtPoint(event.clientX, event.clientY, event.deltaY);
    };

    viewport.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleNativeWheel);
  }, []);

  const mapStyle = {
    '--map-width': `${mapWidth()}px`,
    '--map-height': `${mapHeight()}px`,
    '--tooltip-inverse-scale': `${1 / Math.pow(camera.scale, 0.5)}`,
    transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
  };

  return (
    <div className="dashboard">
      <section
        ref={viewportRef}
        className="map-viewport"
        aria-label="Coral honeycomb map"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="honeycomb-grid" style={mapStyle}>
          {hexes.map((hex) => (
            <article key={hex.id} className="hex-cell" style={hexCellStyle(hex)}>
              <div className="hex-shape" aria-hidden="true">
                <svg className="hex-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon
                    points="25,0 75,0 100,50 75,100 25,100 0,50"
                    className="hex-svg-outline"
                  />
                  <g className="hex-svg-lines">
                    <line x1="50" y1="50" x2="25" y2="0" />
                    <line x1="50" y1="50" x2="75" y2="0" />
                    <line x1="50" y1="50" x2="100" y2="50" />
                    <line x1="50" y1="50" x2="75" y2="100" />
                    <line x1="50" y1="50" x2="25" y2="100" />
                    <line x1="50" y1="50" x2="0" y2="50" />
                  </g>
                </svg>
              </div>

              {hex.nodes.map((node) =>
                node.type === 'real' ? (
                  <Link
                    key={`${hex.id}-node-real-${node.slotIndex}`}
                    className={`coral-circle coral-circle--${statusClass(node.coral.status)}`}
                    to={`/coral/${node.coral.slug}`}
                    style={nodePositionStyle(node.slotIndex)}
                    aria-label={`View ${node.coral.commonName}`}
                  >
                    <span className="coral-circle-label">{node.coral.commonName}</span>
                    <span className="coral-bloom-card">
                      <strong>{node.coral.commonName}</strong>
                      <small>Last recorded: {formatRecordedAt(node.coral.lastRecorded)}</small>
                      <small>Health level: {node.coral.healthLevel ?? node.coral.status}</small>
                    </span>
                  </Link>
                ) : (
                  <span
                    key={`${hex.id}-node-placeholder-${node.slotIndex}`}
                    className="coral-circle coral-circle--placeholder"
                    style={nodePositionStyle(node.slotIndex)}
                    aria-hidden="true"
                  >
                    <span className="coral-bloom-card">
                      <strong>Placeholder Coral Node</strong>
                      <small>{node.label}</small>
                      <small>Status: Unassigned</small>
                    </span>
                  </span>
                )
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  function handlePointerDown(event) {
    if (event.target.closest('.coral-circle')) return;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }

  function handlePointerUp(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.active = false;
  }

  function zoomAtPoint(clientX, clientY, deltaY) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    setCamera((prev) => {
      const scaleDelta = deltaY > 0 ? 0.9 : 1.1;
      const nextScale = clamp(prev.scale * scaleDelta, 0.5, 2.5);
      const worldX = (px - prev.x) / prev.scale;
      const worldY = (py - prev.y) / prev.scale;
      return {
        scale: nextScale,
        x: px - worldX * nextScale,
        y: py - worldY * nextScale,
      };
    });
  }
}

function statusClass(status) {
  if (status.includes('Critically')) return 'critical';
  if (status.includes('Endangered') || status.includes('Threatened')) return 'warn';
  return 'ok';
}

function buildHexes(coralList, config) {
  const total = config.columns * config.rows;
  return Array.from({ length: total }, (_, index) => {
    const coral = coralList[index] || null;
    const col = index % config.columns;
    const row = Math.floor(index / config.columns);
    const x = col * (config.hexSize + config.gapX);
    const y = row * (config.hexHeight + config.gapY) + (col % 2 ? config.rowOffset : 0);
    const nodes = buildHexNodes(index, coral);
    return {
      id: `hex-${index + 1}`,
      coral,
      nodes,
      x,
      y,
    };
  });
}

function formatRecordedAt(value) {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function nodePositionStyle(slotIndex) {
  const point = NODE_POSITIONS[slotIndex] ?? NODE_POSITIONS[0];
  return {
    '--node-x': point.x,
    '--node-y': point.y,
  };
}

function buildHexNodes(hexIndex, coral) {
  const nodes = NODE_POSITIONS.map((_, slotIndex) => ({
    type: 'placeholder',
    slotIndex,
    label: `Placeholder ${hexIndex + 1}-${slotIndex + 1}`,
  }));

  if (coral) {
    const slotIndex = deterministicSlot(coral.slug, NODE_POSITIONS.length);
    nodes[slotIndex] = {
      type: 'real',
      slotIndex,
      coral,
    };
  }

  return nodes;
}

function deterministicSlot(seedText, totalSlots) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % totalSlots;
}

function hexCellStyle(hex) {
  return {
    '--hex-x': `${hex.x}px`,
    '--hex-y': `${hex.y}px`,
  };
}

function mapWidth() {
  return ((MAP_CONFIG.columns - 1) * (MAP_CONFIG.hexSize + MAP_CONFIG.gapX)) + MAP_CONFIG.hexSize;
}

function mapHeight() {
  return ((MAP_CONFIG.rows - 1) * (MAP_CONFIG.hexHeight + MAP_CONFIG.gapY)) + MAP_CONFIG.hexHeight + MAP_CONFIG.rowOffset;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
