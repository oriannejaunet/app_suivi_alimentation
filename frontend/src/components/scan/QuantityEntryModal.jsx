import { useState } from 'react';

export default function QuantityEntryModal({ food, onConfirm, onCancel, submitting, error }) {
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
          className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 text-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />

        <p className="mt-3 text-center font-display text-2xl font-bold text-brand-700">{calories} kcal</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-pink-200 py-2 font-medium text-gray-700 hover:bg-pink-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(grams)}
            disabled={submitting || grams <= 0 || food.caloriesPer100g == null}
            className="flex-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
