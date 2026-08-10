import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children, requireOnboarded = true }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Chargement…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireOnboarded && !user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
