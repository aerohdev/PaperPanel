import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Terminal, Package, Server, Users, Settings, Globe, Radio, Shield } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/console', icon: Terminal, label: 'Console' },
    { to: '/players', icon: Users, label: 'Players' },
    { to: '/plugins', icon: Package, label: 'Plugins' },
    { to: '/worlds', icon: Globe, label: 'Worlds' },
    { to: '/broadcast', icon: Radio, label: 'Broadcast' },
    { to: '/server', icon: Settings, label: 'Server Control' },
    { to: '/users', icon: Shield, label: 'User Management' },
  ];

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <Server className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-gray-400">Server Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <div className="text-xs text-gray-500 text-center">
          <p>Server Admin Panel v1.1.0</p>
          <p className="mt-1">Powered by Paper</p>
        </div>
      </div>
    </aside>
  );
}
