import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Terminal, Package, Server, Users, Settings, Globe, Radio, Shield, FileText, FileCog, UserCheck, Key, ScrollText } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';
import { Permission } from '../constants/permissions';
import { motion } from 'framer-motion';

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
      <aside className="w-64 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border flex flex-col shadow-medium dark:shadow-dark-medium">
        <div className="px-6 py-4 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20">
              <Server className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-purple bg-clip-text text-transparent">PaperPanel</h1>
              <p className="text-xs text-light-text-muted dark:text-dark-text-muted">v3.2.2</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <div className="text-light-text-muted dark:text-dark-text-muted text-center py-4">Loading...</div>
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
    <aside className="w-64 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border flex flex-col shadow-medium dark:shadow-dark-medium">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-light-border dark:border-dark-border">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 shadow-glow">
            <Server className="w-8 h-8 text-primary-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-purple bg-clip-text text-transparent">PaperPanel</h1>
            <p className="text-xs text-light-text-muted dark:text-dark-text-muted">v3.2.2</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-light-border dark:scrollbar-thumb-dark-border scrollbar-track-transparent hover:scrollbar-thumb-light-text-muted dark:hover:scrollbar-thumb-dark-text-muted">
        <ul className="space-y-2">
          {visibleNavItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-accent-purple/20 text-primary-500 shadow-soft dark:shadow-dark-soft border border-primary-500/30'
                      : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-card dark:hover:bg-dark-card hover:text-primary-500 border border-transparent'
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
      <div className="p-4 border-t border-light-border dark:border-dark-border">
        <div className="text-xs text-light-text-muted dark:text-dark-text-muted text-center">
          <p>PaperPanel v3.2.2</p>
          <p className="mt-1">Powered by Paper</p>
        </div>
      </div>
    </aside>
  );
}
