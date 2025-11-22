package de.kaicraft.adminpanel.auth;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import io.javalin.http.Handler;

import java.util.Map;

/**
 * Middleware for checking user permissions on API routes
 */
public class PermissionMiddleware {
    private final ServerAdminPanelPlugin plugin;
    private final AuthManager authManager;

    public PermissionMiddleware(ServerAdminPanelPlugin plugin, AuthManager authManager) {
        this.plugin = plugin;
        this.authManager = authManager;
    }

    /**
     * Create a permission check handler for a specific permission
     */
    public Handler requirePermission(Permission permission) {
        return ctx -> {
            String username = ctx.attribute("username");
            
            if (username == null) {
                ctx.status(401).json(Map.of(
                    "success", false,
                    "error", "Unauthorized",
                    "message", "Authentication required"
                ));
                ctx.skipRemainingHandlers();
                return;
            }

            if (!authManager.hasPermission(username, permission)) {
                plugin.getAuditLogger().logSecurityEvent(
                    username, 
                    "permission-denied: " + ctx.path() + " (" + permission.getKey() + ")", 
                    false
                );
                
                ctx.status(403).json(Map.of(
                    "success", false,
                    "error", "Forbidden",
                    "message", "You don't have permission to perform this action",
                    "required_permission", permission.getKey()
                ));
                ctx.skipRemainingHandlers();
                return;
            }
        };
    }
}
