package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.event.server.ServerListPingEvent;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * API for server maintenance mode management
 */
public class MaintenanceAPI implements Listener {
    private final ServerAdminPanelPlugin plugin;
    private final File maintenanceFile;
    private FileConfiguration maintenanceConfig;

    // Maintenance state
    private boolean maintenanceEnabled = false;
    private String kickMessage = "§cServer is currently under maintenance!\n§7Please check back later.";
    private String motd = "§c§lMaintenance Mode\n§7We'll be back soon!";
    private String playerCountText = ""; // Custom text for player count (leave empty to show normal count)
    private String serverIconPath = ""; // Path to custom server icon (leave empty for default)
    private Set<UUID> whitelist = new HashSet<>();
    private long maintenanceEndTime = 0; // 0 = no timer
    private org.bukkit.util.CachedServerIcon cachedIcon = null;

    public MaintenanceAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.maintenanceFile = new File(plugin.getDataFolder(), "maintenance.yml");
        loadConfiguration();

        // Register event listener
        Bukkit.getPluginManager().registerEvents(this, plugin);

        // Start timer task
        startTimerTask();
    }

    /**
     * Load maintenance configuration from file
     */
    private void loadConfiguration() {
        if (!maintenanceFile.exists()) {
            try {
                maintenanceFile.createNewFile();
            } catch (IOException e) {
                plugin.getLogger().warning("Failed to create maintenance.yml: " + e.getMessage());
            }
        }

        maintenanceConfig = YamlConfiguration.loadConfiguration(maintenanceFile);

        // Load settings
        maintenanceEnabled = maintenanceConfig.getBoolean("enabled", false);
        kickMessage = maintenanceConfig.getString("kick-message", kickMessage);
        motd = maintenanceConfig.getString("motd", motd);
        playerCountText = maintenanceConfig.getString("player-count-text", "");
        serverIconPath = maintenanceConfig.getString("server-icon-path", "");
        maintenanceEndTime = maintenanceConfig.getLong("end-time", 0);

        // Load whitelist
        List<String> whitelistStrings = maintenanceConfig.getStringList("whitelist");
        whitelist.clear();
        for (String uuidStr : whitelistStrings) {
            try {
                whitelist.add(UUID.fromString(uuidStr));
            } catch (IllegalArgumentException ignored) {}
        }

        // Load server icon if path is set
        loadServerIcon();
    }

    /**
     * Save maintenance configuration to file
     */
    private void saveConfiguration() {
        maintenanceConfig.set("enabled", maintenanceEnabled);
        maintenanceConfig.set("kick-message", kickMessage);
        maintenanceConfig.set("motd", motd);
        maintenanceConfig.set("player-count-text", playerCountText);
        maintenanceConfig.set("server-icon-path", serverIconPath);
        maintenanceConfig.set("end-time", maintenanceEndTime);

        List<String> whitelistStrings = whitelist.stream()
            .map(UUID::toString)
            .collect(Collectors.toList());
        maintenanceConfig.set("whitelist", whitelistStrings);

        try {
            maintenanceConfig.save(maintenanceFile);
        } catch (IOException e) {
            plugin.getLogger().warning("Failed to save maintenance.yml: " + e.getMessage());
        }
    }

    /**
     * Load server icon from file path
     */
    private void loadServerIcon() {
        if (serverIconPath == null || serverIconPath.isEmpty()) {
            cachedIcon = null;
            return;
        }

        try {
            File iconFile = new File(serverIconPath);
            if (!iconFile.exists() || !iconFile.isFile()) {
                plugin.getLogger().warning("Maintenance icon file not found: " + serverIconPath);
                cachedIcon = null;
                return;
            }

            cachedIcon = Bukkit.loadServerIcon(iconFile);
            plugin.getLogger().info("Loaded maintenance server icon from: " + serverIconPath);
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to load maintenance icon: " + e.getMessage());
            cachedIcon = null;
        }
    }

    /**
     * Start timer task to check for automatic disable
     */
    private void startTimerTask() {
        Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            if (maintenanceEnabled && maintenanceEndTime > 0) {
                if (System.currentTimeMillis() >= maintenanceEndTime) {
                    // Auto-disable maintenance
                    maintenanceEnabled = false;
                    maintenanceEndTime = 0;
                    saveConfiguration();

                    // Broadcast message
                    Bukkit.broadcastMessage("§a§lMaintenance mode has been automatically disabled!");
                    plugin.getLogger().info("Maintenance mode automatically disabled (timer expired)");
                }
            }
        }, 20L, 20L); // Check every second
    }

    /**
     * Event handler: Block player login during maintenance
     */
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onPlayerLogin(PlayerLoginEvent event) {
        if (!maintenanceEnabled) return;

        Player player = event.getPlayer();

        // Check if player has bypass permission
        if (player.hasPermission("paperpanel.maintenance.bypass")) {
            return;
        }

        // Check if player is whitelisted
        if (whitelist.contains(player.getUniqueId())) {
            return;
        }

        // Kick player with maintenance message
        String message = kickMessage;
        if (maintenanceEndTime > 0) {
            long remaining = maintenanceEndTime - System.currentTimeMillis();
            if (remaining > 0) {
                message += "\n\n§7Time remaining: §e" + formatTime(remaining);
            }
        }

        event.disallow(PlayerLoginEvent.Result.KICK_OTHER, message);

        // Notify online staff
        notifyStaff(player.getName() + " tried to join during maintenance");
    }

    /**
     * Event handler: Change MOTD, icon, and player count during maintenance
     */
    @EventHandler
    public void onServerListPing(ServerListPingEvent event) {
        if (!maintenanceEnabled) return;

        // Set custom MOTD with timer
        String motdMessage = motd;
        if (maintenanceEndTime > 0) {
            long remaining = maintenanceEndTime - System.currentTimeMillis();
            if (remaining > 0) {
                motdMessage = motdMessage.replace("%TIMER%", formatTime(remaining));
            }
        }
        event.setMotd(motdMessage);

        // Set custom server icon if available
        if (cachedIcon != null) {
            try {
                event.setServerIcon(cachedIcon);
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to set maintenance server icon: " + e.getMessage());
            }
        }

        // Set custom player count text if configured
        if (playerCountText != null && !playerCountText.isEmpty()) {
            try {
                // Use the protocol hack to show custom text
                // This works by setting maxPlayers to 0 and using the version string
                event.setMaxPlayers(0);
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to set custom player count: " + e.getMessage());
            }
        }
    }

    /**
     * Notify staff members about maintenance events
     */
    private void notifyStaff(String message) {
        for (Player player : Bukkit.getOnlinePlayers()) {
            if (player.hasPermission("paperpanel.maintenance.notify")) {
                player.sendMessage("§7[§6Maintenance§7] §e" + message);
            }
        }
    }

    /**
     * Format milliseconds to readable time
     */
    private String formatTime(long millis) {
        long seconds = millis / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;

        if (days > 0) {
            return days + "d " + (hours % 24) + "h";
        } else if (hours > 0) {
            return hours + "h " + (minutes % 60) + "m";
        } else if (minutes > 0) {
            return minutes + "m " + (seconds % 60) + "s";
        } else {
            return seconds + "s";
        }
    }

    /**
     * GET /api/v1/maintenance/status
     * Get current maintenance status
     */
    @TypeScriptEndpoint(path = "GET /api/v1/maintenance/status", responseType = "{ enabled: boolean, kickMessage: string, motd: string, playerCountText: string, serverIconPath: string, endTime: number, whitelist: Array<{uuid: string, name: string}> }")
    public void getStatus(Context ctx) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("enabled", maintenanceEnabled);
            data.put("kickMessage", kickMessage);
            data.put("motd", motd);
            data.put("playerCountText", playerCountText);
            data.put("serverIconPath", serverIconPath);
            data.put("endTime", maintenanceEndTime);

            // Get whitelist with player names
            List<Map<String, Object>> whitelistData = new ArrayList<>();
            for (UUID uuid : whitelist) {
                OfflinePlayer player = Bukkit.getOfflinePlayer(uuid);
                Map<String, Object> playerData = new HashMap<>();
                playerData.put("uuid", uuid.toString());
                playerData.put("name", player.getName() != null ? player.getName() : "Unknown");
                whitelistData.add(playerData);
            }
            data.put("whitelist", whitelistData);

            ctx.json(ApiResponse.success(data));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/maintenance/status", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to get maintenance status"));
        }
    }

    /**
     * POST /api/v1/maintenance/enable
     * Enable maintenance mode
     */
    @TypeScriptEndpoint(path = "POST /api/v1/maintenance/enable", responseType = "{ message: string }")
    public void enableMaintenance(Context ctx) {
        try {
            maintenanceEnabled = true;
            saveConfiguration();

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logSecurityEvent(username, "enabled-maintenance-mode", true);

            // Broadcast to online players
            Bukkit.broadcastMessage("§c§lMaintenance mode has been enabled!");

            ctx.json(ApiResponse.successMessage("Maintenance mode enabled"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/maintenance/enable", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to enable maintenance mode"));
        }
    }

    /**
     * POST /api/v1/maintenance/disable
     * Disable maintenance mode
     */
    @TypeScriptEndpoint(path = "POST /api/v1/maintenance/disable", responseType = "{ message: string }")
    public void disableMaintenance(Context ctx) {
        try {
            maintenanceEnabled = false;
            maintenanceEndTime = 0;
            saveConfiguration();

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logSecurityEvent(username, "disabled-maintenance-mode", true);

            // Broadcast to online players
            Bukkit.broadcastMessage("§a§lMaintenance mode has been disabled!");

            ctx.json(ApiResponse.successMessage("Maintenance mode disabled"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/maintenance/disable", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to disable maintenance mode"));
        }
    }

    /**
     * PUT /api/v1/maintenance/settings
     * Update maintenance settings
     */
    @TypeScriptEndpoint(path = "PUT /api/v1/maintenance/settings", responseType = "{ message: string }")
    public void updateSettings(Context ctx) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = ctx.bodyAsClass(Map.class);

            if (body.containsKey("kickMessage")) {
                kickMessage = (String) body.get("kickMessage");
            }

            if (body.containsKey("motd")) {
                motd = (String) body.get("motd");
            }

            if (body.containsKey("playerCountText")) {
                playerCountText = (String) body.get("playerCountText");
            }

            if (body.containsKey("serverIconPath")) {
                String newIconPath = (String) body.get("serverIconPath");
                if (!newIconPath.equals(serverIconPath)) {
                    serverIconPath = newIconPath;
                    loadServerIcon(); // Reload icon when path changes
                }
            }

            saveConfiguration();

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "update-maintenance-settings", "Updated maintenance messages");

            ctx.json(ApiResponse.successMessage("Maintenance settings updated"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("PUT /api/v1/maintenance/settings", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to update maintenance settings"));
        }
    }

    /**
     * POST /api/v1/maintenance/whitelist/add
     * Add player to maintenance whitelist
     */
    @TypeScriptEndpoint(path = "POST /api/v1/maintenance/whitelist/add", responseType = "{ message: string }")
    public void addToWhitelist(Context ctx) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            String playerName = (String) body.get("playerName");

            if (playerName == null || playerName.isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Player name is required"));
                return;
            }

            // Get player UUID
            OfflinePlayer player = Bukkit.getOfflinePlayer(playerName);
            if (!player.hasPlayedBefore() && !player.isOnline()) {
                ctx.status(404).json(ApiResponse.error("Player not found"));
                return;
            }

            whitelist.add(player.getUniqueId());
            saveConfiguration();

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "add-maintenance-whitelist", playerName);

            ctx.json(ApiResponse.successMessage("Player added to maintenance whitelist"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/maintenance/whitelist/add", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to add player to whitelist"));
        }
    }

    /**
     * DELETE /api/v1/maintenance/whitelist/remove/{uuid}
     * Remove player from maintenance whitelist
     */
    @TypeScriptEndpoint(path = "DELETE /api/v1/maintenance/whitelist/remove/{uuid}", responseType = "{ message: string }")
    public void removeFromWhitelist(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            whitelist.remove(uuid);
            saveConfiguration();

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "remove-maintenance-whitelist", uuidStr);

            ctx.json(ApiResponse.successMessage("Player removed from maintenance whitelist"));
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(ApiResponse.error("Invalid UUID"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("DELETE /api/v1/maintenance/whitelist/remove", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to remove player from whitelist"));
        }
    }

    /**
     * POST /api/v1/maintenance/timer
     * Set maintenance end timer
     */
    @TypeScriptEndpoint(path = "POST /api/v1/maintenance/timer", responseType = "{ message: string }")
    public void setTimer(Context ctx) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = ctx.bodyAsClass(Map.class);

            if (body.containsKey("duration")) {
                // Duration in minutes
                int durationMinutes = ((Number) body.get("duration")).intValue();
                maintenanceEndTime = System.currentTimeMillis() + (durationMinutes * 60 * 1000L);
            } else {
                // Clear timer
                maintenanceEndTime = 0;
            }

            saveConfiguration();

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "set-maintenance-timer",
                maintenanceEndTime > 0 ? "Timer set" : "Timer cleared");

            ctx.json(ApiResponse.successMessage(
                maintenanceEndTime > 0 ? "Maintenance timer set" : "Maintenance timer cleared"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/maintenance/timer", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to set maintenance timer"));
        }
    }
}
