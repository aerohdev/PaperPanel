package de.kaicraft.adminpanel.web;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.api.ConsoleAPI;
import de.kaicraft.adminpanel.auth.AuthManager;
import de.kaicraft.adminpanel.config.ConfigManager;
import io.javalin.websocket.WsCloseContext;
import io.javalin.websocket.WsConnectContext;
import io.javalin.websocket.WsMessageContext;
import org.bukkit.Bukkit;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for real-time console streaming
 */
public class WebSocketHandler {
    private final ServerAdminPanelPlugin plugin;
    private final AuthManager authManager;
    private final ConsoleAPI consoleAPI;
    private final ConfigManager config;
    private final Gson gson;
    private final Set<WsConnectContext> clients;

    public WebSocketHandler(ServerAdminPanelPlugin plugin, AuthManager authManager,
                           ConsoleAPI consoleAPI, ConfigManager config) {
        this.plugin = plugin;
        this.authManager = authManager;
        this.consoleAPI = consoleAPI;
        this.config = config;
        this.gson = new Gson();
        this.clients = ConcurrentHashMap.newKeySet();
    }

    /**
     * Handle WebSocket connection
     */
    public void onConnect(WsConnectContext ctx) {
        try {
            // Get token from query parameter
            String token = ctx.queryParam("token");

            if (token == null || token.isEmpty()) {
                ctx.send(gson.toJson(Map.of(
                        "type", "error",
                        "message", "Authentication required"
                )));
                ctx.closeSession();
                return;
            }

            // Verify token
            String username = authManager.verifyToken(token);
            if (username == null) {
                ctx.send(gson.toJson(Map.of(
                        "type", "error",
                        "message", "Invalid or expired token"
                )));
                ctx.closeSession();
                return;
            }

            // Add to clients
            clients.add(ctx);
            ctx.attribute("username", username);

            plugin.getLogger().info("WebSocket client connected: " + username);

            // Send welcome message
            ctx.send(gson.toJson(Map.of(
                    "type", "connected",
                    "message", "Connected to console stream",
                    "username", username
            )));

            // Send recent console history
            consoleAPI.getHistoryList().forEach(line -> {
                try {
                    ctx.send(gson.toJson(Map.of(
                            "type", "log",
                            "message", line,
                            "timestamp", System.currentTimeMillis()
                    )));
                } catch (Exception e) {
                    // Client might have disconnected
                }
            });

        } catch (Exception e) {
            plugin.getLogger().severe("Error in WebSocket connection: " + e.getMessage());
            try {
                ctx.closeSession();
            } catch (Exception ignored) {
            }
        }
    }

    /**
     * Handle incoming WebSocket messages (commands from client)
     */
    public void onMessage(WsMessageContext ctx) {
        try {
            String message = ctx.message();
            @SuppressWarnings("unchecked")
            Map<String, Object> data = gson.fromJson(message, Map.class);

            String type = (String) data.get("type");

            if ("command".equals(type)) {
                String command = (String) data.get("command");
                String username = ctx.attribute("username");

                if (!config.isCommandExecutionAllowed()) {
                    ctx.send(gson.toJson(Map.of(
                            "type", "error",
                            "message", "Command execution is disabled"
                    )));
                    return;
                }

                if (command != null && !command.trim().isEmpty()) {
                    plugin.getLogger().info("WebSocket command from '" + username + "': " + command);

                    // Execute command on main thread
                    Bukkit.getScheduler().runTask(plugin, () -> {
                        Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command);
                    });

                    ctx.send(gson.toJson(Map.of(
                            "type", "command_sent",
                            "command", command
                    )));
                }
            } else if ("ping".equals(type)) {
                ctx.send(gson.toJson(Map.of("type", "pong")));
            }

        } catch (Exception e) {
            plugin.getLogger().severe("Error processing WebSocket message: " + e.getMessage());
        }
    }

    /**
     * Handle WebSocket disconnection
     */
    public void onClose(WsCloseContext ctx) {
        clients.remove(ctx);
        String username = ctx.attribute("username");
        if (username != null) {
            plugin.getLogger().info("WebSocket client disconnected: " + username);
        }
    }

    /**
     * Handle WebSocket errors
     */
    public void onError(io.javalin.websocket.WsErrorContext ctx) {
        plugin.getLogger().warning("WebSocket error: " + ctx.error().getMessage());
        clients.remove(ctx);
    }

    /**
     * Broadcast a log message to all connected clients
     */
    public void broadcast(String message) {
        if (clients.isEmpty()) {
            return;
        }

        String json = gson.toJson(Map.of(
                "type", "log",
                "message", message,
                "timestamp", System.currentTimeMillis()
        ));

        // Remove disconnected clients while broadcasting
        clients.removeIf(client -> {
            try {
                if (client.session.isOpen()) {
                    client.send(json);
                    return false;
                }
                return true;
            } catch (Exception e) {
                return true; // Remove on error
            }
        });
    }

    /**
     * Get number of connected clients
     */
    public int getClientCount() {
        return clients.size();
    }

    /**
     * Close all WebSocket connections
     */
    public void closeAll() {
        clients.forEach(client -> {
            try {
                client.send(gson.toJson(Map.of(
                        "type", "server_shutdown",
                        "message", "Server is shutting down"
                )));
                client.session.close();
            } catch (Exception ignored) {
            }
        });
        clients.clear();
    }
}
