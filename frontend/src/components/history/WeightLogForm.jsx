import { useState } from 'react';
import { api } from '../../api/client.js';
import { localLogDate } from '../../utils/date.js';

export default function WeightLogForm({ currentWeight, onLogged }) {
  const [weightKg, setWeightKg] = useState(currentWeight ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/weight', { weightKg: Number(weightKg), logDate: localLogDate() });
      onLogged(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="poids-du-jour-kg" className="mb-1 block text-sm font-medium text-gray-700">Poids du jour (kg)</label>
          <input id="poids-du-jour-kg"
            type="number"
            required
            min="1"
            max="500"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
        >
          {submitting ? '…' : 'Enregistrer'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
