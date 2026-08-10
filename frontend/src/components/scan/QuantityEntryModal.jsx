import { useState } from 'react';

export default function QuantityEntryModal({ food, onConfirm, onCancel, submitting }) {
  const [quantityG, setQuantityG] = useState('100');
  const grams = Number(quantityG) || 0;
  const factor = grams / 100;
  const calories = Math.round((food.caloriesPer100g || 0) * factor);

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-start gap-3">
          {food.imageUrl && (
            <img src={food.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
          )}
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-gray-900">{food.foodName}</h2>
            {food.brand && <p className="truncate text-sm text-gray-500">{food.brand}</p>}
            <p className="text-xs text-gray-400">{food.caloriesPer100g ?? '?'} kcal / 100g</p>
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700">Quantité (g)</label>
        <input
          type="number"
          autoFocus
          min="1"
          value={quantityG}
          onChange={(e) => setQuantityG(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        <p className="mt-3 text-center text-2xl font-bold text-brand-700">{calories} kcal</p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(grams)}
            disabled={submitting || grams <= 0 || food.caloriesPer100g == null}
            className="flex-1 rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
