package de.kaicraft.adminpanel;

import de.kaicraft.adminpanel.api.PlayerAPI;
import de.kaicraft.adminpanel.api.ServerControlAPI;
import de.kaicraft.adminpanel.api.WorldAPI;
import de.kaicraft.adminpanel.auth.AuthManager;
import de.kaicraft.adminpanel.config.ConfigManager;
import de.kaicraft.adminpanel.database.DatabaseManager;
import de.kaicraft.adminpanel.stats.PlayerStatsListener;
import de.kaicraft.adminpanel.stats.PlayerStatsManager;
import de.kaicraft.adminpanel.web.WebServer;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.Logger;
import org.apache.logging.log4j.core.appender.AbstractAppender;
import org.apache.logging.log4j.core.config.Property;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;
import org.jetbrains.annotations.NotNull;

/**
 * Main plugin class for Server Admin Panel
 * Provides a web-based admin interface for Minecraft Paper servers
 */
public class ServerAdminPanelPlugin extends JavaPlugin {
    private ConfigManager configManager;
    private AuthManager authManager;
    private DatabaseManager databaseManager;
    private PlayerStatsManager statsManager;
    private WebServer webServer;
    private ConsoleAppender consoleAppender;

    @Override
    public void onEnable() {
        // Save default configuration
        saveDefaultConfig();

        // Initialize configuration manager
        configManager = new ConfigManager(this);
        getLogger().info("Configuration loaded");

        // Initialize database
        databaseManager = new DatabaseManager(this);
        databaseManager.initialize();

        // Initialize stats manager
        statsManager = new PlayerStatsManager(this, databaseManager);
        getLogger().info("Player stats system initialized");

        // Register stats listener
        getServer().getPluginManager().registerEvents(
                new PlayerStatsListener(statsManager), this);

        // Initialize authentication manager
        authManager = new AuthManager(this, configManager);
        getLogger().info("Authentication system initialized");

        // Start web server if enabled
        if (configManager.isWebServerEnabled()) {
            // Initialize Phase 3 APIs
            PlayerAPI playerAPI = new PlayerAPI(this, statsManager);
            ServerControlAPI serverControlAPI = new ServerControlAPI(this);
            WorldAPI worldAPI = new WorldAPI(this);

            webServer = new WebServer(this, configManager, authManager,
                    playerAPI, serverControlAPI, worldAPI);
            webServer.start();

            // Setup console log interceptor
            setupConsoleAppender();
        } else {
            getLogger().warning("Web server is disabled in configuration");
        }

        getLogger().info("ServerAdminPanel v" + getPluginMeta().getVersion() + " enabled!");
    }

    @Override
    public void onDisable() {
        // Stop web server
        if (webServer != null) {
            webServer.stop();
        }

        // Close database connection
        if (databaseManager != null) {
            databaseManager.close();
        }

        // Remove console appender
        if (consoleAppender != null) {
            consoleAppender.stop();
        }

        getLogger().info("ServerAdminPanel disabled");
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command,
                            @NotNull String label, @NotNull String[] args) {
        if (command.getName().equalsIgnoreCase("adminpanel")) {
            if (args.length == 0) {
                sender.sendMessage("§6=== Server Admin Panel ===");
                sender.sendMessage("§7Version: §f" + getPluginMeta().getVersion());
                if (webServer != null) {
                    sender.sendMessage("§7Status: §aRunning");
                    sender.sendMessage("§7Port: §f" + configManager.getPort());
                    sender.sendMessage("§7Access: §bhttp://localhost:" + configManager.getPort());
                } else {
                    sender.sendMessage("§7Status: §cDisabled");
                }
                sender.sendMessage("§7Commands:");
                sender.sendMessage("§f  /adminpanel reload §7- Reload configuration");
                sender.sendMessage("§f  /adminpanel status §7- Show server status");
                sender.sendMessage("§f  /adminpanel resetpassword §7- Reset admin password to default");
                return true;
            }

            String subCommand = args[0].toLowerCase();

            switch (subCommand) {
                case "reload":
                    if (!sender.hasPermission("adminpanel.use")) {
                        sender.sendMessage("§cYou don't have permission to use this command");
                        return true;
                    }

                    reloadConfig();
                    configManager.reload();
                    sender.sendMessage("§aConfiguration reloaded successfully");
                    sender.sendMessage("§eNote: Web server restart required for some changes");
                    return true;

                case "status":
                    if (!sender.hasPermission("adminpanel.use")) {
                        sender.sendMessage("§cYou don't have permission to use this command");
                        return true;
                    }

                    sender.sendMessage("§6=== Admin Panel Status ===");
                    sender.sendMessage("§7Web Server: §f" + (webServer != null ? "Running" : "Stopped"));
                    if (webServer != null) {
                        sender.sendMessage("§7Port: §f" + configManager.getPort());
                        sender.sendMessage("§7Active Sessions: §f" + authManager.getActiveSessionCount());
                        sender.sendMessage("§7WebSocket Clients: §f" +
                                webServer.getWebSocketHandler().getClientCount());
                    }
                    return true;

                case "resetpassword":
                    if (!sender.hasPermission("adminpanel.use")) {
                        sender.sendMessage("§cYou don't have permission to use this command");
                        return true;
                    }

                    authManager.resetAdminPassword();
                    sender.sendMessage("§aAdmin password has been reset to the default password");
                    sender.sendMessage("§eUsername: §f" + configManager.getDefaultUsername());
                    sender.sendMessage("§ePassword: §f" + configManager.getDefaultPassword());
                    sender.sendMessage("§c§lWARNING: §cPlease change this password immediately!");
                    return true;

                default:
                    sender.sendMessage("§cUnknown subcommand. Use /adminpanel for help");
                    return true;
            }
        }

        return false;
    }

    /**
     * Setup console appender to intercept log messages
     */
    private void setupConsoleAppender() {
        try {
            Logger rootLogger = (Logger) LogManager.getRootLogger();
            consoleAppender = new ConsoleAppender();
            consoleAppender.start();
            rootLogger.addAppender(consoleAppender);
            getLogger().info("Console log interceptor initialized");
        } catch (Exception e) {
            getLogger().warning("Failed to setup console appender: " + e.getMessage());
        }
    }

    /**
     * Custom Log4j appender to capture console output
     */
    private class ConsoleAppender extends AbstractAppender {
        protected ConsoleAppender() {
            super("ServerAdminPanelAppender", null, null, true, new Property[0]);
        }

        @Override
        public void append(LogEvent event) {
            try {
                if (webServer == null) {
                    return;
                }

                // Format log message
                String level = event.getLevel().name();
                String loggerName = event.getLoggerName();
                String message = event.getMessage().getFormattedMessage();

                // Build formatted log line
                String formattedMessage = String.format("[%s] [%s] %s",
                        level,
                        loggerName.substring(loggerName.lastIndexOf('.') + 1),
                        message);

                // Add to console history
                webServer.getConsoleAPI().addToHistory(formattedMessage);

                // Broadcast to WebSocket clients
                webServer.getWebSocketHandler().broadcast(formattedMessage);

            } catch (Exception e) {
                // Silently fail to avoid log spam
            }
        }
    }

    // Getters for other components to access plugin resources

    public ConfigManager getConfigManager() {
        return configManager;
    }

    public AuthManager getAuthManager() {
        return authManager;
    }

    public WebServer getWebServer() {
        return webServer;
    }
}
