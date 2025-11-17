package de.kaicraft.adminpanel.config;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import org.bukkit.configuration.file.FileConfiguration;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Manages plugin configuration and provides easy access to config values
 */
public class ConfigManager {
    private final ServerAdminPanelPlugin plugin;
    private FileConfiguration config;

    public ConfigManager(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.config = plugin.getConfig();

        // Auto-generate JWT secret if not set
        if (config.getString("auth.jwt-secret", "").isEmpty()) {
            String secret = generateSecureSecret();
            config.set("auth.jwt-secret", secret);
            plugin.saveConfig();
            plugin.getLogger().info("Generated new JWT secret");
        }
    }

    /**
     * Reload configuration from disk
     */
    public void reload() {
        plugin.reloadConfig();
        this.config = plugin.getConfig();
    }

    // Web Server Configuration
    public boolean isWebServerEnabled() {
        return config.getBoolean("web-server.enabled", true);
    }

    public int getPort() {
        return config.getInt("web-server.port", 8080);
    }

    public String getHost() {
        return config.getString("web-server.host", "0.0.0.0");
    }

    // Authentication Configuration
    public String getDefaultUsername() {
        return config.getString("auth.default-username", "admin");
    }

    public String getDefaultPassword() {
        return config.getString("auth.default-password", "changeme");
    }

    public String getJwtSecret() {
        return config.getString("auth.jwt-secret", "");
    }

    public int getSessionTimeout() {
        return config.getInt("auth.session-timeout", 3600);
    }

    // Console Configuration
    public int getMaxHistoryLines() {
        return config.getInt("console.max-history-lines", 1000);
    }

    public boolean isCommandExecutionAllowed() {
        return config.getBoolean("console.allow-commands", true);
    }

    // Security Configuration
    public boolean isCorsEnabled() {
        return config.getBoolean("security.enable-cors", true);
    }

    public int getRateLimit() {
        return config.getInt("security.rate-limit", 60);
    }

    /**
     * Generate a secure random secret for JWT signing
     */
    private String generateSecureSecret() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[64];
        random.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }
}
