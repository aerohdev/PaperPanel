package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.World;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * API endpoints for server control operations
 */
public class ServerControlAPI {
    private final ServerAdminPanelPlugin plugin;

    public ServerControlAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
    }

    /**
     * POST /api/server/restart
     * Schedule a server restart
     */
    @TypeScriptEndpoint(path = "POST /api/v1/server/restart", responseType = "{ message: string, delay: number }")
    public void scheduleRestart(Context ctx) {
        try {
            String delayParam = ctx.queryParam("delay");
            int delay = Integer.parseInt(delayParam != null ? delayParam : "60");

            if (delay < 10) {
                ctx.status(400).json(ApiResponse.error("Delay must be at least 10 seconds"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logSecurityEvent(username, "schedule-restart (" + delay + "s)", true);

            // Schedule warnings
            int[] warnings = {300, 60, 30, 10, 5, 3, 2, 1};
            for (int warning : warnings) {
                if (warning < delay) {
                    long delayTicks = (delay - warning) * 20L;
                    Bukkit.getScheduler().runTaskLater(plugin, () -> {
                        Bukkit.broadcast(net.kyori.adventure.text.Component.text(
                                "§c§l[SERVER] §eRestart in " + warning + " seconds!"));
                    }, delayTicks);
                }
            }

            // Schedule actual restart
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                Bukkit.broadcast(net.kyori.adventure.text.Component.text(
                        "§c§l[SERVER] §eRestarting now..."));

                // Save everything
                Bukkit.savePlayers();
                Bukkit.getWorlds().forEach(World::save);

                // Shutdown
                Bukkit.shutdown();
            }, delay * 20L);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Server restart scheduled");
            data.put("delay", delay);
            ctx.status(200).json(ApiResponse.success(data));
        } catch (NumberFormatException e) {
            ctx.status(400).json(ApiResponse.error("Invalid delay value"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/server/restart", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to schedule restart"));
        }
    }

    /**
     * POST /api/server/stop
     * Stop the server immediately (will restart if using auto-restart script)
     */
    @TypeScriptEndpoint(path = "POST /api/v1/server/stop", responseType = "{ message: string }")
    public void stopServer(Context ctx) {
        try {
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logSecurityEvent(username, "stop-server", true);

            ctx.status(200).json(ApiResponse.successMessage("Server stopping..."));

            // Stop server after a short delay to allow response
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                Bukkit.savePlayers();
                Bukkit.getWorlds().forEach(World::save);
                Bukkit.shutdown();
            }, 20L);
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/server/stop", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to stop server"));
        }
    }

    /**
     * POST /api/server/graceful-stop
     * Stop the server without automatic restart (creates .stop file)
     */
    @TypeScriptEndpoint(path = "POST /api/v1/server/graceful-stop", responseType = "{ message: string }")
    public void gracefulStop(Context ctx) {
        try {
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logSecurityEvent(username, "graceful-stop-server", true);

            // Create .stop file to prevent restart
            File stopFile = new File(".stop");
            try {
                if (stopFile.createNewFile()) {
                    plugin.getLogger().info("Created .stop file - server will not restart after shutdown");
                } else {
                    plugin.getLogger().warning(".stop file already exists");
                }
            } catch (IOException e) {
                plugin.getLogger().warning("Failed to create .stop file: " + e.getMessage());
                ctx.status(500).json(ApiResponse.error("Failed to create stop file"));
                return;
            }

            ctx.status(200).json(ApiResponse.successMessage("Server stopping gracefully (will not restart)..."));

            // Stop server after a short delay to allow response
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                Bukkit.savePlayers();
                Bukkit.getWorlds().forEach(World::save);
                Bukkit.shutdown();
            }, 20L);
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/server/graceful-stop", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to stop server gracefully"));
        }
    }

    /**
     * POST /api/server/save-all
     * Save all worlds
     */
    @TypeScriptEndpoint(path = "POST /api/v1/server/save-all", responseType = "{ message: string }")
    public void saveAll(Context ctx) {
        try {
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "save-all", "Saving all worlds");

            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.savePlayers();
                Bukkit.getWorlds().forEach(World::save);
            });

            ctx.status(200).json(ApiResponse.successMessage("All worlds saved"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/server/save-all", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to save worlds"));
        }
    }

    /**
     * POST /api/server/weather/{world}/{type}
     * Set weather in a world
     */
    @TypeScriptEndpoint(path = "POST /api/v1/server/weather/{world}/{type}", responseType = "{ message: string, world: string, weather: string }")
    public void setWeather(Context ctx) {
        try {
            String worldName = ctx.pathParam("world");
            String weatherType = ctx.pathParam("type");

            World world = Bukkit.getWorld(worldName);

            if (world == null) {
                ctx.status(404).json(ApiResponse.error("World not found"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "set-weather", worldName + " - " + weatherType);

            Bukkit.getScheduler().runTask(plugin, () -> {
                switch (weatherType.toLowerCase()) {
                    case "clear":
                        world.setStorm(false);
                        world.setThundering(false);
                        break;
                    case "rain":
                        world.setStorm(true);
                        world.setThundering(false);
                        break;
                    case "thunder":
                        world.setStorm(true);
                        world.setThundering(true);
                        break;
                    default:
                        break;
                }
            });

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Weather updated");
            data.put("world", worldName);
            data.put("weather", weatherType);
            ctx.status(200).json(ApiResponse.success(data));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/server/weather/{world}/{type}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to set weather"));
        }
    }

    /**
     * POST /api/server/time/{world}/{time}
     * Set time in a world
     */
    @TypeScriptEndpoint(path = "POST /api/v1/server/time/{world}/{time}", responseType = "{ message: string, world: string, time: string }")
    public void setTime(Context ctx) {
        try {
            String worldName = ctx.pathParam("world");
            String timeType = ctx.pathParam("time");

            World world = Bukkit.getWorld(worldName);

            if (world == null) {
                ctx.status(404).json(ApiResponse.error("World not found"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "set-time", worldName + " - " + timeType);

            Bukkit.getScheduler().runTask(plugin, () -> {
                switch (timeType.toLowerCase()) {
                    case "day":
                        world.setTime(1000);
                        break;
                    case "night":
                        world.setTime(13000);
                        break;
                    case "noon":
                        world.setTime(6000);
                        break;
                    case "midnight":
                        world.setTime(18000);
                        break;
                    default:
                        // Try to parse as number
                        try {
                            long time = Long.parseLong(timeType);
                            world.setTime(time);
                        } catch (NumberFormatException ignored) {
                        }
                        break;
                }
            });

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Time updated");
            data.put("world", worldName);
            data.put("time", timeType);
            ctx.status(200).json(ApiResponse.success(data));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/server/time/{world}/{time}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to set time"));
        }
    }
}
