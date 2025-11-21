package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.model.LogFileInfo;
import de.kaicraft.adminpanel.model.LogMatch;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;

import java.io.*;
import java.nio.file.*;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * API endpoints for log file viewing and searching
 */
public class LogViewerAPI {
    private final ServerAdminPanelPlugin plugin;
    private final Path logsDirectory;
    private static final int MAX_SEARCH_RESULTS = 200;
    private static final int MAX_FILE_READ_LINES = 5000;

    public LogViewerAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.logsDirectory = plugin.getDataFolder().toPath().resolve("logs");
        
        // Create logs directory if it doesn't exist
        try {
            Files.createDirectories(logsDirectory);
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to create logs directory: " + e.getMessage());
        }
    }

    /**
     * GET /api/v1/logs/files
     * Get list of all log files
     */
    @TypeScriptEndpoint(path = "GET /api/v1/logs/files", responseType = "LogFileInfo[]")
    public void getLogFiles(Context ctx) {
        try {
            List<LogFileInfo> files = new ArrayList<>();
            
            if (Files.exists(logsDirectory)) {
                try (Stream<Path> paths = Files.walk(logsDirectory, 1)) {
                    files = paths
                        .filter(Files::isRegularFile)
                        .filter(p -> p.toString().endsWith(".log"))
                        .map(this::createLogFileInfo)
                        .filter(Objects::nonNull)
                        .sorted(Comparator.comparing(LogFileInfo::getModified).reversed())
                        .collect(Collectors.toList());
                }
            }

            ctx.status(200).json(ApiResponse.success("files", files));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/logs/files", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve log files"));
        }
    }

    /**
     * GET /api/v1/logs/read/{filename}
     * Read contents of a specific log file
     */
    @TypeScriptEndpoint(path = "GET /api/v1/logs/read/{filename}", responseType = "{ lines: string[] }")
    public void readLogFile(Context ctx) {
        try {
            String filename = ctx.pathParam("filename");
            Path logFile = logsDirectory.resolve(filename).normalize();

            // Security: Ensure file is within logs directory
            if (!logFile.startsWith(logsDirectory)) {
                ctx.status(403).json(ApiResponse.error("Access denied"));
                return;
            }

            if (!Files.exists(logFile)) {
                ctx.status(404).json(ApiResponse.error("Log file not found"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "read-log", filename);

            List<String> lines = Files.readAllLines(logFile);
            
            // Limit lines to prevent memory issues
            if (lines.size() > MAX_FILE_READ_LINES) {
                lines = lines.subList(lines.size() - MAX_FILE_READ_LINES, lines.size());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("lines", lines);
            ctx.status(200).json(ApiResponse.success(data));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/logs/read/{filename}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to read log file"));
        }
    }

    /**
     * POST /api/v1/logs/search
     * Search across log files
     */
    @TypeScriptEndpoint(path = "POST /api/v1/logs/search", responseType = "LogMatch[]")
    public void searchLogs(Context ctx) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> request = ctx.bodyAsClass(Map.class);
            
            String query = (String) request.get("query");
            @SuppressWarnings("unchecked")
            List<String> fileFilter = (List<String>) request.get("files");
            Integer limitParam = (Integer) request.get("limit");
            int limit = limitParam != null ? Math.min(limitParam, MAX_SEARCH_RESULTS) : MAX_SEARCH_RESULTS;

            if (query == null || query.trim().isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Search query is required"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "search-logs", query);

            List<LogMatch> matches = new ArrayList<>();
            String searchTerm = query.toLowerCase();

            // Get files to search
            List<Path> filesToSearch;
            if (fileFilter != null && !fileFilter.isEmpty()) {
                filesToSearch = fileFilter.stream()
                    .map(f -> logsDirectory.resolve(f).normalize())
                    .filter(p -> p.startsWith(logsDirectory) && Files.exists(p))
                    .collect(Collectors.toList());
            } else {
                try (Stream<Path> paths = Files.walk(logsDirectory, 1)) {
                    filesToSearch = paths
                        .filter(Files::isRegularFile)
                        .filter(p -> p.toString().endsWith(".log"))
                        .collect(Collectors.toList());
                }
            }

            // Search through files
            for (Path file : filesToSearch) {
                if (matches.size() >= limit) break;

                try {
                    List<String> lines = Files.readAllLines(file);
                    for (int i = 0; i < lines.size() && matches.size() < limit; i++) {
                        String line = lines.get(i);
                        if (line.toLowerCase().contains(searchTerm)) {
                            LogMatch match = new LogMatch(i + 1, line, file.getFileName().toString());
                            matches.add(match);
                        }
                    }
                } catch (IOException e) {
                    plugin.getLogger().warning("Failed to search file " + file.getFileName() + ": " + e.getMessage());
                }
            }

            ctx.status(200).json(ApiResponse.success("matches", matches));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/logs/search", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to search logs"));
        }
    }

    /**
     * GET /api/v1/logs/download/{filename}
     * Download a log file
     */
    @TypeScriptEndpoint(path = "GET /api/v1/logs/download/{filename}", responseType = "File")
    public void downloadLogFile(Context ctx) {
        try {
            String filename = ctx.pathParam("filename");
            Path logFile = logsDirectory.resolve(filename).normalize();

            // Security: Ensure file is within logs directory
            if (!logFile.startsWith(logsDirectory)) {
                ctx.status(403).json(ApiResponse.error("Access denied"));
                return;
            }

            if (!Files.exists(logFile)) {
                ctx.status(404).json(ApiResponse.error("Log file not found"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "download-log", filename);

            ctx.header("Content-Disposition", "attachment; filename=\"" + filename + "\"");
            ctx.header("Content-Type", "text/plain");
            ctx.result(Files.newInputStream(logFile));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/logs/download/{filename}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to download log file"));
        }
    }

    /**
     * Helper method to create LogFileInfo from Path
     */
    private LogFileInfo createLogFileInfo(Path path) {
        try {
            String name = path.getFileName().toString();
            
            // Determine log type from filename
            String filename = name.toLowerCase();
            String type;
            if (filename.contains("audit")) {
                type = "audit";
            } else if (filename.contains("security")) {
                type = "security";
            } else if (filename.contains("api")) {
                type = "api";
            } else {
                type = "server";
            }
            
            long size = Files.size(path);
            long modified = Files.getLastModifiedTime(path).toMillis();
            
            // Count lines (optional, can be slow for large files)
            int lines = 0;
            try {
                lines = (int) Files.lines(path).count();
            } catch (Exception e) {
                // Skip line count if it fails
            }
            
            return new LogFileInfo(name, type, size, modified, lines);
        } catch (IOException e) {
            plugin.getLogger().warning("Failed to get info for log file " + path.getFileName() + ": " + e.getMessage());
            return null;
        }
    }
}
