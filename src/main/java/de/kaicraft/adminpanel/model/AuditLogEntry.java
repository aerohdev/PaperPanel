package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Represents a single audit log entry
 */
@TypeScriptType
public class AuditLogEntry {
    private final long timestamp;
    private final String category; // audit, security, api
    private final String level; // INFO, WARNING, SEVERE
    private final String username; // Extracted from message if possible
    private final String message;
    
    public AuditLogEntry(long timestamp, String category, String level, String username, String message) {
        this.timestamp = timestamp;
        this.category = category;
        this.level = level;
        this.username = username;
        this.message = message;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public String getCategory() {
        return category;
    }
    
    public String getLevel() {
        return level;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getMessage() {
        return message;
    }
}
