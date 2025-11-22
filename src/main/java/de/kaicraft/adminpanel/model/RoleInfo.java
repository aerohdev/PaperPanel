package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;
import java.util.Set;

/**
 * Role information response model
 */
@TypeScriptType
public class RoleInfo {
    private String key;
    private String displayName;
    private String description;
    private Set<String> permissions;
    
    public RoleInfo(String key, String displayName, String description, Set<String> permissions) {
        this.key = key;
        this.displayName = displayName;
        this.description = description;
        this.permissions = permissions;
    }
    
    public String getKey() { return key; }
    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
    public Set<String> getPermissions() { return permissions; }
}
