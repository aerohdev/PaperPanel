import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Terminal, Package, Server, Users, Settings, Globe, Radio, Shield, FileText, FileCog, UserCheck, Key, ScrollText } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';
import { Permission } from '../constants/permissions';

export default function Sidebar() {
  const { hasPermission, isAdmin, isLoading } = usePermissions();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: Permission.VIEW_DASHBOARD },
    { to: '/console', icon: Terminal, label: 'Console', permission: Permission.VIEW_CONSOLE },
    { to: '/logs', icon: FileText, label: 'Log Viewer', permission: Permission.VIEW_LOGS },
    { to: '/players', icon: Users, label: 'Players', permission: Permission.VIEW_PLAYERS },
    { to: '/whitelist', icon: UserCheck, label: 'Whitelist & Ops', permission: Permission.VIEW_WHITELIST },
    { to: '/plugins', icon: Package, label: 'Plugins', permission: Permission.VIEW_PLUGINS },
    { to: '/worlds', icon: Globe, label: 'Worlds', permission: Permission.VIEW_WORLDS },
    { to: '/broadcast', icon: Radio, label: 'Broadcast', permission: Permission.SEND_BROADCASTS },
    { to: '/configs', icon: FileCog, label: 'Config Editor', permission: Permission.VIEW_CONFIGS },
    { to: '/server', icon: Settings, label: 'Server Control', anyPermission: [Permission.RESTART_SERVER, Permission.STOP_SERVER, Permission.SAVE_SERVER] },
    { to: '/users', icon: Shield, label: 'Users & Roles', anyPermission: [Permission.VIEW_USERS, Permission.MANAGE_ROLES] },
    { to: '/audit', icon: ScrollText, label: 'Audit Log', permission: Permission.MANAGE_ROLES },
  ];

  // Show loading state while permissions are being loaded
  if (isLoading) {
    return (
      <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-white">PaperPanel</h1>
              <p className="text-xs text-gray-400">v2.5.0</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <div className="text-gray-400 text-center py-4">Loading...</div>
        </nav>
      </aside>
    );
  }

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter((item) => {
    // Admin can see everything
    if (isAdmin) return true;

    // Check single permission
    if (item.permission) {
      return hasPermission(item.permission);
    }

    // Check any of multiple permissions
    if (item.anyPermission) {
      return item.anyPermission.some(p => hasPermission(p));
    }

    // Show by default if no permission specified
    return true;
  });

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <Server className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-white">PaperPanel</h1>
            <p className="text-xs text-gray-400">v2.5.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleNavItems.map((item) => (
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
          <p>PaperPanel v2.6.4</p>
          <p className="mt-1">Powered by Paper</p>
        </div>
      </div>
    </aside>
  );
}
