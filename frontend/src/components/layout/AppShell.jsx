import BottomNav from './BottomNav.jsx';

export default function AppShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-52 h-56 w-56 rounded-full bg-purple-200/30 blur-3xl" />
      <div className="relative mx-auto max-w-lg px-4 py-6">{children}</div>
      <BottomNav />
    </div>
  );
}
