package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Authentication response model
 */
@TypeScriptType
public class AuthResponse {
    private String token;
    private String username;
    
    public AuthResponse(String token, String username) {
        this.token = token;
        this.username = username;
    }
    
    // Getters
    public String getToken() { return token; }
    public String getUsername() { return username; }
}
