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
      <aside className="w-64 bg-white dark:bg-gradient-to-b dark:from-[#0a0a0a] dark:to-[#121212] border-r border-light-border dark:border-[#2a2a2a] flex flex-col shadow-medium dark:shadow-dark-medium">
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
    <aside className="w-64 bg-white dark:bg-gradient-to-b dark:from-[#0a0a0a] dark:to-[#121212] border-r border-light-border dark:border-[#2a2a2a] flex flex-col shadow-medium dark:shadow-dark-medium">
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {visibleNavItems.map((item, index) => (
            <motion.li
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-accent-purple/20 text-primary-500 shadow-elevated border border-primary-500/30'
                      : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-hover dark:hover:bg-[#1a1a1a] hover:text-primary-500 hover:shadow-card-hover border border-transparent hover:border-primary-500/20'
                  }`
                }
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className="w-5 h-5" />
                </motion.div>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-light-border dark:border-[#2a2a2a]">
        <div className="text-xs text-light-text-muted dark:text-dark-text-muted text-center">
          <p>PaperPanel v3.4.0</p>
          <p className="mt-1">Powered by Paper</p>
        </div>
      </div>
    </aside>
  );
}
