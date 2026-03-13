import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/income', label: 'Income', icon: '💰' },
  { to: '/recurring', label: 'Recurring', icon: '🔄' },
  { to: '/budgets', label: 'Budgets', icon: '📋' },
  { to: '/sankey', label: 'Sankey', icon: '📈' },
  { to: '/forecast', label: 'Forecast', icon: '🔮' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">Pilin</h1>
        <p className="text-sm text-gray-400 mt-1 truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors px-2 py-2"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
