import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Journal', icon: '📊' },
  { to: '/history', label: 'Suivi', icon: '📈' },
  { to: '/scan', label: 'Scanner', icon: '📷' },
  { to: '/profile', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-pink-100 bg-white/90 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg gap-1 px-2 py-2">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
