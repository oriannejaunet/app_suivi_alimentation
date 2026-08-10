import { useState } from 'react';
import { api } from '../../api/client.js';

export default function CustomFoodForm({ initialName = '', onCreated, onCancel }) {
  const [form, setForm] = useState({
    foodName: initialName,
    caloriesPer100g: '',
    proteinPer100g: '',
    carbsPer100g: '',
    fatPer100g: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/food/custom', {
        foodName: form.foodName,
        caloriesPer100g: Number(form.caloriesPer100g),
        proteinPer100g: form.proteinPer100g === '' ? undefined : Number(form.proteinPer100g),
        carbsPer100g: form.carbsPer100g === '' ? undefined : Number(form.carbsPer100g),
        fatPer100g: form.fatPer100g === '' ? undefined : Number(form.fatPer100g),
      });
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <h3 className="font-semibold text-gray-900">Créer un aliment</h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nom</label>
        <input
          type="text"
          required
          value={form.foodName}
          onChange={(e) => update('foodName', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Calories pour 100 g</label>
        <input
          type="number"
          required
          min="0"
          value={form.caloriesPer100g}
          onChange={(e) => update('caloriesPer100g', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Protéines (g)</label>
          <input
            type="number"
            min="0"
            value={form.proteinPer100g}
            onChange={(e) => update('proteinPer100g', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Glucides (g)</label>
          <input
            type="number"
            min="0"
            value={form.carbsPer100g}
            onChange={(e) => update('carbsPer100g', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Lipides (g)</label>
          <input
            type="number"
            min="0"
            value={form.fatPer100g}
            onChange={(e) => update('fatPer100g', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Création…' : 'Créer et ajouter'}
        </button>
      </div>
    </form>
  );
}
