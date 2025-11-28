package de.kaicraft.adminpanel.auth;

/**
 * Defines granular permissions for PaperPanel operations
 */
public enum Permission {
    // Dashboard
    VIEW_DASHBOARD("view_dashboard", "View Dashboard", "dashboard"),
    
    // Console
    VIEW_CONSOLE("view_console", "View Console", "console"),
    EXECUTE_COMMANDS("execute_commands", "Execute Commands", "console"),
    
    // Players
    VIEW_PLAYERS("view_players", "View Players", "players"),
    KICK_PLAYERS("kick_players", "Kick Players", "players"),
    BAN_PLAYERS("ban_players", "Ban/Unban Players", "players"),
    MESSAGE_PLAYERS("message_players", "Message Players", "players"),
    
    // Whitelist & Ops
    VIEW_WHITELIST("view_whitelist", "View Whitelist", "whitelist"),
    MANAGE_WHITELIST("manage_whitelist", "Manage Whitelist", "whitelist"),
    VIEW_OPS("view_ops", "View Operators", "whitelist"),
    MANAGE_OPS("manage_ops", "Manage Operators", "whitelist"),
    
    // Plugins
    VIEW_PLUGINS("view_plugins", "View Plugins", "plugins"),
    ENABLE_DISABLE_PLUGINS("enable_disable_plugins", "Enable/Disable Plugins", "plugins"),
    MANAGE_PLUGINS("manage_plugins", "Manage Plugins", "plugins"),
    
    // Worlds
    VIEW_WORLDS("view_worlds", "View Worlds", "worlds"),
    MANAGE_WORLDS("manage_worlds", "Manage World Settings", "worlds"),
    
    // Broadcast
    SEND_BROADCAST("send_broadcast", "Send Broadcasts", "broadcast"),
    SEND_BROADCASTS("send_broadcasts", "Send Broadcasts", "broadcast"),
    
    // Server Control
    VIEW_SERVER("view_server", "View Server Info", "server"),
    RESTART_SERVER("restart_server", "Restart Server", "server"),
    STOP_SERVER("stop_server", "Stop Server", "server"),
    SAVE_SERVER("save_server", "Save Server", "server"),
    MANAGE_UPDATES("manage_updates", "Manage Server Updates", "server"),
    
    // Config Editor
    VIEW_CONFIGS("view_configs", "View Config Files", "configs"),
    EDIT_CONFIGS("edit_configs", "Edit Config Files", "configs"),
    
    // Logs
    VIEW_LOGS("view_logs", "View Log Files", "logs"),
    
    // User Management
    VIEW_USERS("view_users", "View Panel Users", "users"),
    MANAGE_USERS("manage_users", "Manage Panel Users", "users"),
    
    // Role Management
    MANAGE_ROLES("manage_roles", "Manage Roles and Permissions", "roles"),

    // Backup Management
    CREATE_BACKUP("create_backup", "Create Backups", "backup"),
    DELETE_BACKUP("delete_backup", "Delete Backups", "backup"),
    DOWNLOAD_BACKUP("download_backup", "Download Backups", "backup"),
    MANAGE_AUTO_BACKUP("manage_auto_backup", "Manage Auto-Backup Settings", "backup"),

    // System Admin (cannot be revoked from ADMIN role)
    SUPER_ADMIN("super_admin", "Super Administrator", "system");

    private final String key;
    private final String displayName;
    private final String category;

    Permission(String key, String displayName, String category) {
        this.key = key;
        this.displayName = displayName;
        this.category = category;
    }

    public String getKey() {
        return key;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getCategory() {
        return category;
    }

    public static Permission fromKey(String key) {
        for (Permission permission : values()) {
            if (permission.key.equals(key)) {
                return permission;
            }
        }
        return null;
    }
}
