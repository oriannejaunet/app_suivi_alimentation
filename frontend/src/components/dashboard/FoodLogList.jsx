export default function FoodLogList({ logs, onDelete }) {
  if (logs.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        Aucun aliment enregistré aujourd'hui. Utilisez l'onglet Scanner pour en ajouter un.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Journal du jour</h2>
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{log.foodName}</p>
            <p className="text-xs text-gray-500">{log.quantityG} g · {Math.round(log.calories)} kcal</p>
          </div>
          <button
            onClick={() => onDelete(log.id)}
            aria-label="Supprimer"
            className="ml-3 shrink-0 rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
