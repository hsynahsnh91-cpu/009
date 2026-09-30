"use client";
import { useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { T } from "@/lib/i18n";
export default function KnowledgeMap({
  topic,
  concepts,
  onExplore,
  t,
}: {
  topic: string;
  concepts: string[];
  onExplore: (q: string) => void;
  t: T;
}) {
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [hover, setHover] = useState(-1);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const nodes = concepts.map((label, i) => ({
    label,
    x: 350 + 235 * Math.cos((i * 2 * Math.PI) / concepts.length - Math.PI / 2),
    y: 215 + 150 * Math.sin((i * 2 * Math.PI) / concepts.length - Math.PI / 2),
  }));
  return (
    <div className="map-panel">
      <div className="section-heading">
        <div>
          <h3>{t.map}</h3>
          <p>{t.mapHint}</p>
        </div>
        <div className="inline">
          <button
            aria-label={t.zoomOut}
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          >
            <Minus size={16} />
          </button>
          <button
            aria-label={t.zoomIn}
            onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
          >
            <Plus size={16} />
          </button>
          <button
            aria-label={t.reset}
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <svg
        className="knowledge-map"
        viewBox="0 0 700 430"
        aria-label={t.map}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('[role="button"]')) return;
          drag.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const scale = 700 / e.currentTarget.getBoundingClientRect().width;
          setPan((p) => ({
            x: p.x + (e.clientX - drag.current!.x) * scale,
            y: p.y + (e.clientY - drag.current!.y) * scale,
          }));
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <g
          transform={`translate(${350 + pan.x} ${215 + pan.y}) scale(${zoom}) translate(-350 -215)`}
        >
          {nodes.map((n, i) => (
            <line
              key={i}
              x1="350"
              y1="215"
              x2={n.x}
              y2={n.y}
              stroke={hover === i ? "#c9b4ff" : "#474153"}
              strokeWidth="1.5"
            />
          ))}
          <rect
            x="260"
            y="183"
            width="180"
            height="64"
            rx="12"
            fill="#30263f"
            stroke="#a78bd3"
          />
          <text
            x="350"
            y="219"
            textAnchor="middle"
            fill="#efdefe"
            fontSize="13"
          >
            {topic.length > 23 ? topic.slice(0, 23) + "…" : topic}
          </text>
          {nodes.map((n, i) => (
            <g
              key={n.label}
              role="button"
              tabIndex={0}
              aria-label={`${t.next}: ${n.label}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(-1)}
              onClick={() => onExplore(n.label)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onExplore(n.label);
                }
              }}
            >
              <rect
                x={n.x - 80}
                y={n.y - 23}
                width="160"
                height="46"
                rx="8"
                fill={hover === i ? "#33293f" : "#1b1b22"}
                stroke={hover === i ? "#c9b4ff" : "#46414c"}
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fill="#dedbe6"
                fontSize="12"
              >
                {n.label.length > 22 ? n.label.slice(0, 22) + "…" : n.label}
              </text>
              <title>{n.label}</title>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
