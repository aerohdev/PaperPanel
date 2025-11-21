package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.config.ConfigManager;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.command.CommandSender;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * API endpoints for console management (command execution, history)
 */
public class ConsoleAPI {
    private final ServerAdminPanelPlugin plugin;
    private final ConfigManager config;
    private final Gson gson;
    private final Deque<String> consoleHistory;
    private final int maxHistoryLines;

    public ConsoleAPI(ServerAdminPanelPlugin plugin, ConfigManager config) {
        this.plugin = plugin;
        this.config = config;
        this.gson = new Gson();
        this.maxHistoryLines = config.getMaxHistoryLines();
        this.consoleHistory = new ConcurrentLinkedDeque<>();
    }

    /**
     * Add a line to console history
     */
    public void addToHistory(String line) {
        consoleHistory.addLast(line);

        // Trim history if it exceeds max size
        while (consoleHistory.size() > maxHistoryLines) {
            consoleHistory.removeFirst();
        }
    }

    /**
     * GET /api/console/history
     * Get console output history
     */
    @TypeScriptEndpoint(path = "GET /api/v1/console/history", responseType = "{ lines: string[], total: number }")
    public void getHistory(Context ctx) {
        try {
            // Get optional limit parameter
            String limitParam = ctx.queryParam("limit");
            int limit = limitParam != null ? Integer.parseInt(limitParam) : maxHistoryLines;

            // Get last N lines
            List<String> lines = new ArrayList<>();
            Iterator<String> iterator = consoleHistory.descendingIterator();
            int count = 0;

            while (iterator.hasNext() && count < limit) {
                lines.add(0, iterator.next());
                count++;
            }

            Map<String, Object> data = new HashMap<>();
            data.put("lines", lines);
            data.put("total", consoleHistory.size());
            ctx.status(200).json(ApiResponse.success(data));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/console/history", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve console history"));
        }
    }

    /**
     * POST /api/console/command
     * Execute a console command
     */
    @TypeScriptEndpoint(path = "POST /api/v1/console/command", responseType = "{ message: string, command: string }")
    public void executeCommand(Context ctx) {
        try {
            // Check if command execution is allowed
            if (!config.isCommandExecutionAllowed()) {
                ctx.status(403).json(ApiResponse.error("Command execution is disabled in configuration"));
                return;
            }

            // Parse request body
            String body = ctx.body();
            @SuppressWarnings("unchecked")
            Map<String, String> request = gson.fromJson(body, Map.class);

            String command = request.get("command");

            // Validate input
            if (command == null || command.trim().isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Command is required"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "execute-command", command);

            // Execute command on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                try {
                    CommandSender consoleSender = Bukkit.getConsoleSender();
                    boolean success = Bukkit.dispatchCommand(consoleSender, command);

                    if (!success) {
                        plugin.getAuditLogger().logApiInfo("POST /api/v1/console/command", "Command returned false: " + command);
                    }
                } catch (Exception e) {
                    plugin.getAuditLogger().logApiError("POST /api/v1/console/command", "Command execution failed", e);
                }
            });

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Command sent to server");
            data.put("command", command);
            ctx.status(200).json(ApiResponse.success(data));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/console/command", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to execute command"));
        }
    }

    /**
     * POST /api/console/clear
     * Clear console history
     */
    @TypeScriptEndpoint(path = "POST /api/v1/console/clear", responseType = "{ message: string }")
    public void clearHistory(Context ctx) {
        try {
            consoleHistory.clear();
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "clear-console", "Console history cleared");

            ctx.status(200).json(ApiResponse.successMessage("Console history cleared"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/console/clear", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to clear console history"));
        }
    }

    /**
     * Get console history as list
     */
    public List<String> getHistoryList() {
        return new ArrayList<>(consoleHistory);
    }
}
