package de.kaicraft.adminpanel.auth;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.config.ConfigManager;
import org.mindrot.jbcrypt.BCrypt;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Manages user authentication, password hashing, and session tokens
 */
public class AuthManager {
    private final ServerAdminPanelPlugin plugin;
    private final ConfigManager config;
    private final Map<String, String> users; // username -> hashed password
    private final Map<String, Role> userRoles; // username -> role
    private final Map<String, Set<Permission>> customPermissions; // username -> custom permissions (for CUSTOM role)
    private final Set<String> activeSessions; // active JWT tokens
    private final File usersFile;

    public AuthManager(ServerAdminPanelPlugin plugin, ConfigManager config) {
        this.plugin = plugin;
        this.config = config;
        this.users = new HashMap<>();
        this.userRoles = new HashMap<>();
        this.customPermissions = new HashMap<>();
        this.activeSessions = ConcurrentHashMap.newKeySet();
        this.usersFile = new File(plugin.getDataFolder(), "users.txt");

        initializeUsers();
    }

    /**
     * Initialize user database
     */
    private void initializeUsers() {
        if (!usersFile.exists()) {
            // Create default admin user
            String defaultUsername = config.getDefaultUsername();
            String defaultPassword = config.getDefaultPassword();
            String hashedPassword = hashPassword(defaultPassword);

            users.put(defaultUsername, hashedPassword);
            saveUsers();

            plugin.getLogger().info("Created default admin user: '" + defaultUsername + "' with default password. Please change the password!");
        } else {
            loadUsers();

            // Ensure default admin user exists
            String defaultUsername = config.getDefaultUsername();
            if (!users.containsKey(defaultUsername)) {
                plugin.getLogger().warning("Default admin user '" + defaultUsername + "' not found, recreating...");
                String defaultPassword = config.getDefaultPassword();
                String hashedPassword = hashPassword(defaultPassword);
                users.put(defaultUsername, hashedPassword);
                saveUsers();
                plugin.getLogger().info("Recreated default admin user with default password");
            }
        }
    }

    /**
     * Load users from file
     */
    private void loadUsers() {
        try {
            if (!usersFile.exists()) {
                return;
            }

            Files.readAllLines(usersFile.toPath()).forEach(line -> {
                String[] parts = line.split(":", -1);
                if (parts.length >= 2) {
                    String username = parts[0];
                    String hashedPassword = parts[1];
                    users.put(username, hashedPassword);
                    
                    // Load role (default to ADMIN for backward compatibility)
                    if (parts.length >= 3 && !parts[2].isEmpty()) {
                        userRoles.put(username, Role.fromKey(parts[2]));
                    } else {
                        userRoles.put(username, Role.ADMIN);
                    }
                    
                    // Load custom permissions for CUSTOM role
                    if (parts.length >= 4 && !parts[3].isEmpty() && userRoles.get(username) == Role.CUSTOM) {
                        Set<Permission> perms = new HashSet<>();
                        for (String permKey : parts[3].split(",")) {
                            Permission perm = Permission.fromKey(permKey.trim());
                            if (perm != null) {
                                perms.add(perm);
                            }
                        }
                        customPermissions.put(username, perms);
                    }
                }
            });

            plugin.getLogger().info("Loaded " + users.size() + " user(s)");
            
            // Perform migration if needed
            migrateUsersToRoles();
            
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to load users: " + e.getMessage());
        }
    }

    /**
     * Save users to file
     */
    private void saveUsers() {
        try {
            if (!usersFile.getParentFile().exists()) {
                usersFile.getParentFile().mkdirs();
            }

            try (FileWriter writer = new FileWriter(usersFile)) {
                for (Map.Entry<String, String> entry : users.entrySet()) {
                    String username = entry.getKey();
                    String hashedPassword = entry.getValue();
                    Role role = userRoles.getOrDefault(username, Role.ADMIN);
                    
                    StringBuilder line = new StringBuilder();
                    line.append(username).append(":").append(hashedPassword).append(":").append(role.getKey());
                    
                    // Save custom permissions if role is CUSTOM
                    if (role == Role.CUSTOM && customPermissions.containsKey(username)) {
                        line.append(":");
                        Set<Permission> perms = customPermissions.get(username);
                        line.append(perms.stream().map(Permission::getKey).collect(Collectors.joining(",")));
                    }
                    
                    line.append("\n");
                    writer.write(line.toString());
                }
            }
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to save users: " + e.getMessage());
        }
    }

    /**
     * Authenticate a user with username and password
     *
     * @param username The username
     * @param password The plain text password
     * @return JWT token if authentication successful, null otherwise
     */
    public String authenticate(String username, String password) {
        String hashedPassword = users.get(username);
        if (hashedPassword == null) {
            plugin.getLogger().warning("Login attempt for non-existent user: '" + username + "'");
            return null;
        }

        plugin.getLogger().info("Authenticating user '" + username + "' (hash starts with: " +
                hashedPassword.substring(0, Math.min(10, hashedPassword.length())) + "...)");

        if (checkPassword(password, hashedPassword)) {
            String token = JWTUtil.generateToken(
                    username,
                    config.getJwtSecret(),
                    config.getSessionTimeout()
            );
            activeSessions.add(token);
            plugin.getLogger().info("User '" + username + "' authenticated successfully");
            return token;
        }

        plugin.getLogger().warning("Failed login attempt for user '" + username + "' - password mismatch");
        return null;
    }

    /**
     * Verify a JWT token
     *
     * @param token The JWT token
     * @return The username if token is valid, null otherwise
     */
    public String verifyToken(String token) {
        try {
            if (!activeSessions.contains(token)) {
                return null;
            }

            return JWTUtil.verifyToken(token, config.getJwtSecret());
        } catch (Exception e) {
            activeSessions.remove(token);
            return null;
        }
    }

    /**
     * Logout a user by invalidating their token
     *
     * @param token The JWT token to invalidate
     */
    public void logout(String token) {
        activeSessions.remove(token);
    }

    /**
     * Add a new user
     *
     * @param username The username
     * @param password The plain text password
     * @return true if user was added, false if user already exists
     */
    public boolean addUser(String username, String password) {
        if (users.containsKey(username)) {
            return false;
        }

        users.put(username, hashPassword(password));
        userRoles.put(username, Role.VIEWER); // Default new users to VIEWER role
        saveUsers();
        plugin.getLogger().info("Added new user: " + username + " with VIEWER role");
        return true;
    }

    /**
     * Change a user's password
     *
     * @param username The username
     * @param newPassword The new plain text password
     * @return true if password was changed, false if user doesn't exist
     */
    public boolean changePassword(String username, String newPassword) {
        if (!users.containsKey(username)) {
            return false;
        }

        users.put(username, hashPassword(newPassword));
        saveUsers();
        plugin.getLogger().info("Changed password for user: " + username);
        return true;
    }

    /**
     * Remove a user
     *
     * @param username The username
     * @return true if user was removed, false if user doesn't exist
     */
    public boolean removeUser(String username) {
        if (users.remove(username) != null) {
            saveUsers();
            plugin.getLogger().info("Removed user: " + username);
            return true;
        }
        return false;
    }

    /**
     * Hash a password using BCrypt
     */
    private String hashPassword(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt(12));
    }

    /**
     * Check a password against a hash
     */
    private boolean checkPassword(String password, String hash) {
        try {
            return BCrypt.checkpw(password, hash);
        } catch (Exception e) {
            plugin.getLogger().severe("Password check failed with exception: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Clear all active sessions
     */
    public void clearSessions() {
        activeSessions.clear();
        plugin.getLogger().info("Cleared all active sessions");
    }

    /**
     * Get number of active sessions
     */
    public int getActiveSessionCount() {
        return activeSessions.size();
    }

    /**
     * Reset admin user to default password
     * Useful for troubleshooting login issues
     */
    public void resetAdminPassword() {
        String defaultUsername = config.getDefaultUsername();
        String defaultPassword = config.getDefaultPassword();
        String hashedPassword = hashPassword(defaultPassword);

        users.put(defaultUsername, hashedPassword);
        saveUsers();

        plugin.getLogger().info("Reset password for admin user '" + defaultUsername + "' to default password");
    }

    /**
     * Get all usernames
     *
     * @return List of all usernames
     */
    public List<String> getAllUsernames() {
        return new ArrayList<>(users.keySet());
    }

    /**
     * Check if a user is using the default password
     *
     * @param username The username to check
     * @return true if using default password, false otherwise
     */
    public boolean isUsingDefaultPassword(String username) {
        String defaultUsername = config.getDefaultUsername();
        String defaultPassword = config.getDefaultPassword();

        // Only check for default admin user
        if (!username.equals(defaultUsername)) {
            return false;
        }

        String hashedPassword = users.get(username);
        if (hashedPassword == null) {
            return false;
        }

        return checkPassword(defaultPassword, hashedPassword);
    }

    /**
     * Check if a username is the default admin user
     *
     * @param username The username to check
     * @return true if it's the default admin user
     */
    public boolean isDefaultAdmin(String username) {
        return username.equals(config.getDefaultUsername());
    }

    /**
     * Get the default admin username
     *
     * @return The default admin username
     */
    public String getDefaultAdminUsername() {
        return config.getDefaultUsername();
    }

    /**
     * Migrate users from old format to new format with roles
     */
    private void migrateUsersToRoles() {
        File backupFile = new File(plugin.getDataFolder(), "users.txt.backup");
        
        try {
            // Check if migration needed
            if (users.isEmpty()) {
                return;
            }
            
            boolean needsMigration = false;
            for (String username : users.keySet()) {
                if (!userRoles.containsKey(username)) {
                    needsMigration = true;
                    break;
                }
            }
            
            if (!needsMigration) {
                return;
            }
            
            // Backup old file
            if (usersFile.exists() && !backupFile.exists()) {
                Files.copy(usersFile.toPath(), backupFile.toPath());
                plugin.getLogger().info("Created backup of users.txt before role migration");
            }
            
            // Migrate all existing users to ADMIN role
            int migrated = 0;
            for (String username : users.keySet()) {
                if (!userRoles.containsKey(username)) {
                    userRoles.put(username, Role.ADMIN);
                    migrated++;
                    plugin.getLogger().info("Migrated user '" + username + "' to ADMIN role");
                }
            }
            
            if (migrated > 0) {
                saveUsers();
                plugin.getLogger().info("Successfully migrated " + migrated + " user(s) to role-based system");
            }
            
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to backup users file during migration: " + e.getMessage());
        }
    }

    /**
     * Check if a user exists
     */
    public boolean userExists(String username) {
        return users.containsKey(username);
    }

    /**
     * Get user's role
     */
    public Role getUserRole(String username) {
        return userRoles.getOrDefault(username, Role.VIEWER);
    }

    /**
     * Set user's role
     */
    public boolean setUserRole(String username, Role role) {
        if (!users.containsKey(username)) {
            return false;
        }
        
        Role oldRole = userRoles.get(username);
        userRoles.put(username, role);
        
        // Clear custom permissions if changing from CUSTOM role
        if (oldRole == Role.CUSTOM && role != Role.CUSTOM) {
            customPermissions.remove(username);
        }
        
        saveUsers();
        plugin.getLogger().info("Changed role for user '" + username + "' from " + 
            (oldRole != null ? oldRole.getKey() : "none") + " to " + role.getKey());
        return true;
    }

    /**
     * Get user's permissions (either from role or custom)
     */
    public Set<Permission> getUserPermissions(String username) {
        Role role = getUserRole(username);
        
        // ADMIN always has all permissions
        if (role == Role.ADMIN) {
            return new HashSet<>(Arrays.asList(Permission.values()));
        }
        
        // CUSTOM role uses custom permissions
        if (role == Role.CUSTOM) {
            return new HashSet<>(customPermissions.getOrDefault(username, new HashSet<>()));
        }
        
        // Other roles use default permissions
        return role.getDefaultPermissions();
    }

    /**
     * Set custom permissions for a user (automatically sets role to CUSTOM)
     */
    public boolean setUserPermissions(String username, Set<Permission> permissions) {
        if (!users.containsKey(username)) {
            return false;
        }
        
        // Remove SUPER_ADMIN from custom permissions (only ADMIN role can have it)
        permissions.remove(Permission.SUPER_ADMIN);
        
        userRoles.put(username, Role.CUSTOM);
        customPermissions.put(username, new HashSet<>(permissions));
        saveUsers();
        
        plugin.getLogger().info("Set custom permissions for user '" + username + "': " + permissions.size() + " permissions");
        return true;
    }

    /**
     * Check if user has a specific permission
     */
    public boolean hasPermission(String username, Permission permission) {
        if (!users.containsKey(username)) {
            return false;
        }
        
        // ADMIN role always has SUPER_ADMIN permission
        Role role = getUserRole(username);
        if (role == Role.ADMIN) {
            return true;
        }
        
        Set<Permission> userPerms = getUserPermissions(username);
        return userPerms.contains(permission);
    }
}
