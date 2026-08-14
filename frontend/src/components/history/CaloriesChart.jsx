import { useState } from 'react';

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 24, left: 40 };

// Couleurs du statut (palette dataviz partagée, non thématisées) : le statut d'un
// jour dépend de sa position par rapport aux deux seuils, jamais de la couleur seule
// (voir légende avec puce + libellé).
const GOOD_COLOR = '#0ca30c';
const WARNING_COLOR = '#fab219';
const CRITICAL_COLOR = '#d03b3b';
// Encre neutre : une journée sans saisie n'est ni réussie ni ratée, la peindre en
// vert comme un objectif atteint serait mensonger.
const EMPTY_COLOR = '#c9c8c2';
// Ligne "objectif" : couleur catégorielle (identité d'une série), en pointillés
// pour la distinguer visuellement de la ligne de maintien.
const TARGET_LINE_COLOR = '#db2777';
// Ligne "maintien" : encre secondaire neutre, cohérente avec le reste du chrome du graphique.
const MAINTENANCE_LINE_COLOR = '#52514e';

// Tolérance autour de l'objectif : en dessous, la journée compte comme atteinte.
const ON_TARGET_RATIO = 0.1;
const NEAR_TARGET_RATIO = 0.2;

function formatShortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Le statut se mesure à l'écart avec l'objectif personnel de l'utilisateur, dans les
// deux sens : trop peu manger sur un déficit est un écart autant que trop manger.
function barColor(consumed, targetCalories) {
  if (consumed === 0) return EMPTY_COLOR;
  if (!targetCalories) return EMPTY_COLOR;
  const gap = Math.abs(consumed - targetCalories) / targetCalories;
  if (gap <= ON_TARGET_RATIO) return GOOD_COLOR;
  if (gap <= NEAR_TARGET_RATIO) return WARNING_COLOR;
  return CRITICAL_COLOR;
}

export default function CaloriesChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (data.length === 0) return null;

  const maintenanceCalories = data[0].maintenanceCalories || 0;
  const targetCalories = data[0].targetCalories || 0;
  const maxVal = Math.max(maintenanceCalories, targetCalories, ...data.map((d) => d.caloriesConsumed), 1) * 1.1;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barWidth = Math.min(24, slot * 0.6);
  const maintenanceY = PAD.top + innerH - (maintenanceCalories / maxVal) * innerH;
  const targetY = PAD.top + innerH - (targetCalories / maxVal) * innerH;
  // Sur un objectif de maintien les deux lignes se superposent : une seule suffit.
  const showTargetLine = targetCalories > 0 && Math.abs(targetY - maintenanceY) > 6;
  const yTicks = [0, maxVal / 2, maxVal];
  const hovered = hoverIndex != null ? data[hoverIndex] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} role="img" aria-label="Calories consommées par jour, avec le seuil de maintien et l'objectif personnel">
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

        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barWidth) / 2;
          const barH = Math.max((d.caloriesConsumed / maxVal) * innerH, d.caloriesConsumed > 0 ? 2 : 0);
          const y = PAD.top + innerH - barH;
          const color = barColor(d.caloriesConsumed, d.targetCalories);
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

        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={maintenanceY} y2={maintenanceY} stroke={MAINTENANCE_LINE_COLOR} strokeWidth="2" />
        <text x={WIDTH - PAD.right} y={maintenanceY - 4} textAnchor="end" fontSize="10" fill={MAINTENANCE_LINE_COLOR}>
          Maintien {Math.round(maintenanceCalories)} kcal
        </text>

        {showTargetLine && (
          <>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={targetY}
              y2={targetY}
              stroke={TARGET_LINE_COLOR}
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text x={PAD.left} y={targetY - 4} textAnchor="start" fontSize="10" fill={TARGET_LINE_COLOR}>
              Mon objectif {Math.round(targetCalories)} kcal
            </text>
          </>
        )}

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

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GOOD_COLOR }} /> Objectif atteint (±10 %)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: WARNING_COLOR }} /> Écart modéré
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CRITICAL_COLOR }} /> Écart important
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EMPTY_COLOR }} /> Aucune saisie
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 border-t-2" style={{ borderColor: MAINTENANCE_LINE_COLOR }} /> Maintien
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 border-t-2 border-dashed" style={{ borderColor: TARGET_LINE_COLOR }} /> Mon objectif
        </span>
      </div>
    </div>
  );
}
