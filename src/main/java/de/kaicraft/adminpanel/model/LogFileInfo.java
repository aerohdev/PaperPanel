package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Log file information response model
 */
@TypeScriptType
public class LogFileInfo {
    private String name;
    private String type; // audit, security, api
    private long size;
    private long modified;
    private int lines;
    
    public LogFileInfo(String name, String type, long size, long modified, int lines) {
        this.name = name;
        this.type = type;
        this.size = size;
        this.modified = modified;
        this.lines = lines;
    }
    
    // Getters
    public String getName() { return name; }
    public String getType() { return type; }
    public long getSize() { return size; }
    public long getModified() { return modified; }
    public int getLines() { return lines; }
}
