import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/layout/AppShell.jsx';
import WeightChart from '../components/history/WeightChart.jsx';
import WeightLogForm from '../components/history/WeightLogForm.jsx';
import CaloriesChart from '../components/history/CaloriesChart.jsx';

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export default function HistoryPage() {
  const [weights, setWeights] = useState([]);
  const [calorieHistory, setCalorieHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [weightsRes, historyRes] = await Promise.all([
        api.get('/weight', { params: { days: 90 } }),
        api.get('/stats/history', { params: { days: 14 } }),
      ]);
      setWeights(weightsRes.data);
      setCalorieHistory(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger votre historique');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : null;
  const weightChange = weights.length > 1 ? currentWeight - weights[0].weightKg : null;
  const avgCalories = average(calorieHistory.filter((d) => d.caloriesConsumed > 0).map((d) => d.caloriesConsumed));

  return (
    <AppShell>
      <h1 className="mb-4 font-display text-2xl font-bold text-brand-700">Mon suivi</h1>

      {loading && <p className="text-sm text-gray-500">Chargement…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-semibold text-gray-900">Poids</h2>
              {currentWeight != null && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{currentWeight} kg</p>
                  {weightChange != null && (
                    <p className={`text-xs font-medium ${weightChange <= 0 ? 'text-brand-600' : 'text-amber-600'}`}>
                      {weightChange > 0 ? '+' : ''}
                      {weightChange.toFixed(1)} kg sur la période
                    </p>
                  )}
                </div>
              )}
            </div>

            <WeightChart data={weights} />

            <div className="mt-4 border-t border-pink-100 pt-4">
              <WeightLogForm currentWeight={currentWeight} onLogged={load} />
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-semibold text-gray-900">Calories (14 derniers jours)</h2>
              {avgCalories > 0 && <p className="text-sm text-gray-500">Moy. {Math.round(avgCalories)} kcal/j</p>}
            </div>
            <CaloriesChart data={calorieHistory} />
          </section>
        </>
      )}
    </AppShell>
  );
}
