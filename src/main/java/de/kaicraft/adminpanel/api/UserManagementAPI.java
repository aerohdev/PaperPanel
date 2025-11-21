package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.auth.AuthManager;
import io.javalin.http.Context;

import java.util.*;
import java.util.regex.Pattern;

/**
 * API for user management operations
 */
public class UserManagementAPI {
    private final ServerAdminPanelPlugin plugin;
    private final AuthManager authManager;
    private final Gson gson;
    
    // Password requirements
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*(),.?\":{}|<>]");

    public UserManagementAPI(ServerAdminPanelPlugin plugin, AuthManager authManager) {
        this.plugin = plugin;
        this.authManager = authManager;
        this.gson = new Gson();
    }

    /**
     * Get all users
     */
    public void getUsers(Context ctx) {
        try {
            String currentUser = (String) ctx.attribute("username");
            List<String> usernames = authManager.getAllUsernames();
            
            List<Map<String, Object>> users = new ArrayList<>();
            for (String username : usernames) {
                Map<String, Object> user = new HashMap<>();
                user.put("username", username);
                user.put("isCurrentUser", username.equals(currentUser));
                user.put("isDefaultAdmin", authManager.isDefaultAdmin(username));
                users.add(user);
            }
            
            plugin.getLogger().info("User '" + currentUser + "' listed all users (" + users.size() + " total)");
            
            ctx.json(Map.of(
                "success", true,
                "users", users
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting users: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Failed to retrieve users"
            ));
        }
    }

    /**
     * Create a new user
     */
    public void createUser(Context ctx) {
        try {
            String currentUser = (String) ctx.attribute("username");
            Map<String, String> data = gson.fromJson(ctx.body(), Map.class);
            
            String username = data.get("username");
            String password = data.get("password");
            
            // Validation
            if (username == null || username.trim().isEmpty()) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", "Username is required"
                ));
                return;
            }
            
            if (password == null || password.isEmpty()) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", "Password is required"
                ));
                return;
            }
            
            // Validate password strength
            String passwordError = validatePassword(password);
            if (passwordError != null) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", passwordError
                ));
                return;
            }
            
            // Attempt to create user
            if (authManager.addUser(username, password)) {
                plugin.getLogger().info("User '" + currentUser + "' created new user: '" + username + "'");
                ctx.json(Map.of(
                    "success", true,
                    "message", "User created successfully"
                ));
            } else {
                ctx.status(409).json(Map.of(
                    "success", false,
                    "message", "User already exists"
                ));
            }
        } catch (Exception e) {
            plugin.getLogger().severe("Error creating user: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Failed to create user"
            ));
        }
    }

    /**
     * Change user password
     */
    public void changePassword(Context ctx) {
        try {
            String currentUser = (String) ctx.attribute("username");
            String targetUsername = ctx.pathParam("username");
            Map<String, String> data = gson.fromJson(ctx.body(), Map.class);
            
            String newPassword = data.get("password");
            
            // Validation
            if (newPassword == null || newPassword.isEmpty()) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", "Password is required"
                ));
                return;
            }
            
            // Permission check: Regular users can only change their own password
            // Default admin can change any password (including their own)
            boolean isCurrentUserDefaultAdmin = authManager.isDefaultAdmin(currentUser);
            boolean isSelfPasswordChange = targetUsername.equals(currentUser);
            boolean isTargetDefaultAdmin = authManager.isDefaultAdmin(targetUsername);
            
            if (!isCurrentUserDefaultAdmin) {
                // Regular user trying to change password
                if (!isSelfPasswordChange) {
                    // Trying to change someone else's password
                    plugin.getLogger().warning("User '" + currentUser + "' attempted to change password for '" + targetUsername + "' (denied - not admin)");
                    ctx.status(403).json(Map.of(
                        "success", false,
                        "message", "You can only change your own password"
                    ));
                    return;
                }
                
                if (isTargetDefaultAdmin) {
                    // This should never happen (same as above), but extra safety
                    plugin.getLogger().warning("User '" + currentUser + "' attempted to change default admin password (denied)");
                    ctx.status(403).json(Map.of(
                        "success", false,
                        "message", "You cannot change the default admin password"
                    ));
                    return;
                }
            }
            
            // Validate password strength
            String passwordError = validatePassword(newPassword);
            if (passwordError != null) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", passwordError
                ));
                return;
            }
            
            // Attempt to change password
            if (authManager.changePassword(targetUsername, newPassword)) {
                if (isSelfPasswordChange) {
                    plugin.getLogger().info("User '" + currentUser + "' changed their own password");
                } else {
                    plugin.getLogger().info("Admin '" + currentUser + "' changed password for user: '" + targetUsername + "'");
                }
                ctx.json(Map.of(
                    "success", true,
                    "message", "Password changed successfully"
                ));
            } else {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "message", "User not found"
                ));
            }
        } catch (Exception e) {
            plugin.getLogger().severe("Error changing password: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Failed to change password"
            ));
        }
    }

    /**
     * Delete a user
     */
    public void deleteUser(Context ctx) {
        try {
            String currentUser = (String) ctx.attribute("username");
            String targetUsername = ctx.pathParam("username");
            
            // Prevent self-deletion
            if (targetUsername.equals(currentUser)) {
                ctx.status(403).json(Map.of(
                    "success", false,
                    "message", "You cannot delete your own account"
                ));
                return;
            }
            
            // Prevent deletion of last user
            List<String> allUsers = authManager.getAllUsernames();
            if (allUsers.size() <= 1) {
                ctx.status(403).json(Map.of(
                    "success", false,
                    "message", "Cannot delete the last user"
                ));
                return;
            }
            
            // Prevent deletion of default admin user
            if (authManager.isDefaultAdmin(targetUsername)) {
                ctx.status(403).json(Map.of(
                    "success", false,
                    "message", "The default admin user cannot be deleted"
                ));
                return;
            }
            
            // Attempt to delete user
            if (authManager.removeUser(targetUsername)) {
                plugin.getLogger().warning("User '" + currentUser + "' deleted user: '" + targetUsername + "'");
                ctx.json(Map.of(
                    "success", true,
                    "message", "User deleted successfully"
                ));
            } else {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "message", "User not found"
                ));
            }
        } catch (Exception e) {
            plugin.getLogger().severe("Error deleting user: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Failed to delete user"
            ));
        }
    }

    /**
     * Validate password strength
     * Requirements: Min 8 chars, uppercase, lowercase, digit, special char
     * 
     * @param password The password to validate
     * @return Error message if invalid, null if valid
     */
    private String validatePassword(String password) {
        if (password.length() < MIN_PASSWORD_LENGTH) {
            return "Password must be at least " + MIN_PASSWORD_LENGTH + " characters long";
        }
        
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            return "Password must contain at least one uppercase letter";
        }
        
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            return "Password must contain at least one lowercase letter";
        }
        
        if (!DIGIT_PATTERN.matcher(password).find()) {
            return "Password must contain at least one digit";
        }
        
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            return "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)";
        }
        
        return null; // Valid
    }
}