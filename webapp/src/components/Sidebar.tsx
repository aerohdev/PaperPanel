import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Terminal, Package, Server, Users, Settings, Globe, Radio, Shield, FileText, FileCog, UserCheck, Key, ScrollText, Download } from 'lucide-react';
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
    { to: '/updates', icon: Download, label: 'Updates & Backups', anyPermission: [Permission.MANAGE_UPDATES, Permission.CREATE_BACKUP] },
    { to: '/users', icon: Shield, label: 'Users & Roles', anyPermission: [Permission.VIEW_USERS, Permission.MANAGE_ROLES] },
    { to: '/audit', icon: ScrollText, label: 'Audit Log', permission: Permission.MANAGE_ROLES },
  ];

  // Show loading state while permissions are being loaded
  if (isLoading) {
    return (
      <aside className="
        w-64
        bg-gradient-to-b from-gray-900/40 via-black/50 to-gray-900/40
        backdrop-blur-3xl backdrop-saturate-150
        border-r border-white/20
        flex flex-col
        shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15)]
      ">
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
    <aside className="
      w-64
      bg-gradient-to-b from-gray-900/40 via-black/50 to-gray-900/40
      backdrop-blur-3xl backdrop-saturate-150
      border-r border-white/20
      flex flex-col
      shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15)]
    ">
      {/* Navigation with AnimatedList */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <motion.ul
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {visibleNavItems.map((item, index) => (
              <motion.li
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500/20 to-accent-purple/20 text-primary-400 shadow-elevated border border-primary-500/30'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-primary-400 border border-transparent hover:border-primary-500/20'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <div className="text-xs text-gray-400 text-center">
          <p>PaperPanel v3.8.1</p>
          <p className="mt-1">Powered by Paper</p>
        </div>
      </div>
    </aside>
  );
}
