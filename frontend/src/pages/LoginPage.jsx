import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.onboarded ? '/' : '/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="mb-4 text-center font-display text-3xl font-semibold text-brand-600">
          🌸 Suivi Alimentation
        </p>
        <div className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-brand-100">
          <h1 className="mb-6 text-center font-display text-2xl font-bold text-brand-700">Connexion</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input id="email"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label htmlFor="mot-de-passe" className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
              <input id="mot-de-passe"
                autoComplete="current-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-pink-100 bg-white px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
