package de.kaicraft.adminpanel.auth;

import java.util.*;

/**
 * Defines user roles with preset permission sets
 */
public enum Role {
    ADMIN("admin", "Administrator", "Full access to all features", 
        Permission.SUPER_ADMIN), // Admin gets all permissions automatically
    
    MODERATOR("moderator", "Moderator", "Manage players and view server info",
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_CONSOLE,
        Permission.VIEW_PLAYERS,
        Permission.KICK_PLAYERS,
        Permission.BAN_PLAYERS,
        Permission.MESSAGE_PLAYERS,
        Permission.VIEW_WHITELIST,
        Permission.MANAGE_WHITELIST,
        Permission.VIEW_OPS,
        Permission.SEND_BROADCAST,
        Permission.VIEW_WORLDS,
        Permission.VIEW_SERVER,
        Permission.VIEW_LOGS,
        Permission.VIEW_PLUGINS
    ),
    
    SUPPORT("support", "Support", "Help players and view information",
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_CONSOLE,
        Permission.VIEW_PLAYERS,
        Permission.MESSAGE_PLAYERS,
        Permission.VIEW_WHITELIST,
        Permission.VIEW_OPS,
        Permission.SEND_BROADCAST,
        Permission.VIEW_WORLDS,
        Permission.VIEW_SERVER,
        Permission.VIEW_LOGS,
        Permission.VIEW_PLUGINS
    ),
    
    VIEWER("viewer", "Viewer", "Read-only access to most features",
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_CONSOLE,
        Permission.VIEW_PLAYERS,
        Permission.VIEW_WHITELIST,
        Permission.VIEW_OPS,
        Permission.VIEW_WORLDS,
        Permission.VIEW_SERVER,
        Permission.VIEW_LOGS,
        Permission.VIEW_PLUGINS
    ),
    
    CUSTOM("custom", "Custom", "Custom permission set");

    private final String key;
    private final String displayName;
    private final String description;
    private final Set<Permission> defaultPermissions;
    private final boolean isAdmin;

    Role(String key, String displayName, String description, Permission... permissions) {
        this.key = key;
        this.displayName = displayName;
        this.description = description;
        this.isAdmin = "admin".equals(key);
        this.defaultPermissions = new HashSet<>(Arrays.asList(permissions));
    }

    public String getKey() {
        return key;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public Set<Permission> getDefaultPermissions() {
        // Admin gets all permissions automatically
        if (isAdmin) {
            return new HashSet<>(Arrays.asList(Permission.values()));
        }
        return new HashSet<>(defaultPermissions);
    }

    public static Role fromKey(String key) {
        for (Role role : values()) {
            if (role.key.equalsIgnoreCase(key)) {
                return role;
            }
        }
        return CUSTOM;
    }
}
