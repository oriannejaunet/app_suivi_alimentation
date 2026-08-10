import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/layout/AppShell.jsx';
import CalorieSummaryCard from '../components/dashboard/CalorieSummaryCard.jsx';
import MacroBreakdown from '../components/dashboard/MacroBreakdown.jsx';
import FoodLogList from '../components/dashboard/FoodLogList.jsx';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [summaryRes, logsRes] = await Promise.all([api.get('/stats/summary'), api.get('/foodlog')]);
      setSummary(summaryRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger vos données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.delete(`/foodlog/${id}`);
      load();
    } catch {
      load();
    }
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Aujourd'hui</h1>
      {loading && <p className="text-sm text-gray-500">Chargement…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <>
          <CalorieSummaryCard summary={summary} />
          <MacroBreakdown summary={summary} />
        </>
      )}
      <FoodLogList logs={logs} onDelete={handleDelete} />
    </AppShell>
  );
}
