package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.auth.AuthManager;
import de.kaicraft.adminpanel.model.AuthResponse;
import de.kaicraft.adminpanel.model.SecurityStatus;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
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
     * POST /api/v1/auth/login
     * Authenticate user and return JWT token
     */
    @TypeScriptEndpoint(path = "/api/v1/auth/login", method = "POST", description = "Authenticate user")
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
                ctx.status(400).json(ApiResponse.error("Username and password are required"));
                return;
            }

            // Authenticate
            String token = authManager.authenticate(username, password);

            if (token != null) {
                plugin.getAuditLogger().logSecurityEvent(username, "login", true);
                AuthResponse authResponse = new AuthResponse(token, username);
                ctx.status(200).json(ApiResponse.success(authResponse));
            } else {
                plugin.getAuditLogger().logSecurityEvent(username, "login attempt", false);
                ctx.status(401).json(ApiResponse.error("Invalid username or password", "Unauthorized"));
            }
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/auth/login", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("An error occurred during login"));
        }
    }

    /**
     * POST /api/v1/auth/logout
     * Invalidate user's JWT token
     */
    @TypeScriptEndpoint(path = "/api/v1/auth/logout", method = "POST", description = "Logout user")
    public void logout(Context ctx) {
        try {
            String token = ctx.attribute("token");
            String username = ctx.attribute("username");

            if (token != null) {
                authManager.logout(token);
                plugin.getAuditLogger().logSecurityEvent(username, "logout", true);
            }

            ctx.status(200).json(ApiResponse.successMessage("Logged out successfully"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/auth/logout", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("An error occurred during logout"));
        }
    }

    /**
     * GET /api/v1/auth/verify
     * Verify if current token is valid
     */
    @TypeScriptEndpoint(path = "/api/v1/auth/verify", method = "GET", description = "Verify token")
    public void verify(Context ctx) {
        String username = ctx.attribute("username");
        if (username == null) {
            ctx.status(401).json(Map.of(
                    "success", false,
                    "valid", false,
                    "message", "Invalid or missing token"
            ));
            return;
        }
        ctx.status(200).json(Map.of(
                "success", true,
                "valid", true,
                "username", username
        ));
    }

    /**
     * GET /api/v1/auth/security-status
     * Check security status (default password warning)
     */
    @TypeScriptEndpoint(path = "/api/v1/auth/security-status", method = "GET", description = "Get security status")
    public void getSecurityStatus(Context ctx) {
        try {
            String username = (String) ctx.attribute("username");

            // If username is null, user is not authenticated
            if (username == null) {
                ctx.status(401).json(ApiResponse.error("Not authenticated"));
                return;
            }

            boolean usingDefaultPassword = authManager.isUsingDefaultPassword(username);

            SecurityStatus status = new SecurityStatus(usingDefaultPassword);
            ctx.json(ApiResponse.success("securityStatus", status));

        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/auth/security-status", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to check security status"));
        }
    }
}
