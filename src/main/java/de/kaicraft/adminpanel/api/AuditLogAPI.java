package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.model.AuditLogEntry;
import de.kaicraft.adminpanel.util.ApiResponse;
import io.javalin.http.Context;

import java.io.*;
import java.nio.file.Files;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * API for viewing audit log entries
 */
public class AuditLogAPI {
    private final ServerAdminPanelPlugin plugin;
    private final File logsDir;
    
    // Pattern to parse log entries: timestamp level [category] message
    private static final Pattern LOG_PATTERN = Pattern.compile(
        "^(\\w{3} \\d{1,2}, \\d{4} \\d{1,2}:\\d{2}:\\d{2} [AP]M) (.+?) \\[([A-Z]+)\\] (.+)$"
    );
    
    private static final SimpleDateFormat LOG_DATE_FORMAT = new SimpleDateFormat("MMM d, yyyy h:mm:ss a", Locale.ENGLISH);
    
    public AuditLogAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.logsDir = new File(plugin.getDataFolder(), "logs");
    }
    
    /**
     * GET /api/v1/audit/entries
     * Retrieve audit log entries with optional filtering
     */
    public void getAuditEntries(Context ctx) {
        try {
            String category = ctx.queryParam("category"); // audit, security, api
            String username = ctx.queryParam("username");
            String search = ctx.queryParam("search");
            int limit = ctx.queryParamAsClass("limit", Integer.class).getOrDefault(100);
            int offset = ctx.queryParamAsClass("offset", Integer.class).getOrDefault(0);
            
            List<AuditLogEntry> entries = new ArrayList<>();
            
            // Determine which log files to read
            List<String> filePatterns = new ArrayList<>();
            if (category == null || category.isEmpty() || category.equals("all")) {
                filePatterns.add("audit-");
                filePatterns.add("security-");
                filePatterns.add("api-");
            } else if (category.equals("audit")) {
                filePatterns.add("audit-");
            } else if (category.equals("security")) {
                filePatterns.add("security-");
            } else if (category.equals("api")) {
                filePatterns.add("api-");
            }
            
            // Read matching log files
            File[] logFiles = logsDir.listFiles();
            if (logFiles != null) {
                // Sort files by modified time (newest first)
                Arrays.sort(logFiles, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
                
                for (File logFile : logFiles) {
                    String fileName = logFile.getName();
                    boolean matches = filePatterns.stream().anyMatch(fileName::startsWith);
                    
                    if (matches && fileName.endsWith(".log")) {
                        entries.addAll(parseLogFile(logFile));
                    }
                }
            }
            
            // Sort by timestamp descending (newest first)
            entries.sort((a, b) -> Long.compare(b.getTimestamp(), a.getTimestamp()));
            
            // Apply filters
            List<AuditLogEntry> filtered = entries.stream()
                .filter(entry -> username == null || username.isEmpty() || 
                        entry.getMessage().toLowerCase().contains(username.toLowerCase()))
                .filter(entry -> search == null || search.isEmpty() || 
                        entry.getMessage().toLowerCase().contains(search.toLowerCase()) ||
                        entry.getUsername() != null && entry.getUsername().toLowerCase().contains(search.toLowerCase()))
                .collect(Collectors.toList());
            
            // Apply pagination
            int total = filtered.size();
            List<AuditLogEntry> paginated = filtered.stream()
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("entries", paginated);
            response.put("total", total);
            response.put("offset", offset);
            response.put("limit", limit);
            
            ctx.json(ApiResponse.success(response));
        } catch (Exception e) {
            plugin.getLogger().severe("Failed to retrieve audit entries: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(ApiResponse.error("Failed to retrieve audit entries"));
        }
    }
    
    /**
     * GET /api/v1/audit/stats
     * Get statistics about audit log entries
     */
    public void getAuditStats(Context ctx) {
        try {
            Map<String, Long> categoryCounts = new HashMap<>();
            categoryCounts.put("audit", 0L);
            categoryCounts.put("security", 0L);
            categoryCounts.put("api", 0L);
            
            long totalEntries = 0;
            long totalSize = 0;
            
            File[] logFiles = logsDir.listFiles();
            if (logFiles != null) {
                for (File logFile : logFiles) {
                    String fileName = logFile.getName();
                    totalSize += logFile.length();
                    
                    if (fileName.startsWith("audit-") && fileName.endsWith(".log")) {
                        long count = Files.lines(logFile.toPath()).count();
                        categoryCounts.put("audit", categoryCounts.get("audit") + count);
                        totalEntries += count;
                    } else if (fileName.startsWith("security-") && fileName.endsWith(".log")) {
                        long count = Files.lines(logFile.toPath()).count();
                        categoryCounts.put("security", categoryCounts.get("security") + count);
                        totalEntries += count;
                    } else if (fileName.startsWith("api-") && fileName.endsWith(".log")) {
                        long count = Files.lines(logFile.toPath()).count();
                        categoryCounts.put("api", categoryCounts.get("api") + count);
                        totalEntries += count;
                    }
                }
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalEntries", totalEntries);
            stats.put("totalSizeMB", totalSize / (1024.0 * 1024.0));
            stats.put("categoryCounts", categoryCounts);
            stats.put("fileCount", logFiles != null ? logFiles.length : 0);
            
            ctx.json(ApiResponse.success(stats));
        } catch (Exception e) {
            plugin.getLogger().severe("Failed to get audit stats: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(ApiResponse.error("Failed to get audit stats"));
        }
    }
    
    /**
     * Parse a log file and extract entries
     */
    private List<AuditLogEntry> parseLogFile(File logFile) {
        List<AuditLogEntry> entries = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(logFile))) {
            String line;
            String category = extractCategoryFromFilename(logFile.getName());
            
            while ((line = reader.readLine()) != null) {
                AuditLogEntry entry = parseLogLine(line, category);
                if (entry != null) {
                    entries.add(entry);
                }
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Failed to read log file " + logFile.getName() + ": " + e.getMessage());
        }
        
        return entries;
    }
    
    /**
     * Parse a single log line
     */
    private AuditLogEntry parseLogLine(String line, String category) {
        try {
            Matcher matcher = LOG_PATTERN.matcher(line);
            if (matcher.matches()) {
                String timestampStr = matcher.group(1);
                String level = matcher.group(2);
                String logCategory = matcher.group(3);
                String message = matcher.group(4);
                
                Date date = LOG_DATE_FORMAT.parse(timestampStr);
                long timestamp = date.getTime();
                
                // Extract username from message if possible
                String username = extractUsername(message);
                
                return new AuditLogEntry(timestamp, category, level, username, message);
            }
        } catch (ParseException e) {
            // Skip malformed lines
        }
        
        return null;
    }
    
    /**
     * Extract category from filename (e.g., "audit-2024-11-22.log" -> "audit")
     */
    private String extractCategoryFromFilename(String filename) {
        if (filename.startsWith("audit-")) return "audit";
        if (filename.startsWith("security-")) return "security";
        if (filename.startsWith("api-")) return "api";
        return "unknown";
    }
    
    /**
     * Extract username from log message
     */
    private String extractUsername(String message) {
        // Pattern for messages like "User 'admin' did something"
        Pattern userPattern = Pattern.compile("[Uu]ser[\\s']+'([^']+)'");
        Matcher matcher = userPattern.matcher(message);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}
