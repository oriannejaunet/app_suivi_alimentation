import BottomNav from './BottomNav.jsx';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-lg px-4 py-6">{children}</div>
      <BottomNav />
    </div>
  );
}
