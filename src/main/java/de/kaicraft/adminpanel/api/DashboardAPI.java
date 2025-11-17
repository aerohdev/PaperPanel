package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.World;

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
     * GET /api/dashboard/stats
     * Get server statistics for dashboard
     */
    public void getStats(Context ctx) {
        try {
            Map<String, Object> stats = new HashMap<>();

            // TPS (Ticks Per Second)
            double tps = getTPS();
            stats.put("tps", Math.round(tps * 100.0) / 100.0);

            // Player counts
            stats.put("onlinePlayers", Bukkit.getOnlinePlayers().size());
            stats.put("maxPlayers", Bukkit.getMaxPlayers());

            // Memory usage
            Runtime runtime = Runtime.getRuntime();
            long usedMemory = runtime.totalMemory() - runtime.freeMemory();
            long maxMemory = runtime.maxMemory();

            Map<String, Object> memory = new HashMap<>();
            memory.put("used", usedMemory);
            memory.put("max", maxMemory);
            memory.put("usedMB", usedMemory / (1024 * 1024));
            memory.put("maxMB", maxMemory / (1024 * 1024));
            memory.put("percentage", Math.round((double) usedMemory / maxMemory * 100));
            stats.put("memory", memory);

            // Uptime
            long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
            stats.put("uptime", uptime);
            stats.put("uptimeFormatted", formatUptime(uptime));

            // Server version
            stats.put("version", Bukkit.getVersion());
            stats.put("bukkitVersion", Bukkit.getBukkitVersion());

            // World information
            stats.put("worlds", Bukkit.getWorlds().size());

            // Loaded chunks
            int totalChunks = 0;
            for (World world : Bukkit.getWorlds()) {
                totalChunks += world.getLoadedChunks().length;
            }
            stats.put("loadedChunks", totalChunks);

            // Plugin count
            stats.put("plugins", Bukkit.getPluginManager().getPlugins().length);

            ctx.status(200).json(Map.of(
                    "success", true,
                    "stats", stats
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting dashboard stats: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve server statistics"
            ));
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
}
