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
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
      <h3 className="font-semibold text-gray-900">Créer un aliment</h3>

      <div>
        <label htmlFor="nom" className="mb-1 block text-sm font-medium text-gray-700">Nom</label>
        <input id="nom"
          type="text"
          required
          value={form.foodName}
          onChange={(e) => update('foodName', e.target.value)}
          className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label htmlFor="calories-pour-100-g" className="mb-1 block text-sm font-medium text-gray-700">Calories pour 100 g</label>
        <input id="calories-pour-100-g"
          type="number"
          required
          min="0"
          value={form.caloriesPer100g}
          onChange={(e) => update('caloriesPer100g', e.target.value)}
          className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="proteines-g" className="mb-1 block text-xs font-medium text-gray-700">Protéines (g)</label>
          <input id="proteines-g"
            type="number"
            min="0"
            value={form.proteinPer100g}
            onChange={(e) => update('proteinPer100g', e.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-white px-2 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div>
          <label htmlFor="glucides-g" className="mb-1 block text-xs font-medium text-gray-700">Glucides (g)</label>
          <input id="glucides-g"
            type="number"
            min="0"
            value={form.carbsPer100g}
            onChange={(e) => update('carbsPer100g', e.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-white px-2 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div>
          <label htmlFor="lipides-g" className="mb-1 block text-xs font-medium text-gray-700">Lipides (g)</label>
          <input id="lipides-g"
            type="number"
            min="0"
            value={form.fatPer100g}
            onChange={(e) => update('fatPer100g', e.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-white px-2 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-pink-200 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-pink-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Création…' : 'Créer et ajouter'}
        </button>
      </div>
    </form>
  );
}
