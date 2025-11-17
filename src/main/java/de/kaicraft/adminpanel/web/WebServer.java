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
    private final WebSocketHandler webSocketHandler;

    private Javalin app;

    public WebServer(ServerAdminPanelPlugin plugin, ConfigManager config, AuthManager authManager) {
        this.plugin = plugin;
        this.config = config;
        this.authManager = authManager;
        this.authMiddleware = new AuthMiddleware(plugin, authManager);

        // Initialize API handlers
        this.authAPI = new AuthAPI(plugin, authManager);
        this.dashboardAPI = new DashboardAPI(plugin);
        this.consoleAPI = new ConsoleAPI(plugin, config);
        this.pluginAPI = new PluginAPI(plugin);
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
                javalinConfig.http.defaultContentType = "application/json";
                javalinConfig.http.prefer405over404 = true;

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

        // WebSocket route for live console
        app.ws("/ws/console", webSocketHandler.configure());

        // Root endpoint
        app.get("/", ctx -> {
            ctx.json(Map.of(
                    "name", "Server Admin Panel",
                    "version", plugin.getDescription().getVersion(),
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
        // 404 Not Found
        app.error(404, ctx -> {
            ctx.json(Map.of(
                    "success", false,
                    "error", "Not Found",
                    "message", "The requested endpoint does not exist",
                    "path", ctx.path()
            ));
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
