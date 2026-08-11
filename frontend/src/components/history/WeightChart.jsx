import { useMemo, useState } from 'react';

const WIDTH = 600;
const HEIGHT = 200;
const PAD = { top: 16, right: 12, bottom: 24, left: 40 };
// Rose de la marque (identité de série, cohérent avec la ligne "perte de poids" de CaloriesChart).
const LINE_COLOR = '#db2777';

function formatShortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function WeightChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const chart = useMemo(() => {
    if (data.length === 0) return null;
    const weights = data.map((d) => d.weightKg);
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    const padding = Math.max((rawMax - rawMin) * 0.15, 0.5);
    const minY = rawMin - padding;
    const maxY = rawMax + padding;
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const points = data.map((d, i) => ({
      ...d,
      x: data.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (data.length - 1)) * innerW,
      y: PAD.top + innerH - ((d.weightKg - minY) / (maxY - minY)) * innerH,
    }));

    return { points, minY, maxY, innerH };
  }, [data]);

  if (!chart) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500">
        Aucune pesée enregistrée pour l'instant.
      </div>
    );
  }

  const { points, minY, maxY, innerH } = chart;
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z`;
  const yTicks = [minY, (minY + maxY) / 2, maxY];
  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  function handleMove(clientX, currentTarget) {
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Évolution du poids"
        onMouseMove={(e) => handleMove(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX, e.currentTarget)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.currentTarget)}
      >
        {yTicks.map((t, i) => {
          const y = PAD.top + innerH - ((t - minY) / (maxY - minY || 1)) * innerH;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#e1e0d9" strokeWidth="1" />
              <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#898781">
                {t.toFixed(1)}
              </text>
            </g>
          );
        })}

        {points.length > 1 && <path d={areaPath} fill={LINE_COLOR} opacity="0.1" />}
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle
            key={p.logDate}
            cx={p.x}
            cy={p.y}
            r={i === hoverIndex ? 5 : 3.5}
            fill={LINE_COLOR}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}

        {hovered && <line x1={hovered.x} x2={hovered.x} y1={PAD.top} y2={PAD.top + innerH} stroke="#c3c2b7" strokeWidth="1" />}

        <text x={PAD.left} y={HEIGHT - 6} fontSize="10" fill="#898781">
          {formatShortDate(points[0].logDate)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" fontSize="10" fill="#898781">
          {formatShortDate(points[points.length - 1].logDate)}
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: 0, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-medium">{hovered.weightKg} kg</div>
          <div className="text-gray-300">{formatShortDate(hovered.logDate)}</div>
        </div>
      )}
    </div>
  );
}
