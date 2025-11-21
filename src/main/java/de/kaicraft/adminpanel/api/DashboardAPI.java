package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.model.DashboardStats;
import de.kaicraft.adminpanel.model.UpdateStatus;
import de.kaicraft.adminpanel.update.PaperVersionChecker;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;
import org.bukkit.Bukkit;

import java.lang.management.ManagementFactory;
import java.util.HashMap;
import java.util.Map;

/**
 * API endpoints for dashboard statistics
 */
public class DashboardAPI {
    private final ServerAdminPanelPlugin plugin;
    private final long startTime;

    public DashboardAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.startTime = System.currentTimeMillis();
    }

    /**
     * GET /api/v1/dashboard/stats
     * Get server statistics for dashboard
     */
    @TypeScriptEndpoint(path = "/api/v1/dashboard/stats", method = "GET", description = "Get server statistics")
    public void getStats(Context ctx) {
        try {
            // TPS (Ticks Per Second)
            double tps = Math.round(getTPS() * 100.0) / 100.0;

            // Player counts
            int onlinePlayers = Bukkit.getOnlinePlayers().size();
            int maxPlayers = Bukkit.getMaxPlayers();

            // Memory usage
            Runtime runtime = Runtime.getRuntime();
            long usedMemory = runtime.totalMemory() - runtime.freeMemory();
            long maxMemory = runtime.maxMemory();

            DashboardStats.MemoryInfo memory = new DashboardStats.MemoryInfo(
                usedMemory,
                maxMemory,
                usedMemory / (1024 * 1024),
                maxMemory / (1024 * 1024),
                (int) Math.round((double) usedMemory / maxMemory * 100)
            );

            // Uptime
            long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
            String uptimeFormatted = formatUptime(uptime);

            // Server version
            String version = Bukkit.getVersion();
            String bukkitVersion = Bukkit.getBukkitVersion();

            // World information
            int worlds = Bukkit.getWorlds().size();

            // Loaded chunks
            int totalChunks = 0;
            for (org.bukkit.World world : Bukkit.getWorlds()) {
                totalChunks += world.getLoadedChunks().length;
            }

            // Plugin count
            int plugins = Bukkit.getPluginManager().getPlugins().length;

            DashboardStats stats = new DashboardStats(
                tps, onlinePlayers, maxPlayers, memory, uptime, uptimeFormatted,
                version, bukkitVersion, worlds, totalChunks, plugins
            );

            ctx.status(200).json(ApiResponse.success("stats", stats));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/dashboard/stats", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve server statistics"));
        }
    }

    /**
     * Get server TPS (average of last minute)
     */
    private double getTPS() {
        try {
            // Paper API method for getting TPS
            return Bukkit.getTPS()[0]; // 1-minute average
        } catch (Exception e) {
            // Fallback if Paper API not available
            return 20.0;
        }
    }

    /**
     * Format uptime in human-readable format
     */
    private String formatUptime(long millis) {
        long seconds = millis / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;

        seconds %= 60;
        minutes %= 60;
        hours %= 24;

        if (days > 0) {
            return String.format("%dd %dh %dm %ds", days, hours, minutes, seconds);
        } else if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, seconds);
        } else {
            return String.format("%ds", seconds);
        }
    }

    /**
     * GET /api/v1/dashboard/update-status
     * Get server update status
     */
    @TypeScriptEndpoint(path = "/api/v1/dashboard/update-status", method = "GET", description = "Get update status")
    public void getUpdateStatus(Context ctx) {
        try {
            PaperVersionChecker checker = plugin.getVersionChecker();
            PaperVersionChecker.UpdateStatus status = checker.getStatus();
            
            UpdateStatus updateStatus = new UpdateStatus(
                status.updateAvailable,
                status.updateDownloaded,
                status.currentVersion,
                status.latestVersion,
                status.latestBuild,
                status.downloadUrl,
                status.lastCheck,
                status.needsCheck
            );
            
            ctx.json(ApiResponse.success("updateStatus", updateStatus));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/dashboard/update-status", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to get update status"));
        }
    }

    /**
     * POST /api/v1/dashboard/check-updates
     * Manually check for updates
     */
    @TypeScriptEndpoint(path = "/api/v1/dashboard/check-updates", method = "POST", description = "Check for updates")
    public void checkForUpdates(Context ctx) {
        try {
            String currentUser = (String) ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(currentUser, "initiated manual update check", "");
            
            PaperVersionChecker checker = plugin.getVersionChecker();
            
            // Start check asynchronously
            checker.checkForUpdates().thenAccept(updateAvailable -> {
                plugin.getAuditLogger().logApiInfo("POST /api/v1/dashboard/check-updates", 
                    "Update check complete. Update available: " + updateAvailable);
            });
            
            ctx.json(ApiResponse.successMessage("Update check started"));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/dashboard/check-updates", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to check for updates"));
        }
    }

    /**
     * POST /api/v1/dashboard/download-update
     * Download Paper update
     */
    @TypeScriptEndpoint(path = "/api/v1/dashboard/download-update", method = "POST", description = "Download update")
    public void downloadUpdate(Context ctx) {
        try {
            String currentUser = (String) ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(currentUser, "initiated update download", "");
            
            PaperVersionChecker checker = plugin.getVersionChecker();
            PaperVersionChecker.UpdateStatus status = checker.getStatus();
            
            if (!status.updateAvailable) {
                ctx.status(400).json(ApiResponse.error("No update available"));
                return;
            }
            
            // Start download asynchronously
            checker.downloadUpdate().thenAccept(result -> {
                if (result.success) {
                    plugin.getAuditLogger().logApiInfo("POST /api/v1/dashboard/download-update", 
                        "Update download completed successfully");
                } else {
                    plugin.getAuditLogger().logApiError("POST /api/v1/dashboard/download-update", 
                        result.message, null);
                }
            });
            
            ctx.json(ApiResponse.successMessage("Update download started. Check server logs for progress."));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/dashboard/download-update", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to start download"));
        }
    }

    /**
     * POST /api/v1/dashboard/install-update
     * Install Paper update (full workflow)
     */
    @TypeScriptEndpoint(path = "/api/v1/dashboard/install-update", method = "POST", description = "Install update")
    public void installUpdate(Context ctx) {
        try {
            String currentUser = (String) ctx.attribute("username");
            
            PaperVersionChecker checker = plugin.getVersionChecker();
            PaperVersionChecker.UpdateStatus status = checker.getStatus();
            
            if (!status.updateDownloaded) {
                ctx.status(400).json(ApiResponse.error("Update not downloaded yet"));
                return;
            }
            
            plugin.getAuditLogger().logSecurityEvent(currentUser, "initiated update installation", true);
            
            // Start installation
            checker.installUpdate().thenAccept(result -> {
                if (result.success) {
                    plugin.getAuditLogger().logApiInfo("POST /api/v1/dashboard/install-update", 
                        "Update installation workflow initiated");
                } else {
                    plugin.getAuditLogger().logApiError("POST /api/v1/dashboard/install-update", 
                        result.message, null);
                }
            });
            
            ctx.json(ApiResponse.successMessage("Update installation started. Server will restart in 5 minutes."));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/dashboard/install-update", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to start installation: " + e.getMessage()));
        }
    }
}
