import { useState } from 'react';

const WIDTH = 600;
const HEIGHT = 200;
const PAD = { top: 16, right: 12, bottom: 24, left: 40 };
const GOOD_COLOR = '#0ca30c';
const WARNING_COLOR = '#fab219';

function formatShortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function CaloriesChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (data.length === 0) return null;

  const target = data[0].targetCalories || 0;
  const maxVal = Math.max(target, ...data.map((d) => d.caloriesConsumed), 1) * 1.1;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barWidth = Math.min(24, slot * 0.6);
  const targetY = PAD.top + innerH - (target / maxVal) * innerH;
  const yTicks = [0, maxVal / 2, maxVal];
  const hovered = hoverIndex != null ? data[hoverIndex] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} role="img" aria-label="Calories consommées par jour">
        {yTicks.map((t, i) => {
          const y = PAD.top + innerH - (t / maxVal) * innerH;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#e1e0d9" strokeWidth="1" />
              <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#898781">
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={targetY} y2={targetY} stroke="#52514e" strokeWidth="1" />
        <text x={WIDTH - PAD.right} y={targetY - 4} textAnchor="end" fontSize="10" fill="#52514e">
          Objectif {Math.round(target)} kcal
        </text>

        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barWidth) / 2;
          const barH = Math.max((d.caloriesConsumed / maxVal) * innerH, d.caloriesConsumed > 0 ? 2 : 0);
          const y = PAD.top + innerH - barH;
          const isOver = d.caloriesConsumed > d.targetCalories;
          const color = isOver ? WARNING_COLOR : GOOD_COLOR;
          return (
            <g
              key={d.logDate}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onTouchStart={() => setHoverIndex(i)}
            >
              <rect x={x} y={y} width={barWidth} height={barH} rx="4" fill={color} opacity={hoverIndex === i ? 1 : 0.85} />
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
            </g>
          );
        })}

        <text x={PAD.left} y={HEIGHT - 6} fontSize="10" fill="#898781">
          {formatShortDate(data[0].logDate)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" fontSize="10" fill="#898781">
          {formatShortDate(data[data.length - 1].logDate)}
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
          style={{
            left: `${((PAD.left + hoverIndex * slot + slot / 2) / WIDTH) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-medium">{Math.round(hovered.caloriesConsumed)} kcal</div>
          <div className="text-gray-300">{formatShortDate(hovered.logDate)}</div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GOOD_COLOR }} /> Objectif respecté
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: WARNING_COLOR }} /> Objectif dépassé
        </span>
      </div>
    </div>
  );
}
