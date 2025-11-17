package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.World;

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
    public void scheduleRestart(Context ctx) {
        try {
            int delay = Integer.parseInt(ctx.queryParam("delay", "60"));

            if (delay < 10) {
                ctx.status(400).json(Map.of(
                        "success", false,
                        "error", "Bad Request",
                        "message", "Delay must be at least 10 seconds"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' scheduled restart in " + delay + " seconds");

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

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Server restart scheduled",
                    "delay", delay
            ));
        } catch (NumberFormatException e) {
            ctx.status(400).json(Map.of(
                    "success", false,
                    "error", "Bad Request",
                    "message", "Invalid delay value"
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error scheduling restart: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to schedule restart"
            ));
        }
    }

    /**
     * POST /api/server/stop
     * Stop the server immediately
     */
    public void stopServer(Context ctx) {
        try {
            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' stopped the server");

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Server stopping..."
            ));

            // Stop server after a short delay to allow response
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                Bukkit.savePlayers();
                Bukkit.getWorlds().forEach(World::save);
                Bukkit.shutdown();
            }, 20L);
        } catch (Exception e) {
            plugin.getLogger().severe("Error stopping server: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to stop server"
            ));
        }
    }

    /**
     * POST /api/server/save-all
     * Save all worlds
     */
    public void saveAll(Context ctx) {
        try {
            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' triggered save-all");

            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.savePlayers();
                Bukkit.getWorlds().forEach(World::save);
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "All worlds saved"
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error saving worlds: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to save worlds"
            ));
        }
    }

    /**
     * POST /api/server/weather/{world}/{type}
     * Set weather in a world
     */
    public void setWeather(Context ctx) {
        try {
            String worldName = ctx.pathParam("world");
            String weatherType = ctx.pathParam("type");

            World world = Bukkit.getWorld(worldName);

            if (world == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "World not found"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' set weather to " + weatherType + " in " + worldName);

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

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Weather updated",
                    "world", worldName,
                    "weather", weatherType
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error setting weather: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to set weather"
            ));
        }
    }

    /**
     * POST /api/server/time/{world}/{time}
     * Set time in a world
     */
    public void setTime(Context ctx) {
        try {
            String worldName = ctx.pathParam("world");
            String timeType = ctx.pathParam("time");

            World world = Bukkit.getWorld(worldName);

            if (world == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "World not found"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' set time to " + timeType + " in " + worldName);

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

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Time updated",
                    "world", worldName,
                    "time", timeType
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error setting time: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to set time"
            ));
        }
    }
}
