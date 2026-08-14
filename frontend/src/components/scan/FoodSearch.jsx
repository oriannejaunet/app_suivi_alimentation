import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../../api/client.js';
import CustomFoodForm from './CustomFoodForm.jsx';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearched(false);
      setError('');
      setSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    setSearching(true);
    setError('');

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/food/search', {
          params: { q: trimmed },
          signal: controller.signal,
        });
        setResults(data);
        setSearched(true);
        setSearching(false);
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError('La recherche a échoué. Réessayez.');
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleCustomCreated(food) {
    setShowCustomForm(false);
    onSelect(food);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="relative">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un aliment : pomme, poulet grillé…"
          className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 pr-9 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-200"
        />
        {searching && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-400">
            …
          </span>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {searched && !searching && results.length === 0 && !error && (
        <p className="mt-3 text-sm text-gray-500">Aucun résultat pour « {query.trim()} ».</p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 divide-y divide-pink-100">
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
                      <span className="ml-2 rounded-sm bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
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
