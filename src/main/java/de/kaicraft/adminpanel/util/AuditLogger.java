package de.kaicraft.adminpanel.util;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;
import java.util.stream.Stream;

/**
 * Structured audit logging with daily rotation and retention policy
 * Creates separate log files for audit, security, and API events
 */
public class AuditLogger {
    private final ServerAdminPanelPlugin plugin;
    private final Logger auditLogger;
    private final Logger securityLogger;
    private final Logger apiLogger;
    
    private FileHandler auditFileHandler;
    private FileHandler securityFileHandler;
    private FileHandler apiFileHandler;
    
    private final File logsDir;
    private final boolean fileLoggingEnabled;
    private final boolean printStackTraces;
    private final int retentionDays;
    private final int auditMaxSizeMB;
    private final int securityMaxSizeMB;
    private final int apiMaxSizeMB;
    
    public AuditLogger(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        
        // Create logs directory
        this.logsDir = new File(plugin.getDataFolder(), "logs");
        if (!logsDir.exists()) {
            logsDir.mkdirs();
        }
        
        // Load configuration
        this.fileLoggingEnabled = plugin.getConfig().getBoolean("logging.file-logging-enabled", true);
        this.printStackTraces = plugin.getConfig().getBoolean("logging.print-stack-traces", false);
        this.retentionDays = plugin.getConfig().getInt("logging.rotation.retention-days", 7);
        this.auditMaxSizeMB = plugin.getConfig().getInt("logging.file-size-limits.audit-mb", 10);
        this.securityMaxSizeMB = plugin.getConfig().getInt("logging.file-size-limits.security-mb", 10);
        this.apiMaxSizeMB = plugin.getConfig().getInt("logging.file-size-limits.api-mb", 10);
        
        // Initialize loggers
        this.auditLogger = Logger.getLogger("ServerAdminPanel.Audit");
        this.securityLogger = Logger.getLogger("ServerAdminPanel.Security");
        this.apiLogger = Logger.getLogger("ServerAdminPanel.API");
        
        // Setup file handlers if enabled
        if (fileLoggingEnabled) {
            setupFileHandlers();
            cleanOldLogs();
        }
    }
    
    /**
     * Setup file handlers with daily rotation
     */
    private void setupFileHandlers() {
        try {
            String dateStr = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
            
            // Audit log handler
            String auditPath = new File(logsDir, "audit-" + dateStr + ".log").getAbsolutePath();
            auditFileHandler = new FileHandler(auditPath, auditMaxSizeMB * 1024 * 1024, 1, true);
            auditFileHandler.setFormatter(new SimpleFormatter());
            auditLogger.addHandler(auditFileHandler);
            auditLogger.setUseParentHandlers(false);
            
            // Security log handler
            String securityPath = new File(logsDir, "security-" + dateStr + ".log").getAbsolutePath();
            securityFileHandler = new FileHandler(securityPath, securityMaxSizeMB * 1024 * 1024, 1, true);
            securityFileHandler.setFormatter(new SimpleFormatter());
            securityLogger.addHandler(securityFileHandler);
            securityLogger.setUseParentHandlers(false);
            
            // API log handler
            String apiPath = new File(logsDir, "api-" + dateStr + ".log").getAbsolutePath();
            apiFileHandler = new FileHandler(apiPath, apiMaxSizeMB * 1024 * 1024, 1, true);
            apiFileHandler.setFormatter(new SimpleFormatter());
            apiLogger.addHandler(apiFileHandler);
            apiLogger.setUseParentHandlers(false);
            
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to setup audit log file handlers: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Clean up log files older than retention period
     */
    private void cleanOldLogs() {
        try {
            Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
            
            try (Stream<Path> paths = Files.list(logsDir.toPath())) {
                paths.filter(path -> {
                    try {
                        Instant fileTime = Files.getLastModifiedTime(path).toInstant();
                        return fileTime.isBefore(cutoff);
                    } catch (IOException e) {
                        return false;
                    }
                }).forEach(path -> {
                    try {
                        Files.delete(path);
                        plugin.getLogger().info("Deleted old log file: " + path.getFileName());
                    } catch (IOException e) {
                        plugin.getLogger().warning("Failed to delete old log file: " + path.getFileName());
                    }
                });
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Failed to clean old logs: " + e.getMessage());
        }
    }
    
    /**
     * Log a user action (e.g., kicked player, changed settings)
     * @param username The user performing the action
     * @param action The action performed
     * @param details Additional details about the action
     */
    public void logUserAction(String username, String action, String details) {
        String message = String.format("[AUDIT] User '%s' %s: %s", username, action, details);
        auditLogger.info(message);
        plugin.getLogger().info(message);
    }
    
    /**
     * Log a security event (authentication, authorization)
     * @param username The user involved in the event
     * @param event The security event description
     * @param success Whether the event was successful
     */
    public void logSecurityEvent(String username, String event, boolean success) {
        String message = String.format("[SECURITY] User '%s' - %s - %s", 
            username != null ? username : "unknown", 
            event, 
            success ? "ALLOWED" : "DENIED");
        
        if (success) {
            securityLogger.info(message);
            plugin.getLogger().info(message);
        } else {
            securityLogger.warning(message);
            plugin.getLogger().warning(message);
        }
    }
    
    /**
     * Log an API error
     * @param endpoint The API endpoint that failed
     * @param error The error message
     * @param exception The exception (optional)
     */
    public void logApiError(String endpoint, String error, Exception exception) {
        String message = String.format("[API] %s failed: %s", endpoint, error);
        apiLogger.severe(message);
        plugin.getLogger().severe(message);
        
        if (printStackTraces && exception != null) {
            exception.printStackTrace();
        }
    }
    
    /**
     * Log an API info message
     * @param endpoint The API endpoint
     * @param message The message
     */
    public void logApiInfo(String endpoint, String message) {
        String logMessage = String.format("[API] %s: %s", endpoint, message);
        apiLogger.info(logMessage);
    }
    
    /**
     * Close all file handlers
     */
    public void close() {
        if (auditFileHandler != null) {
            auditFileHandler.close();
        }
        if (securityFileHandler != null) {
            securityFileHandler.close();
        }
        if (apiFileHandler != null) {
            apiFileHandler.close();
        }
    }
    
    /**
     * Get the logs directory
     */
    public File getLogsDirectory() {
        return logsDir;
    }
}
