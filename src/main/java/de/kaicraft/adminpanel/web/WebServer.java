package de.kaicraft.adminpanel.web;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.api.*;
import de.kaicraft.adminpanel.auth.AuthManager;
import de.kaicraft.adminpanel.auth.AuthMiddleware;
import de.kaicraft.adminpanel.config.ConfigManager;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.util.Map;

/**
 * Embedded Javalin web server for the admin panel
 */
public class WebServer {
    private final ServerAdminPanelPlugin plugin;
    private final ConfigManager config;
    private final AuthManager authManager;
    private final AuthMiddleware authMiddleware;

    // API handlers
    private final AuthAPI authAPI;
    private final DashboardAPI dashboardAPI;
    private final ConsoleAPI consoleAPI;
    private final PluginAPI pluginAPI;
    private final PlayerAPI playerAPI;
    private final ServerControlAPI serverControlAPI;
    private final WorldAPI worldAPI;
    private final BroadcastAPI broadcastAPI;
    private final WebSocketHandler webSocketHandler;
    private final UserManagementAPI userManagementAPI;

    private Javalin app;

    public WebServer(ServerAdminPanelPlugin plugin, ConfigManager config, AuthManager authManager,
                     PlayerAPI playerAPI, ServerControlAPI serverControlAPI, WorldAPI worldAPI) {
        this.plugin = plugin;
        this.config = config;
        this.authManager = authManager;
        this.authMiddleware = new AuthMiddleware(plugin, authManager);

        // Initialize API handlers
        this.authAPI = new AuthAPI(plugin, authManager);
        this.dashboardAPI = new DashboardAPI(plugin);
        this.consoleAPI = new ConsoleAPI(plugin, config);
        this.pluginAPI = new PluginAPI(plugin);
        this.playerAPI = playerAPI;
        this.serverControlAPI = serverControlAPI;
        this.worldAPI = worldAPI;
        this.broadcastAPI = new BroadcastAPI(plugin);
        this.webSocketHandler = new WebSocketHandler(plugin, authManager, consoleAPI, config);
        this.userManagementAPI = new UserManagementAPI(plugin, authManager);
    }

    /**
     * Start the web server
     */
    public void start() {
        try {
            int port = config.getPort();
            String host = config.getHost();

            plugin.getLogger().info("Starting web server on " + host + ":" + port);

            app = Javalin.create(javalinConfig -> {
                // General configuration
                javalinConfig.http.prefer405over404 = true;

                // Serve static files from the webapp directory in resources
                javalinConfig.staticFiles.add("/webapp", io.javalin.http.staticfiles.Location.CLASSPATH);

                // CORS configuration
                if (config.isCorsEnabled()) {
                    javalinConfig.bundledPlugins.enableCors(cors -> {
                        cors.addRule(it -> {
                            it.anyHost();
                            it.allowCredentials = true;
                        });
                    });
                }

                // Logging - nur Warnings und Errors
                javalinConfig.bundledPlugins.enableRouteOverview("/api/routes"); // Optional: Route overview

                // Request size limit (10MB)
                javalinConfig.http.maxRequestSize = 10_485_760L;

            }).start(host, port);

            setupRoutes();
            setupExceptionHandlers();

            plugin.getLogger().info("Web server started successfully!");
            plugin.getLogger().info("Access the admin panel at: http://" +
                    (host.equals("0.0.0.0") ? "localhost" : host) + ":" + port);

        } catch (Exception e) {
            plugin.getLogger().severe("Failed to start web server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Setup all API routes
     */
    private void setupRoutes() {
        // Health check endpoint (no auth required)
        app.get("/api/v1/health", this::healthCheck);

        // Authentication routes (no auth required for login)
        app.post("/api/v1/auth/login", authAPI::login);

        // Apply authentication middleware to all /api/v1/* routes except login
        app.before("/api/v1/*", authMiddleware.asHandler());

        // Authentication routes (with auth)
        app.post("/api/v1/auth/logout", authAPI::logout);
        app.get("/api/v1/auth/verify", authAPI::verify);
        app.get("/api/v1/auth/security-status", authAPI::getSecurityStatus);

        // Dashboard routes
        app.get("/api/v1/dashboard/stats", dashboardAPI::getStats);
        app.get("/api/v1/dashboard/update-status", dashboardAPI::getUpdateStatus);
        app.post("/api/v1/dashboard/check-updates", dashboardAPI::checkForUpdates);
        app.post("/api/v1/dashboard/download-update", dashboardAPI::downloadUpdate);
        app.post("/api/v1/dashboard/install-update", dashboardAPI::installUpdate);

        // Console routes
        app.get("/api/v1/console/history", consoleAPI::getHistory);
        app.post("/api/v1/console/command", consoleAPI::executeCommand);
        app.post("/api/v1/console/clear", consoleAPI::clearHistory);

        // Plugin routes
        app.get("/api/v1/plugins", pluginAPI::getPlugins);
        app.get("/api/v1/plugins/{name}", pluginAPI::getPlugin);
        app.post("/api/v1/plugins/{name}/enable", pluginAPI::enablePlugin);
        app.post("/api/v1/plugins/{name}/disable", pluginAPI::disablePlugin);
        app.post("/api/v1/plugins/{name}/reload", pluginAPI::reloadPlugin);

        // Player routes
        app.get("/api/v1/players", playerAPI::getPlayers);
        app.get("/api/v1/players/{uuid}", playerAPI::getPlayer);
        app.post("/api/v1/players/{uuid}/kick", playerAPI::kickPlayer);
        app.post("/api/v1/players/{uuid}/message", playerAPI::messagePlayer);

        // Server control routes
        app.post("/api/v1/server/restart", serverControlAPI::scheduleRestart);
        app.post("/api/v1/server/stop", serverControlAPI::stopServer);
        app.post("/api/v1/server/save-all", serverControlAPI::saveAll);
        app.post("/api/v1/server/weather/{world}/{type}", serverControlAPI::setWeather);
        app.post("/api/v1/server/time/{world}/{time}", serverControlAPI::setTime);

        // World routes
        app.get("/api/v1/worlds", worldAPI::getWorlds);
        app.get("/api/v1/worlds/{name}", worldAPI::getWorld);
        app.post("/api/v1/worlds/{name}/settings", worldAPI::updateWorldSettings);
        app.post("/api/v1/worlds/bulk/settings", worldAPI::updateAllWorldSettings);

        // Broadcast routes
        app.post("/api/v1/broadcast/message", broadcastAPI::sendChatMessage);
        app.post("/api/v1/broadcast/title", broadcastAPI::sendTitle);
        app.post("/api/v1/broadcast/actionbar", broadcastAPI::sendActionBar);
        app.post("/api/v1/broadcast/sound", broadcastAPI::playSound);

        // WebSocket route for live console
        app.ws("/ws/console", webSocketHandler.configure());

        // API info endpoint
        app.get("/api/v1/info", ctx -> {
            ctx.json(Map.of(
                    "name", "Server Admin Panel",
                    "version", plugin.getPluginMeta().getVersion(),
                    "status", "running",
                    "endpoints", Map.of(
                            "health", "/api/v1/health",
                            "login", "POST /api/v1/auth/login",
                            "dashboard", "/api/v1/dashboard/stats",
                            "console", "/ws/console",
                            "plugins", "/api/v1/plugins"
                    )
            ));
        });

        // User management routes
        app.get("/api/v1/users", userManagementAPI::getUsers);
        app.post("/api/v1/users", userManagementAPI::createUser);
        app.put("/api/v1/users/{username}/password", userManagementAPI::changePassword);
        app.delete("/api/v1/users/{username}", userManagementAPI::deleteUser);
    }

    /**
     * Setup exception handlers
     */
    private void setupExceptionHandlers() {
        // 404 Not Found - Serve index.html for SPA routing, JSON for API routes
        app.error(404, ctx -> {
            String path = ctx.path();

            // If it's an API or WebSocket request, return JSON error
            if (path.startsWith("/api/v1/") || path.startsWith("/ws/")) {
                ctx.json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "The requested endpoint does not exist",
                        "path", path
                ));
            } else {
                // For all other routes, serve index.html to support React Router
                try {
                    ctx.contentType("text/html");
                    var indexHtml = getClass().getClassLoader().getResourceAsStream("webapp/index.html");
                    if (indexHtml != null) {
                        ctx.result(indexHtml);
                    } else {
                        ctx.result("<html><body><h1>Error: Frontend not found</h1><p>The frontend files are not bundled in the plugin. Please build the frontend and copy to src/main/resources/webapp/</p></body></html>");
                    }
                } catch (Exception e) {
                    ctx.result("<html><body><h1>Error loading frontend</h1></body></html>");
                }
            }
        });

        // 405 Method Not Allowed
        app.error(405, ctx -> {
            ctx.json(Map.of(
                    "success", false,
                    "error", "Method Not Allowed",
                    "message", "The HTTP method is not allowed for this endpoint",
                    "method", ctx.method().toString(),
                    "path", ctx.path()
            ));
        });

        // 500 Internal Server Error
        app.exception(Exception.class, (e, ctx) -> {
            plugin.getLogger().severe("Unhandled exception in web server: " + e.getMessage());
            e.printStackTrace();

            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "An unexpected error occurred"
            ));
        });
    }

    /**
     * Health check endpoint
     */
    private void healthCheck(Context ctx) {
        ctx.json(Map.of(
                "status", "healthy",
                "timestamp", System.currentTimeMillis(),
                "uptime", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime()
        ));
    }

    /**
     * Stop the web server
     */
    public void stop() {
        if (app != null) {
            plugin.getLogger().info("Stopping web server...");
            webSocketHandler.closeAll();
            app.stop();
            plugin.getLogger().info("Web server stopped");
        }
    }

    /**
     * Get the console API handler
     */
    public ConsoleAPI getConsoleAPI() {
        return consoleAPI;
    }

    /**
     * Get the WebSocket handler
     */
    public WebSocketHandler getWebSocketHandler() {
        return webSocketHandler;
    }
}
