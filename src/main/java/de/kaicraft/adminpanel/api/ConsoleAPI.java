package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.config.ConfigManager;
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

            ctx.status(200).json(Map.of(
                    "success", true,
                    "lines", lines,
                    "total", consoleHistory.size()
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting console history: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve console history"
            ));
        }
    }

    /**
     * POST /api/console/command
     * Execute a console command
     */
    public void executeCommand(Context ctx) {
        try {
            // Check if command execution is allowed
            if (!config.isCommandExecutionAllowed()) {
                ctx.status(403).json(Map.of(
                        "success", false,
                        "error", "Forbidden",
                        "message", "Command execution is disabled in configuration"
                ));
                return;
            }

            // Parse request body
            String body = ctx.body();
            @SuppressWarnings("unchecked")
            Map<String, String> request = gson.fromJson(body, Map.class);

            String command = request.get("command");

            // Validate input
            if (command == null || command.trim().isEmpty()) {
                ctx.status(400).json(Map.of(
                        "success", false,
                        "error", "Bad Request",
                        "message", "Command is required"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' executing command: " + command);

            // Execute command on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                try {
                    CommandSender consoleSender = Bukkit.getConsoleSender();
                    boolean success = Bukkit.dispatchCommand(consoleSender, command);

                    if (!success) {
                        plugin.getLogger().warning("Command execution returned false: " + command);
                    }
                } catch (Exception e) {
                    plugin.getLogger().severe("Error executing command: " + e.getMessage());
                }
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Command sent to server",
                    "command", command
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error processing command request: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to execute command"
            ));
        }
    }

    /**
     * POST /api/console/clear
     * Clear console history
     */
    public void clearHistory(Context ctx) {
        try {
            consoleHistory.clear();
            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' cleared console history");

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Console history cleared"
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error clearing console history: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to clear console history"
            ));
        }
    }

    /**
     * Get console history as list
     */
    public List<String> getHistoryList() {
        return new ArrayList<>(consoleHistory);
    }
}
