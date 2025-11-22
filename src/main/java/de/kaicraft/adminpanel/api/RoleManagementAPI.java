package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.auth.AuthManager;
import de.kaicraft.adminpanel.auth.Permission;
import de.kaicraft.adminpanel.auth.Role;
import de.kaicraft.adminpanel.model.PermissionInfo;
import de.kaicraft.adminpanel.model.RoleInfo;
import de.kaicraft.adminpanel.model.UserPermissions;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;

import java.util.*;
import java.util.stream.Collectors;

/**
 * API for role and permission management
 */
public class RoleManagementAPI {
    private final ServerAdminPanelPlugin plugin;
    private final AuthManager authManager;

    public RoleManagementAPI(ServerAdminPanelPlugin plugin, AuthManager authManager) {
        this.plugin = plugin;
        this.authManager = authManager;
    }

    /**
     * GET /api/v1/roles
     * Get all available roles
     */
    @TypeScriptEndpoint(path = "GET /api/v1/roles", responseType = "{ roles: RoleInfo[] }")
    public void getRoles(Context ctx) {
        try {
            List<RoleInfo> roles = new ArrayList<>();
            
            for (Role role : Role.values()) {
                Set<String> permissionKeys = role.getDefaultPermissions().stream()
                    .map(Permission::getKey)
                    .collect(Collectors.toSet());
                
                roles.add(new RoleInfo(
                    role.getKey(),
                    role.getDisplayName(),
                    role.getDescription(),
                    permissionKeys
                ));
            }
            
            ctx.json(ApiResponse.success("roles", roles));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/roles", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve roles"));
        }
    }

    /**
     * GET /api/v1/permissions
     * Get all available permissions
     */
    @TypeScriptEndpoint(path = "GET /api/v1/permissions", responseType = "{ permissions: PermissionInfo[] }")
    public void getPermissions(Context ctx) {
        try {
            List<PermissionInfo> permissions = new ArrayList<>();
            
            for (Permission permission : Permission.values()) {
                // Don't expose SUPER_ADMIN in the list (it's automatically granted to ADMIN)
                if (permission != Permission.SUPER_ADMIN) {
                    permissions.add(new PermissionInfo(
                        permission.getKey(),
                        permission.getDisplayName(),
                        permission.getCategory()
                    ));
                }
            }
            
            ctx.json(ApiResponse.success("permissions", permissions));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/permissions", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve permissions"));
        }
    }

    /**
     * GET /api/v1/users/{username}/permissions
     * Get a user's role and permissions
     */
    @TypeScriptEndpoint(path = "GET /api/v1/users/{username}/permissions", responseType = "UserPermissions")
    public void getUserPermissions(Context ctx) {
        try {
            String username = ctx.pathParam("username");
            String currentUser = ctx.attribute("username");
            
            if (!authManager.userExists(username)) {
                ctx.status(404).json(ApiResponse.error("User not found"));
                return;
            }
            
            Role role = authManager.getUserRole(username);
            Set<Permission> permissions = authManager.getUserPermissions(username);
            Set<String> permissionKeys = permissions.stream()
                .map(Permission::getKey)
                .collect(Collectors.toSet());
            
            UserPermissions userPerms = new UserPermissions(username, role.getKey(), permissionKeys);
            
            plugin.getAuditLogger().logApiInfo("GET /api/v1/users/" + username + "/permissions", 
                "User '" + currentUser + "' viewed permissions for '" + username + "'");
            
            ctx.json(ApiResponse.success(userPerms));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/users/{username}/permissions", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve user permissions"));
        }
    }

    /**
     * PUT /api/v1/users/{username}/role
     * Change a user's role
     */
    @TypeScriptEndpoint(path = "PUT /api/v1/users/{username}/role", responseType = "{ message: string }")
    public void setUserRole(Context ctx) {
        try {
            String username = ctx.pathParam("username");
            String currentUser = ctx.attribute("username");
            
            @SuppressWarnings("unchecked")
            Map<String, String> data = ctx.bodyAsClass(Map.class);
            String roleKey = data.get("role");
            
            if (roleKey == null || roleKey.trim().isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Role is required"));
                return;
            }
            
            if (!authManager.userExists(username)) {
                ctx.status(404).json(ApiResponse.error("User not found"));
                return;
            }
            
            // Prevent changing default admin's role
            if (authManager.isDefaultAdmin(username)) {
                ctx.status(403).json(ApiResponse.error("Cannot change role of default admin user"));
                return;
            }
            
            // Prevent users from changing their own role
            if (username.equals(currentUser)) {
                ctx.status(403).json(ApiResponse.error("Cannot change your own role"));
                return;
            }
            
            Role role = Role.fromKey(roleKey);
            if (authManager.setUserRole(username, role)) {
                plugin.getAuditLogger().logUserAction(currentUser, "change-user-role", 
                    username + " -> " + role.getDisplayName());
                ctx.json(ApiResponse.successMessage("User role updated successfully"));
            } else {
                ctx.status(500).json(ApiResponse.error("Failed to update user role"));
            }
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("PUT /api/v1/users/{username}/role", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to update user role"));
        }
    }

    /**
     * PUT /api/v1/users/{username}/permissions
     * Set custom permissions for a user (sets role to CUSTOM)
     */
    @TypeScriptEndpoint(path = "PUT /api/v1/users/{username}/permissions", responseType = "{ message: string }")
    public void setUserPermissions(Context ctx) {
        try {
            String username = ctx.pathParam("username");
            String currentUser = ctx.attribute("username");
            
            @SuppressWarnings("unchecked")
            Map<String, List<String>> data = ctx.bodyAsClass(Map.class);
            List<String> permissionKeys = data.get("permissions");
            
            if (permissionKeys == null) {
                ctx.status(400).json(ApiResponse.error("Permissions list is required"));
                return;
            }
            
            if (!authManager.userExists(username)) {
                ctx.status(404).json(ApiResponse.error("User not found"));
                return;
            }
            
            // Prevent changing default admin's permissions
            if (authManager.isDefaultAdmin(username)) {
                ctx.status(403).json(ApiResponse.error("Cannot change permissions of default admin user"));
                return;
            }
            
            // Prevent users from changing their own permissions
            if (username.equals(currentUser)) {
                ctx.status(403).json(ApiResponse.error("Cannot change your own permissions"));
                return;
            }
            
            // Convert permission keys to Permission objects
            Set<Permission> permissions = new HashSet<>();
            for (String key : permissionKeys) {
                Permission perm = Permission.fromKey(key);
                if (perm != null && perm != Permission.SUPER_ADMIN) {
                    permissions.add(perm);
                }
            }
            
            if (authManager.setUserPermissions(username, permissions)) {
                plugin.getAuditLogger().logUserAction(currentUser, "change-user-permissions", 
                    username + " -> " + permissions.size() + " custom permissions");
                ctx.json(ApiResponse.successMessage("User permissions updated successfully"));
            } else {
                ctx.status(500).json(ApiResponse.error("Failed to update user permissions"));
            }
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("PUT /api/v1/users/{username}/permissions", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to update user permissions"));
        }
    }
}
