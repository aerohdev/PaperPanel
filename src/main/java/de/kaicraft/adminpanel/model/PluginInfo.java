package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Plugin information response model
 */
@TypeScriptType
public class PluginInfo {
    private String name;
    private String version;
    private String description;
    private String author;
    private String website;
    private boolean enabled;
    
    public PluginInfo(String name, String version, String description, String author, 
                     String website, boolean enabled) {
        this.name = name;
        this.version = version;
        this.description = description;
        this.author = author;
        this.website = website;
        this.enabled = enabled;
    }
    
    // Getters
    public String getName() { return name; }
    public String getVersion() { return version; }
    public String getDescription() { return description; }
    public String getAuthor() { return author; }
    public String getWebsite() { return website; }
    public boolean isEnabled() { return enabled; }
}
