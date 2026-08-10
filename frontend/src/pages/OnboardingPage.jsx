import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sédentaire (peu ou pas de sport)' },
  { value: 'light', label: 'Légèrement actif (1-3 fois/semaine)' },
  { value: 'moderate', label: 'Modérément actif (3-5 fois/semaine)' },
  { value: 'active', label: 'Actif (6-7 fois/semaine)' },
  { value: 'very_active', label: 'Très actif (sport intense quotidien)' },
];

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Perdre du poids', rate: -500 },
  { value: 'maintain', label: 'Maintenir mon poids', rate: 0 },
  { value: 'gain', label: 'Prendre du poids', rate: 300 },
];

export default function OnboardingPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    heightCm: '',
    weightKg: '',
    age: '',
    gender: 'female',
    activityLevel: 'sedentary',
    goal: 'maintain',
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
      const goalRateKcal = GOAL_OPTIONS.find((g) => g.value === form.goal)?.rate ?? 0;
      const { data } = await api.put('/profile', {
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        age: Number(form.age),
        gender: form.gender,
        activityLevel: form.activityLevel,
        goal: form.goal,
        goalRateKcal,
      });
      setUser(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-brand-700">Parlez-nous de vous</h1>
      <p className="mb-6 text-sm text-gray-600">
        Ces informations servent à calculer votre besoin calorique quotidien.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Taille (cm)</label>
            <input
              type="number"
              required
              min="1"
              max="300"
              value={form.heightCm}
              onChange={(e) => update('heightCm', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Poids (kg)</label>
            <input
              type="number"
              required
              min="1"
              max="500"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => update('weightKg', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Âge</label>
            <input
              type="number"
              required
              min="1"
              max="130"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Sexe</label>
            <select
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="female">Femme</option>
              <option value="male">Homme</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Niveau d'activité</label>
          <select
            value={form.activityLevel}
            onChange={(e) => update('activityLevel', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Objectif</label>
          <select
            value={form.goal}
            onChange={(e) => update('goal', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {GOAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Enregistrement…' : 'Valider'}
        </button>
      </form>
    </div>
  );
}
