import { useState } from 'react';
import { api } from '../../api/client.js';
import CustomFoodForm from './CustomFoodForm.jsx';

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const { data } = await api.get('/food/search', { params: { q: query } });
      setResults(data);
      setSearched(true);
    } catch {
      setError('La recherche a échoué. Réessayez.');
    } finally {
      setSearching(false);
    }
  }

  function handleCustomCreated(food) {
    setShowCustomForm(false);
    onSelect(food);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un aliment : pomme, poulet grillé…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {searching ? '…' : 'Chercher'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {searched && !searching && results.length === 0 && !error && (
        <p className="mt-3 text-sm text-gray-500">Aucun résultat pour « {query} ».</p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100">
          {results.map((r) => (
            <li key={r.id || r.barcode}>
              <button
                onClick={() => onSelect(r)}
                className="flex w-full items-center gap-3 py-2 text-left hover:text-brand-700"
              >
                {r.imageUrl && (
                  <img src={r.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {r.foodName}
                    {r.isCustom && (
                      <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
                        Personnalisé
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">{r.caloriesPer100g} kcal/100g</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showCustomForm && (
        <button
          onClick={() => setShowCustomForm(true)}
          className="mt-4 text-sm font-medium text-brand-600 underline"
        >
          Aliment introuvable ? Créez-le vous-même
        </button>
      )}

      {showCustomForm && (
        <CustomFoodForm
          initialName={query}
          onCreated={handleCustomCreated}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </div>
  );
}
