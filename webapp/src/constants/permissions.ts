/**
 * Permission constants matching the backend Permission enum
 * These define what actions users can perform in PaperPanel
 */

export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'view_dashboard',
  
  // Console
  VIEW_CONSOLE = 'view_console',
  EXECUTE_COMMANDS = 'execute_commands',
  
  // Players
  VIEW_PLAYERS = 'view_players',
  KICK_PLAYERS = 'kick_players',
  BAN_PLAYERS = 'ban_players',
  MESSAGE_PLAYERS = 'message_players',
  
  // Whitelist
  VIEW_WHITELIST = 'view_whitelist',
  MANAGE_WHITELIST = 'manage_whitelist',
  VIEW_OPS = 'view_ops',
  MANAGE_OPS = 'manage_ops',
  
  // Plugins
  VIEW_PLUGINS = 'view_plugins',
  MANAGE_PLUGINS = 'manage_plugins',
  
  // Worlds
  VIEW_WORLDS = 'view_worlds',
  MANAGE_WORLDS = 'manage_worlds',
  
  // Broadcast
  SEND_BROADCASTS = 'send_broadcasts',
  
  // Server Control
  RESTART_SERVER = 'restart_server',
  STOP_SERVER = 'stop_server',
  SAVE_SERVER = 'save_server',
  
  // Config
  VIEW_CONFIGS = 'view_configs',
  EDIT_CONFIGS = 'edit_configs',
  
  // Logs
  VIEW_LOGS = 'view_logs',
  
  // User Management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  
  // System (ADMIN only)
  SUPER_ADMIN = 'super_admin',
  
  // Updates
  MANAGE_UPDATES = 'manage_updates',
}

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  dashboard: 'Dashboard',
  console: 'Console',
  players: 'Players',
  whitelist: 'Whitelist & Ops',
  plugins: 'Plugins',
  worlds: 'Worlds',
  broadcast: 'Broadcast',
  server: 'Server Control',
  configs: 'Configuration',
  logs: 'Logs',
  users: 'User Management',
  system: 'System',
} as const;

/**
 * Permission metadata including display names and categories
 */
export const PERMISSION_INFO: Record<Permission, { displayName: string; category: string }> = {
  [Permission.VIEW_DASHBOARD]: { displayName: 'View Dashboard', category: 'dashboard' },
  [Permission.VIEW_CONSOLE]: { displayName: 'View Console', category: 'console' },
  [Permission.EXECUTE_COMMANDS]: { displayName: 'Execute Commands', category: 'console' },
  [Permission.VIEW_PLAYERS]: { displayName: 'View Players', category: 'players' },
  [Permission.KICK_PLAYERS]: { displayName: 'Kick Players', category: 'players' },
  [Permission.BAN_PLAYERS]: { displayName: 'Ban/Unban Players', category: 'players' },
  [Permission.MESSAGE_PLAYERS]: { displayName: 'Message Players', category: 'players' },
  [Permission.VIEW_WHITELIST]: { displayName: 'View Whitelist', category: 'whitelist' },
  [Permission.MANAGE_WHITELIST]: { displayName: 'Manage Whitelist', category: 'whitelist' },
  [Permission.VIEW_OPS]: { displayName: 'View Ops', category: 'whitelist' },
  [Permission.MANAGE_OPS]: { displayName: 'Manage Ops', category: 'whitelist' },
  [Permission.VIEW_PLUGINS]: { displayName: 'View Plugins', category: 'plugins' },
  [Permission.MANAGE_PLUGINS]: { displayName: 'Manage Plugins', category: 'plugins' },
  [Permission.VIEW_WORLDS]: { displayName: 'View Worlds', category: 'worlds' },
  [Permission.MANAGE_WORLDS]: { displayName: 'Manage Worlds', category: 'worlds' },
  [Permission.SEND_BROADCASTS]: { displayName: 'Send Broadcasts', category: 'broadcast' },
  [Permission.RESTART_SERVER]: { displayName: 'Restart Server', category: 'server' },
  [Permission.STOP_SERVER]: { displayName: 'Stop Server', category: 'server' },
  [Permission.SAVE_SERVER]: { displayName: 'Save Server', category: 'server' },
  [Permission.VIEW_CONFIGS]: { displayName: 'View Configs', category: 'configs' },
  [Permission.EDIT_CONFIGS]: { displayName: 'Edit Configs', category: 'configs' },
  [Permission.VIEW_LOGS]: { displayName: 'View Logs', category: 'logs' },
  [Permission.VIEW_USERS]: { displayName: 'View Users', category: 'users' },
  [Permission.MANAGE_USERS]: { displayName: 'Manage Users', category: 'users' },
  [Permission.MANAGE_ROLES]: { displayName: 'Manage Roles', category: 'users' },
  [Permission.SUPER_ADMIN]: { displayName: 'Super Admin', category: 'system' },
  [Permission.MANAGE_UPDATES]: { displayName: 'Manage Updates', category: 'dashboard' },
};

/**
 * Get permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  
  Object.entries(PERMISSION_INFO).forEach(([permission, info]) => {
    if (!grouped[info.category]) {
      grouped[info.category] = [];
    }
    grouped[info.category].push(permission as Permission);
  });
  
  return grouped;
}
