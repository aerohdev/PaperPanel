package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * User information response model
 */
@TypeScriptType
public class UserInfo {
    private String username;
    private boolean isDefaultAdmin;
    private boolean usingDefaultPassword;
    
    public UserInfo(String username, boolean isDefaultAdmin, boolean usingDefaultPassword) {
        this.username = username;
        this.isDefaultAdmin = isDefaultAdmin;
        this.usingDefaultPassword = usingDefaultPassword;
    }
    
    // Getters
    public String getUsername() { return username; }
    public boolean isDefaultAdmin() { return isDefaultAdmin; }
    public boolean isUsingDefaultPassword() { return usingDefaultPassword; }
}
