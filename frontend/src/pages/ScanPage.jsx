import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { localLogDate } from '../utils/date.js';
import AppShell from '../components/layout/AppShell.jsx';
import BarcodeScanner from '../components/scan/BarcodeScanner.jsx';
import FoodSearch from '../components/scan/FoodSearch.jsx';
import QuantityEntryModal from '../components/scan/QuantityEntryModal.jsx';

const TABS = [
  { value: 'scan', label: '📷 Scanner' },
  { value: 'search', label: '🔍 Rechercher' },
];

export default function ScanPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('scan');
  const [selectedFood, setSelectedFood] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDetected = useCallback(async (barcode) => {
    setNotFound(false);
    try {
      const { data } = await api.get(`/food/barcode/${encodeURIComponent(barcode)}`);
      setSelectedFood({ barcode, ...data });
    } catch {
      setNotFound(true);
    }
  }, []);

  async function handleConfirm(quantityG) {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/foodlog', {
        barcode: selectedFood.barcode || undefined,
        foodName: selectedFood.foodName,
        quantityG,
        caloriesPer100g: selectedFood.caloriesPer100g,
        proteinPer100g: selectedFood.proteinPer100g ?? undefined,
        carbsPer100g: selectedFood.carbsPer100g ?? undefined,
        fatPer100g: selectedFood.fatPer100g ?? undefined,
        logDate: localLogDate(),
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || "Impossible d'enregistrer cet aliment.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSelectedFood(null);
    setNotFound(false);
    setError('');
  }

  function switchMode(next) {
    setMode(next);
    setNotFound(false);
  }

  return (
    <AppShell>
      <h1 className="mb-4 font-display text-2xl font-bold text-brand-700">Ajouter un aliment</h1>

      <div className="mb-4 flex gap-2 rounded-full bg-pink-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => switchMode(tab.value)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
              mode === tab.value ? 'bg-white text-brand-700 shadow-soft' : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'scan' && (
        <>
          <BarcodeScanner active={mode === 'scan' && !selectedFood} onDetected={handleDetected} />
          {notFound && (
            <div className="mt-4 rounded-2xl bg-white p-4 text-center shadow-soft">
              <p className="mb-2 text-sm text-gray-700">Produit non trouvé pour ce code-barres.</p>
              <button
                onClick={() => switchMode('search')}
                className="text-sm font-medium text-brand-600 underline"
              >
                Chercher par nom à la place
              </button>
            </div>
          )}
        </>
      )}

      {mode === 'search' && <FoodSearch onSelect={setSelectedFood} />}

      {selectedFood && (
        <QuantityEntryModal
          food={selectedFood}
          submitting={submitting}
          error={error}
          onCancel={reset}
          onConfirm={handleConfirm}
        />
      )}
    </AppShell>
  );
}
