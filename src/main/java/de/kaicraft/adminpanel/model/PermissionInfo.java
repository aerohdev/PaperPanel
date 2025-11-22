package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Permission information response model
 */
@TypeScriptType
public class PermissionInfo {
    private String key;
    private String displayName;
    private String category;
    
    public PermissionInfo(String key, String displayName, String category) {
        this.key = key;
        this.displayName = displayName;
        this.category = category;
    }
    
    public String getKey() { return key; }
    public String getDisplayName() { return displayName; }
    public String getCategory() { return category; }
}
