const MACROS = [
  { consumedKey: 'proteinConsumed', targetKey: 'proteinTargetG', label: 'Protéines', color: 'bg-blue-500' },
  { consumedKey: 'carbsConsumed', targetKey: 'carbsTargetG', label: 'Glucides', color: 'bg-amber-500' },
  { consumedKey: 'fatConsumed', targetKey: 'fatTargetG', label: 'Lipides', color: 'bg-purple-500' },
];

export default function MacroBreakdown({ summary }) {
  return (
    <div className="mt-4 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      {MACROS.map((macro) => {
        const consumed = summary[macro.consumedKey] || 0;
        const target = summary[macro.targetKey] || 0;
        const progress = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
        const isOver = target > 0 && consumed > target;

        return (
          <div key={macro.consumedKey}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-gray-700">{macro.label}</span>
              <span className={isOver ? 'font-medium text-amber-600' : 'text-gray-500'}>
                {Math.round(consumed)} g <span className="text-gray-400">/ {Math.round(target)} g</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${isOver ? 'bg-amber-500' : macro.color}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
