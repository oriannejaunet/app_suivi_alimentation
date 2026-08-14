import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GOAL_OPTIONS } from '../constants/goals.js';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sédentaire (peu ou pas de sport)' },
  { value: 'light', label: 'Légèrement actif (1-3 fois/semaine)' },
  { value: 'moderate', label: 'Modérément actif (3-5 fois/semaine)' },
  { value: 'active', label: 'Actif (6-7 fois/semaine)' },
  { value: 'very_active', label: 'Très actif (sport intense quotidien)' },
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
      <h1 className="mb-2 font-display text-2xl font-bold text-brand-700">Parlez-nous de vous</h1>
      <p className="mb-6 text-sm text-gray-600">
        Ces informations servent à calculer votre besoin calorique quotidien.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-soft">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="taille-cm" className="mb-1 block text-sm font-medium text-gray-700">Taille (cm)</label>
            <input id="taille-cm"
              type="number"
              required
              min="1"
              max="300"
              value={form.heightCm}
              onChange={(e) => update('heightCm', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="poids-kg" className="mb-1 block text-sm font-medium text-gray-700">Poids (kg)</label>
            <input id="poids-kg"
              type="number"
              required
              min="1"
              max="500"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => update('weightKg', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="mb-1 block text-sm font-medium text-gray-700">Âge</label>
            <input id="age"
              type="number"
              required
              min="1"
              max="130"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="sexe" className="mb-1 block text-sm font-medium text-gray-700">Sexe</label>
            <select id="sexe"
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
            >
              <option value="female">Femme</option>
              <option value="male">Homme</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="niveau-d-activite" className="mb-1 block text-sm font-medium text-gray-700">Niveau d'activité</label>
          <select id="niveau-d-activite"
            value={form.activityLevel}
            onChange={(e) => update('activityLevel', e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="objectif" className="mb-1 block text-sm font-medium text-gray-700">Objectif</label>
          <select id="objectif"
            value={form.goal}
            onChange={(e) => update('goal', e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
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
          className="w-full rounded-full bg-linear-to-r from-brand-500 to-brand-600 py-2.5 font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Enregistrement…' : 'Valider'}
        </button>
      </form>
    </div>
  );
}
