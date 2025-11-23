package de.kaicraft.adminpanel.auth;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import io.javalin.http.Handler;

import java.util.Map;

/**
 * Middleware for authenticating API requests using JWT tokens
 */
public class AuthMiddleware {
    private final ServerAdminPanelPlugin plugin;
    private final AuthManager authManager;

    public AuthMiddleware(ServerAdminPanelPlugin plugin, AuthManager authManager) {
        this.plugin = plugin;
        this.authManager = authManager;
    }

    /**
     * Handle authentication for protected routes
     */
    public void handle(Context ctx) {
        // Skip authentication for login endpoint
        if (ctx.path().equals("/api/v1/auth/login")) {
            return;
        }

        String authHeader = ctx.header("Authorization");

        // Check if Authorization header is present
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ctx.status(401).json(Map.of(
                    "success", false,
                    "error", "Unauthorized",
                    "message", "Missing or invalid Authorization header"
            ));
            return;
        }

        // Extract token
        String token = authHeader.substring(7);

        // Verify token
        String username = authManager.verifyToken(token);
        if (username == null) {
            ctx.status(401).json(Map.of(
                    "success", false,
                    "error", "Unauthorized",
                    "message", "Invalid or expired token"
            ));
            return;
        }

        // Store username in context for use in handlers
        ctx.attribute("username", username);
        ctx.attribute("token", token);
        
        // Log successful auth
        plugin.getAuditLogger().logApiInfo(ctx.path(), "Authenticated request from user: " + username);
    }

    /**
     * Create a Javalin Handler from this middleware
     */
    public Handler asHandler() {
        return this::handle;
    }
}
