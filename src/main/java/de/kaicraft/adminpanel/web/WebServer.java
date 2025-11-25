package de.kaicraft.adminpanel.web;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.api.*;
import de.kaicraft.adminpanel.auth.AuthManager;
import de.kaicraft.adminpanel.auth.AuthMiddleware;
import de.kaicraft.adminpanel.auth.PermissionMiddleware;
import de.kaicraft.adminpanel.auth.Permission;
import de.kaicraft.adminpanel.config.ConfigManager;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.util.Map;

/**
 * Embedded Javalin web server for PaperPanel
 */
public class WebServer {
    private final ServerAdminPanelPlugin plugin;
    private final ConfigManager config;
    private final AuthManager authManager;
    private final AuthMiddleware authMiddleware;
    private final PermissionMiddleware permissionMiddleware;

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
    private final LogViewerAPI logViewerAPI;
    private final ConfigEditorAPI configEditorAPI;
    private final WhitelistAPI whitelistAPI;
    private final RoleManagementAPI roleManagementAPI;
    private final AuditLogAPI auditLogAPI;

    private Javalin app;

    public WebServer(ServerAdminPanelPlugin plugin, ConfigManager config, AuthManager authManager,
                     PlayerAPI playerAPI, ServerControlAPI serverControlAPI, WorldAPI worldAPI) {
        this.plugin = plugin;
        this.config = config;
        this.authManager = authManager;
        this.authMiddleware = new AuthMiddleware(plugin, authManager);
        this.permissionMiddleware = new PermissionMiddleware(plugin, authManager);

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
        this.logViewerAPI = new LogViewerAPI(plugin);
        this.configEditorAPI = new ConfigEditorAPI(plugin);
        this.whitelistAPI = new WhitelistAPI(plugin);
        this.roleManagementAPI = new RoleManagementAPI(plugin, authManager);
        this.auditLogAPI = new AuditLogAPI(plugin);
    }

    /**
     * Start the web server
     */
    public void start() {
        try {
            int port = config.getPort();
            String host = config.getHost();

            plugin.getLogger().info("Starting web server on " + host + ":" + port);

            app = Javalin.create(config -> {
                // General configuration
                config.showJavalinBanner = false;

                // Serve static files from the webapp directory in resources
                config.staticFiles.add(staticFiles -> {
                    staticFiles.directory = "/webapp";
                    staticFiles.location = io.javalin.http.staticfiles.Location.CLASSPATH;
                    staticFiles.hostedPath = "/";
                });

                // CORS configuration
                if (this.config.isCorsEnabled()) {
                    config.bundledPlugins.enableCors(cors -> {
                        cors.addRule(it -> {
                            it.anyHost();
                        });
                    });
                }

                // Request size limit (10MB)
                config.http.maxRequestSize = 10_485_760L;

            }).start(host, port);

            setupRoutes();
            setupExceptionHandlers();

            plugin.getLogger().info("Web server started successfully!");
            plugin.getLogger().info("Access PaperPanel at: http://" +
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
        app.before("/api/v1/dashboard/stats", permissionMiddleware.requirePermission(Permission.VIEW_DASHBOARD));
        app.get("/api/v1/dashboard/stats", dashboardAPI::getStats);
        
        app.before("/api/v1/dashboard/update-status", permissionMiddleware.requirePermission(Permission.VIEW_DASHBOARD));
        app.get("/api/v1/dashboard/update-status", dashboardAPI::getUpdateStatus);
        
        app.before("/api/v1/dashboard/check-updates", permissionMiddleware.requirePermission(Permission.MANAGE_UPDATES));
        app.post("/api/v1/dashboard/check-updates", dashboardAPI::checkForUpdates);
        
        app.before("/api/v1/dashboard/download-update", permissionMiddleware.requirePermission(Permission.MANAGE_UPDATES));
        app.post("/api/v1/dashboard/download-update", dashboardAPI::downloadUpdate);
        
        app.before("/api/v1/dashboard/install-update", permissionMiddleware.requirePermission(Permission.MANAGE_UPDATES));
        app.post("/api/v1/dashboard/install-update", dashboardAPI::installUpdate);

        // Console routes
        app.before("/api/v1/console/history", permissionMiddleware.requirePermission(Permission.VIEW_CONSOLE));
        app.get("/api/v1/console/history", consoleAPI::getHistory);
        
        app.before("/api/v1/console/command", permissionMiddleware.requirePermission(Permission.EXECUTE_COMMANDS));
        app.post("/api/v1/console/command", consoleAPI::executeCommand);
        
        app.before("/api/v1/console/clear", permissionMiddleware.requirePermission(Permission.EXECUTE_COMMANDS));
        app.post("/api/v1/console/clear", consoleAPI::clearHistory);

        // Plugin routes
        app.before("/api/v1/plugins", permissionMiddleware.requirePermission(Permission.VIEW_PLUGINS));
        app.get("/api/v1/plugins", pluginAPI::getPlugins);
        
        app.before("/api/v1/plugins/{name}", permissionMiddleware.requirePermission(Permission.VIEW_PLUGINS));
        app.get("/api/v1/plugins/{name}", pluginAPI::getPlugin);
        
        app.before("/api/v1/plugins/{name}/enable", permissionMiddleware.requirePermission(Permission.MANAGE_PLUGINS));
        app.post("/api/v1/plugins/{name}/enable", pluginAPI::enablePlugin);
        
        app.before("/api/v1/plugins/{name}/disable", permissionMiddleware.requirePermission(Permission.MANAGE_PLUGINS));
        app.post("/api/v1/plugins/{name}/disable", pluginAPI::disablePlugin);
        
        app.before("/api/v1/plugins/{name}/reload", permissionMiddleware.requirePermission(Permission.MANAGE_PLUGINS));
        app.post("/api/v1/plugins/{name}/reload", pluginAPI::reloadPlugin);

        // Player routes
        app.before("/api/v1/players", permissionMiddleware.requirePermission(Permission.VIEW_PLAYERS));
        app.get("/api/v1/players", playerAPI::getPlayers);
        
        app.before("/api/v1/players/{uuid}", permissionMiddleware.requirePermission(Permission.VIEW_PLAYERS));
        app.get("/api/v1/players/{uuid}", playerAPI::getPlayer);
        
        app.before("/api/v1/players/{uuid}/kick", permissionMiddleware.requirePermission(Permission.KICK_PLAYERS));
        app.post("/api/v1/players/{uuid}/kick", playerAPI::kickPlayer);
        
        app.before("/api/v1/players/{uuid}/message", permissionMiddleware.requirePermission(Permission.MESSAGE_PLAYERS));
        app.post("/api/v1/players/{uuid}/message", playerAPI::messagePlayer);
        
        app.before("/api/v1/players/{uuid}/ban", permissionMiddleware.requirePermission(Permission.BAN_PLAYERS));
        app.post("/api/v1/players/{uuid}/ban", playerAPI::banPlayer);
        app.delete("/api/v1/players/{uuid}/ban", playerAPI::unbanPlayer);

        // Server control routes
        app.before("/api/v1/server/restart", permissionMiddleware.requirePermission(Permission.RESTART_SERVER));
        app.post("/api/v1/server/restart", serverControlAPI::scheduleRestart);
        
        app.before("/api/v1/server/stop", permissionMiddleware.requirePermission(Permission.STOP_SERVER));
        app.post("/api/v1/server/stop", serverControlAPI::stopServer);

        app.before("/api/v1/server/graceful-stop", permissionMiddleware.requirePermission(Permission.STOP_SERVER));
        app.post("/api/v1/server/graceful-stop", serverControlAPI::gracefulStop);

        app.before("/api/v1/server/save-all", permissionMiddleware.requirePermission(Permission.SAVE_SERVER));
        app.post("/api/v1/server/save-all", serverControlAPI::saveAll);
        
        app.before("/api/v1/server/weather/{world}/{type}", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/server/weather/{world}/{type}", serverControlAPI::setWeather);
        
        app.before("/api/v1/server/time/{world}/{time}", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/server/time/{world}/{time}", serverControlAPI::setTime);

        // World routes
        app.before("/api/v1/worlds", permissionMiddleware.requirePermission(Permission.VIEW_WORLDS));
        app.get("/api/v1/worlds", worldAPI::getWorlds);
        
        app.before("/api/v1/worlds/{name}", permissionMiddleware.requirePermission(Permission.VIEW_WORLDS));
        app.get("/api/v1/worlds/{name}", worldAPI::getWorld);
        
        app.before("/api/v1/worlds/{name}/settings", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.put("/api/v1/worlds/{name}/settings", worldAPI::updateWorldSettings);
        app.post("/api/v1/worlds/{name}/settings", worldAPI::updateWorldSettings); // Also support POST
        
        app.before("/api/v1/worlds/bulk/settings", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/worlds/bulk/settings", worldAPI::updateAllWorldSettings);
        
        app.before("/api/v1/worlds/{name}/time/{time}", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/worlds/{name}/time/{time}", worldAPI::setWorldTime);
        
        app.before("/api/v1/worlds/{name}/weather/{type}", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/worlds/{name}/weather/{type}", worldAPI::setWorldWeather);
        
        app.before("/api/v1/worlds/{name}/difficulty/{difficulty}", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/worlds/{name}/difficulty/{difficulty}", worldAPI::setWorldDifficulty);
        
        app.before("/api/v1/worlds/{name}/save", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/worlds/{name}/save", worldAPI::saveWorld);
        
        app.before("/api/v1/worlds/{name}/gamerule", permissionMiddleware.requirePermission(Permission.MANAGE_WORLDS));
        app.post("/api/v1/worlds/{name}/gamerule", worldAPI::setGameRule);

        // Broadcast routes
        app.before("/api/v1/broadcast/message", permissionMiddleware.requirePermission(Permission.SEND_BROADCASTS));
        app.post("/api/v1/broadcast/message", broadcastAPI::sendChatMessage);
        
        app.before("/api/v1/broadcast/title", permissionMiddleware.requirePermission(Permission.SEND_BROADCASTS));
        app.post("/api/v1/broadcast/title", broadcastAPI::sendTitle);
        
        app.before("/api/v1/broadcast/actionbar", permissionMiddleware.requirePermission(Permission.SEND_BROADCASTS));
        app.post("/api/v1/broadcast/actionbar", broadcastAPI::sendActionBar);
        
        app.before("/api/v1/broadcast/sound", permissionMiddleware.requirePermission(Permission.SEND_BROADCASTS));
        app.post("/api/v1/broadcast/sound", broadcastAPI::playSound);

        // Log viewer routes
        app.before("/api/v1/logs/files", permissionMiddleware.requirePermission(Permission.VIEW_LOGS));
        app.get("/api/v1/logs/files", logViewerAPI::getLogFiles);
        
        app.before("/api/v1/logs/read/{filename}", permissionMiddleware.requirePermission(Permission.VIEW_LOGS));
        app.get("/api/v1/logs/read/{filename}", logViewerAPI::readLogFile);
        
        app.before("/api/v1/logs/search", permissionMiddleware.requirePermission(Permission.VIEW_LOGS));
        app.post("/api/v1/logs/search", logViewerAPI::searchLogs);
        
        app.before("/api/v1/logs/download/{filename}", permissionMiddleware.requirePermission(Permission.VIEW_LOGS));
        app.get("/api/v1/logs/download/{filename}", logViewerAPI::downloadLogFile);

        // Config editor routes
        app.before("/api/v1/configs", permissionMiddleware.requirePermission(Permission.VIEW_CONFIGS));
        app.get("/api/v1/configs", configEditorAPI::listConfigs);
        
        app.before("/api/v1/configs/read", permissionMiddleware.requirePermission(Permission.VIEW_CONFIGS));
        app.get("/api/v1/configs/read", configEditorAPI::readConfig);
        
        app.before("/api/v1/configs/write", permissionMiddleware.requirePermission(Permission.EDIT_CONFIGS));
        app.post("/api/v1/configs/write", configEditorAPI::writeConfig);

        // Whitelist routes
        app.before("/api/v1/whitelist", permissionMiddleware.requirePermission(Permission.VIEW_WHITELIST));
        app.get("/api/v1/whitelist", whitelistAPI::getWhitelist);
        
        app.before("/api/v1/whitelist/enable", permissionMiddleware.requirePermission(Permission.MANAGE_WHITELIST));
        app.post("/api/v1/whitelist/enable", whitelistAPI::enableWhitelist);
        
        app.before("/api/v1/whitelist/disable", permissionMiddleware.requirePermission(Permission.MANAGE_WHITELIST));
        app.post("/api/v1/whitelist/disable", whitelistAPI::disableWhitelist);
        
        app.before("/api/v1/whitelist/add", permissionMiddleware.requirePermission(Permission.MANAGE_WHITELIST));
        app.post("/api/v1/whitelist/add", whitelistAPI::addToWhitelist);
        
        app.before("/api/v1/whitelist/remove/{uuid}", permissionMiddleware.requirePermission(Permission.MANAGE_WHITELIST));
        app.delete("/api/v1/whitelist/remove/{uuid}", whitelistAPI::removeFromWhitelist);
        
        app.before("/api/v1/whitelist/import", permissionMiddleware.requirePermission(Permission.MANAGE_WHITELIST));
        app.post("/api/v1/whitelist/import", whitelistAPI::bulkImportWhitelist);
        
        app.before("/api/v1/whitelist/export", permissionMiddleware.requirePermission(Permission.VIEW_WHITELIST));
        app.get("/api/v1/whitelist/export", whitelistAPI::exportWhitelist);

        // Ops routes
        app.before("/api/v1/ops", permissionMiddleware.requirePermission(Permission.VIEW_OPS));
        app.get("/api/v1/ops", whitelistAPI::getOps);
        
        app.before("/api/v1/ops/add", permissionMiddleware.requirePermission(Permission.MANAGE_OPS));
        app.post("/api/v1/ops/add", whitelistAPI::addOp);
        
        app.before("/api/v1/ops/remove/{uuid}", permissionMiddleware.requirePermission(Permission.MANAGE_OPS));
        app.delete("/api/v1/ops/remove/{uuid}", whitelistAPI::removeOp);
        
        app.before("/api/v1/ops/import", permissionMiddleware.requirePermission(Permission.MANAGE_OPS));
        app.post("/api/v1/ops/import", whitelistAPI::bulkImportOps);
        
        app.before("/api/v1/ops/export", permissionMiddleware.requirePermission(Permission.VIEW_OPS));
        app.get("/api/v1/ops/export", whitelistAPI::exportOps);

        // WebSocket route for live console
        app.ws("/ws/console", ws -> {
            ws.onConnect(webSocketHandler::onConnect);
            ws.onMessage(webSocketHandler::onMessage);
            ws.onClose(webSocketHandler::onClose);
            ws.onError(webSocketHandler::onError);
        });

        // API info endpoint
        app.get("/api/v1/info", ctx -> {
            ctx.json(Map.of(
                    "name", "PaperPanel",
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
        app.before("/api/v1/users", permissionMiddleware.requirePermission(Permission.VIEW_USERS));
        app.get("/api/v1/users", userManagementAPI::getUsers);
        app.post("/api/v1/users", ctx -> {
            permissionMiddleware.requirePermission(Permission.MANAGE_USERS).handle(ctx);
            if (!ctx.res().isCommitted()) userManagementAPI.createUser(ctx);
        });
        
        app.before("/api/v1/users/{username}/password", permissionMiddleware.requirePermission(Permission.MANAGE_USERS));
        app.put("/api/v1/users/{username}/password", userManagementAPI::changePassword);
        
        app.before("/api/v1/users/{username}", permissionMiddleware.requirePermission(Permission.MANAGE_USERS));
        app.delete("/api/v1/users/{username}", userManagementAPI::deleteUser);

        // Role management routes (require MANAGE_ROLES permission)
        app.before("/api/v1/roles", permissionMiddleware.requirePermission(Permission.MANAGE_ROLES));
        app.get("/api/v1/roles", roleManagementAPI::getRoles);
        
        app.before("/api/v1/permissions", permissionMiddleware.requirePermission(Permission.MANAGE_ROLES));
        app.get("/api/v1/permissions", roleManagementAPI::getPermissions);
        
        app.before("/api/v1/users/{username}/permissions", permissionMiddleware.requirePermission(Permission.MANAGE_ROLES));
        app.get("/api/v1/users/{username}/permissions", roleManagementAPI::getUserPermissions);
        app.put("/api/v1/users/{username}/permissions", roleManagementAPI::setUserPermissions);
        
        app.before("/api/v1/users/{username}/role", permissionMiddleware.requirePermission(Permission.MANAGE_ROLES));
        app.put("/api/v1/users/{username}/role", roleManagementAPI::setUserRole);

        // Audit log routes (require MANAGE_ROLES permission to view audit logs)
        app.before("/api/v1/audit/entries", permissionMiddleware.requirePermission(Permission.MANAGE_ROLES));
        app.get("/api/v1/audit/entries", auditLogAPI::getAuditEntries);
        
        app.before("/api/v1/audit/stats", permissionMiddleware.requirePermission(Permission.MANAGE_ROLES));
        app.get("/api/v1/audit/stats", auditLogAPI::getAuditStats);
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
