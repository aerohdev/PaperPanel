package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;
import java.util.List;

/**
 * Log search match response model
 */
@TypeScriptType
public class LogMatch {
    private int lineNumber;
    private String line;
    private String file;
    
    public LogMatch(int lineNumber, String line, String file) {
        this.lineNumber = lineNumber;
        this.line = line;
        this.file = file;
    }
    
    // Getters
    public int getLineNumber() { return lineNumber; }
    public String getLine() { return line; }
    public String getFile() { return file; }
}
