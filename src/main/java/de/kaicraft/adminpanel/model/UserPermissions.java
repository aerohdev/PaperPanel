package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;
import java.util.Set;

/**
 * User permissions response model
 */
@TypeScriptType
public class UserPermissions {
    private String username;
    private String role;
    private Set<String> permissions;
    
    public UserPermissions(String username, String role, Set<String> permissions) {
        this.username = username;
        this.role = role;
        this.permissions = permissions;
    }
    
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public Set<String> getPermissions() { return permissions; }
}
