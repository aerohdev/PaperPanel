package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Security status response model
 */
@TypeScriptType
public class SecurityStatus {
    private boolean usingDefaultPassword;
    
    public SecurityStatus(boolean usingDefaultPassword) {
        this.usingDefaultPassword = usingDefaultPassword;
    }
    
    // Getters
    public boolean isUsingDefaultPassword() { return usingDefaultPassword; }
}
