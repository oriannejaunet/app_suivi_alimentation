export default function CalorieSummaryCard({ summary }) {
  const { targetCalories, caloriesConsumed, remainingCalories } = summary;
  const isOver = remainingCalories < 0;
  const progress = Math.min(100, Math.round((caloriesConsumed / targetCalories) * 100));

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-brand-100">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-sm text-gray-500">Consommées</p>
          <p className="font-display text-3xl font-bold text-brand-700">{Math.round(caloriesConsumed)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Objectif</p>
          <p className="text-xl font-semibold text-gray-700">{targetCalories} kcal</p>
        </div>
      </div>

      <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-pink-50">
        <div
          className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-brand-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-brand-700'}`}>
        {isOver
          ? `Objectif dépassé de ${Math.abs(remainingCalories)} kcal`
          : `Il vous reste ${remainingCalories} kcal aujourd'hui`}
      </p>
    </div>
  );
}
