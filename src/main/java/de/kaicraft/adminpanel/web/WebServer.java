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

                // Logging
                javalinConfig.bundledPlugins.enableDevLogging();

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
        app.get("/api/health", this::healthCheck);

        // Authentication routes (no auth required for login)
        app.post("/api/auth/login", authAPI::login);

        // Apply authentication middleware to all /api/* routes except login
        app.before("/api/*", authMiddleware.asHandler());

        // Authentication routes (with auth)
        app.post("/api/auth/logout", authAPI::logout);
        app.get("/api/auth/verify", authAPI::verify);

        // Dashboard routes
        app.get("/api/dashboard/stats", dashboardAPI::getStats);

        // Console routes
        app.get("/api/console/history", consoleAPI::getHistory);
        app.post("/api/console/command", consoleAPI::executeCommand);
        app.post("/api/console/clear", consoleAPI::clearHistory);

        // Plugin routes
        app.get("/api/plugins", pluginAPI::getPlugins);
        app.get("/api/plugins/{name}", pluginAPI::getPlugin);
        app.post("/api/plugins/{name}/enable", pluginAPI::enablePlugin);
        app.post("/api/plugins/{name}/disable", pluginAPI::disablePlugin);
        app.post("/api/plugins/{name}/reload", pluginAPI::reloadPlugin);

        // Player routes
        app.get("/api/players", playerAPI::getPlayers);
        app.get("/api/players/{uuid}", playerAPI::getPlayer);
        app.post("/api/players/{uuid}/kick", playerAPI::kickPlayer);
        app.post("/api/players/{uuid}/message", playerAPI::messagePlayer);

        // Server control routes
        app.post("/api/server/restart", serverControlAPI::scheduleRestart);
        app.post("/api/server/stop", serverControlAPI::stopServer);
        app.post("/api/server/save-all", serverControlAPI::saveAll);
        app.post("/api/server/weather/{world}/{type}", serverControlAPI::setWeather);
        app.post("/api/server/time/{world}/{time}", serverControlAPI::setTime);

        // World routes
        app.get("/api/worlds", worldAPI::getWorlds);
        app.get("/api/worlds/{name}", worldAPI::getWorld);
        app.post("/api/worlds/{name}/settings", worldAPI::updateWorldSettings);

        // Broadcast routes
        app.post("/api/broadcast/message", broadcastAPI::sendChatMessage);
        app.post("/api/broadcast/title", broadcastAPI::sendTitle);
        app.post("/api/broadcast/actionbar", broadcastAPI::sendActionBar);
        app.post("/api/broadcast/sound", broadcastAPI::playSound);

        // WebSocket route for live console
        app.ws("/ws/console", webSocketHandler.configure());

        // API info endpoint (moved from root)
        app.get("/api/info", ctx -> {
            ctx.json(Map.of(
                    "name", "Server Admin Panel",
                    "version", plugin.getPluginMeta().getVersion(),
                    "status", "running",
                    "endpoints", Map.of(
                            "health", "/api/health",
                            "login", "POST /api/auth/login",
                            "dashboard", "/api/dashboard/stats",
                            "console", "/ws/console",
                            "plugins", "/api/plugins"
                    )
            ));
        });
    }

    /**
     * Setup exception handlers
     */
    private void setupExceptionHandlers() {
        // 404 Not Found - Serve index.html for SPA routing, JSON for API routes
        app.error(404, ctx -> {
            String path = ctx.path();

            // If it's an API or WebSocket request, return JSON error
            if (path.startsWith("/api/") || path.startsWith("/ws/")) {
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
