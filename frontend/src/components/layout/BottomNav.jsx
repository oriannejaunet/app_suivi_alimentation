import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Journal', icon: '📊' },
  { to: '/history', label: 'Suivi', icon: '📈' },
  { to: '/scan', label: 'Scanner', icon: '📷' },
  { to: '/profile', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                isActive ? 'text-brand-600' : 'text-gray-500'
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
