import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GOAL_OPTIONS } from '../constants/goals.js';
import AppShell from '../components/layout/AppShell.jsx';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light', label: 'Légèrement actif' },
  { value: 'moderate', label: 'Modérément actif' },
  { value: 'active', label: 'Actif' },
  { value: 'very_active', label: 'Très actif' },
];

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    heightCm: user.heightCm ?? '',
    weightKg: user.weightKg ?? '',
    age: user.age ?? '',
    gender: user.gender ?? 'female',
    activityLevel: user.activityLevel ?? 'sedentary',
    goal: user.goal ?? 'maintain',
    goalRateKcal: user.goalRateKcal ?? 0,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function updateGoal(value) {
    const rate = GOAL_OPTIONS.find((g) => g.value === value)?.rate ?? 0;
    setForm((f) => ({ ...f, goal: value, goalRateKcal: rate }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.put('/profile', {
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        age: Number(form.age),
        gender: form.gender,
        activityLevel: form.activityLevel,
        goal: form.goal,
        goalRateKcal: Number(form.goalRateKcal),
      });
      setUser(data);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  }

  return (
    <AppShell>
      <h1 className="mb-4 font-display text-2xl font-bold text-brand-700">Mon profil</h1>
      <p className="mb-4 text-sm text-gray-500">{user.email}</p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-soft">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="taille-cm" className="mb-1 block text-sm font-medium text-gray-700">Taille (cm)</label>
            <input id="taille-cm"
              type="number"
              value={form.heightCm}
              onChange={(e) => update('heightCm', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="poids-kg" className="mb-1 block text-sm font-medium text-gray-700">Poids (kg)</label>
            <input id="poids-kg"
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => update('weightKg', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="mb-1 block text-sm font-medium text-gray-700">Âge</label>
            <input id="age"
              type="number"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="sexe" className="mb-1 block text-sm font-medium text-gray-700">Sexe</label>
            <select id="sexe"
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
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
            className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="objectif" className="mb-1 block text-sm font-medium text-gray-700">Objectif</label>
          <select id="objectif"
            value={form.goal}
            onChange={(e) => updateGoal(e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {GOAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ajustement-calorique-quotidien-kcal" className="mb-1 block text-sm font-medium text-gray-700">
            Ajustement calorique quotidien (kcal)
          </label>
          <input id="ajustement-calorique-quotidien-kcal"
            type="number"
            step="50"
            value={form.goalRateKcal}
            onChange={(e) => update('goalRateKcal', e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <p className="mt-1 text-xs text-gray-500">
            Négatif pour un déficit, positif pour un surplus. Pré-rempli à{' '}
            {GOAL_OPTIONS.find((g) => g.value === form.goal)?.rate ?? 0} kcal quand vous changez d'objectif,
            ajustable ensuite.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-brand-600">Profil enregistré.</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="mt-4 w-full rounded-full border border-pink-200 py-2 font-medium text-gray-700 hover:bg-pink-50"
      >
        Se déconnecter
      </button>
    </AppShell>
  );
}
