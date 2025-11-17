package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.auth.AuthManager;
import io.javalin.http.Context;

import java.util.Map;

/**
 * API endpoints for authentication (login, logout)
 */
public class AuthAPI {
    private final ServerAdminPanelPlugin plugin;
    private final AuthManager authManager;
    private final Gson gson;

    public AuthAPI(ServerAdminPanelPlugin plugin, AuthManager authManager) {
        this.plugin = plugin;
        this.authManager = authManager;
        this.gson = new Gson();
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token
     */
    public void login(Context ctx) {
        try {
            // Parse request body
            String body = ctx.body();
            @SuppressWarnings("unchecked")
            Map<String, String> credentials = gson.fromJson(body, Map.class);

            String username = credentials.get("username");
            String password = credentials.get("password");

            // Validate input
            if (username == null || username.isEmpty() || password == null || password.isEmpty()) {
                ctx.status(400).json(Map.of(
                        "success", false,
                        "error", "Bad Request",
                        "message", "Username and password are required"
                ));
                return;
            }

            // Authenticate
            String token = authManager.authenticate(username, password);

            if (token != null) {
                ctx.status(200).json(Map.of(
                        "success", true,
                        "token", token,
                        "username", username
                ));
            } else {
                ctx.status(401).json(Map.of(
                        "success", false,
                        "error", "Unauthorized",
                        "message", "Invalid username or password"
                ));
            }
        } catch (Exception e) {
            plugin.getLogger().severe("Error during login: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "An error occurred during login"
            ));
        }
    }

    /**
     * POST /api/auth/logout
     * Invalidate user's JWT token
     */
    public void logout(Context ctx) {
        try {
            String token = ctx.attribute("token");
            String username = ctx.attribute("username");

            if (token != null) {
                authManager.logout(token);
                plugin.getLogger().info("User '" + username + "' logged out");
            }

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Logged out successfully"
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error during logout: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "An error occurred during logout"
            ));
        }
    }

    /**
     * GET /api/auth/verify
     * Verify if current token is valid
     */
    public void verify(Context ctx) {
        String username = ctx.attribute("username");
        ctx.status(200).json(Map.of(
                "success", true,
                "valid", true,
                "username", username
        ));
    }
}
