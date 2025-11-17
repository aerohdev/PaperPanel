package de.kaicraft.adminpanel.auth;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.config.ConfigManager;
import org.mindrot.jbcrypt.BCrypt;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages user authentication, password hashing, and session tokens
 */
public class AuthManager {
    private final ServerAdminPanelPlugin plugin;
    private final ConfigManager config;
    private final Map<String, String> users; // username -> hashed password
    private final Set<String> activeSessions; // active JWT tokens
    private final File usersFile;

    public AuthManager(ServerAdminPanelPlugin plugin, ConfigManager config) {
        this.plugin = plugin;
        this.config = config;
        this.users = new HashMap<>();
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

            plugin.getLogger().info("Created default admin user. Please change the password!");
        } else {
            loadUsers();
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
                String[] parts = line.split(":", 2);
                if (parts.length == 2) {
                    users.put(parts[0], parts[1]);
                }
            });

            plugin.getLogger().info("Loaded " + users.size() + " user(s)");
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
                    writer.write(entry.getKey() + ":" + entry.getValue() + "\n");
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
            return null;
        }

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

        plugin.getLogger().warning("Failed login attempt for user '" + username + "'");
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
        saveUsers();
        plugin.getLogger().info("Added new user: " + username);
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
}
