package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.entity.Entity;

import java.util.*;
import java.util.stream.Collectors;

/**
 * API endpoints for world management
 */
public class WorldAPI {
    private final ServerAdminPanelPlugin plugin;

    public WorldAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
    }

    /**
     * GET /api/worlds
     * Get list of all worlds
     */
    public void getWorlds(Context ctx) {
        try {
            List<Map<String, Object>> worlds = Bukkit.getWorlds().stream()
                    .map(this::getWorldInfo)
                    .collect(Collectors.toList());

            ctx.status(200).json(Map.of(
                    "success", true,
                    "worlds", worlds
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting worlds: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve worlds"
            ));
        }
    }

    /**
     * GET /api/worlds/{name}
     * Get specific world details
     */
    public void getWorld(Context ctx) {
        try {
            String worldName = ctx.pathParam("name");
            World world = Bukkit.getWorld(worldName);

            if (world == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "World not found"
                ));
                return;
            }

            Map<String, Object> worldData = getWorldInfo(world);

            // Add detailed entity breakdown
            Map<String, Integer> entityCounts = new HashMap<>();
            for (Entity entity : world.getEntities()) {
                String type = entity.getType().name();
                entityCounts.put(type, entityCounts.getOrDefault(type, 0) + 1);
            }
            worldData.put("entityBreakdown", entityCounts);

            ctx.status(200).json(Map.of(
                    "success", true,
                    "world", worldData
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting world: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve world data"
            ));
        }
    }

    /**
     * POST /api/worlds/{name}/settings
     * Update world settings
     */
    public void updateWorldSettings(Context ctx) {
        try {
            String worldName = ctx.pathParam("name");
            World world = Bukkit.getWorld(worldName);

            if (world == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "World not found"
                ));
                return;
            }

            Map<String, Object> settings = ctx.bodyAsClass(Map.class);
            String username = ctx.attribute("username");

            Bukkit.getScheduler().runTask(plugin, () -> {
                if (settings.containsKey("difficulty")) {
                    String difficulty = (String) settings.get("difficulty");
                    try {
                        world.setDifficulty(org.bukkit.Difficulty.valueOf(difficulty.toUpperCase()));
                        plugin.getLogger().info("User '" + username + "' set difficulty to " + difficulty + " in " + worldName);
                    } catch (IllegalArgumentException e) {
                        plugin.getLogger().warning("Invalid difficulty: " + difficulty);
                    }
                }

                if (settings.containsKey("pvp")) {
                    boolean pvp = (Boolean) settings.get("pvp");
                    world.setPVP(pvp);
                    plugin.getLogger().info("User '" + username + "' set PVP to " + pvp + " in " + worldName);
                }

                if (settings.containsKey("spawnAnimals")) {
                    boolean spawnAnimals = (Boolean) settings.get("spawnAnimals");
                    world.setSpawnFlags(spawnAnimals, world.getAllowMonsters());
                    plugin.getLogger().info("User '" + username + "' set spawn animals to " + spawnAnimals + " in " + worldName);
                }

                if (settings.containsKey("spawnMonsters")) {
                    boolean spawnMonsters = (Boolean) settings.get("spawnMonsters");
                    world.setSpawnFlags(world.getAllowAnimals(), spawnMonsters);
                    plugin.getLogger().info("User '" + username + "' set spawn monsters to " + spawnMonsters + " in " + worldName);
                }
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "World settings updated",
                    "world", worldName
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error updating world settings: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to update world settings"
            ));
        }
    }

    /**
     * Helper method to get world information
     */
    private Map<String, Object> getWorldInfo(World world) {
        Map<String, Object> info = new HashMap<>();

        info.put("name", world.getName());
        info.put("seed", world.getSeed());
        info.put("environment", world.getEnvironment().name());
        info.put("difficulty", world.getDifficulty().name());
        info.put("time", world.getTime());
        info.put("fullTime", world.getFullTime());
        info.put("storm", world.hasStorm());
        info.put("thundering", world.isThundering());
        info.put("loadedChunks", world.getLoadedChunks().length);
        info.put("entities", world.getEntities().size());
        info.put("players", world.getPlayers().size());
        info.put("pvp", world.getPVP());
        info.put("spawnLocation", Map.of(
                "x", world.getSpawnLocation().getBlockX(),
                "y", world.getSpawnLocation().getBlockY(),
                "z", world.getSpawnLocation().getBlockZ()
        ));

        // Game rules
        Map<String, String> gameRules = new HashMap<>();
        for (String rule : world.getGameRules()) {
            gameRules.put(rule, world.getGameRuleValue(rule));
        }
        info.put("gameRules", gameRules);

        return info;
    }
}
