package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

public class WorldAPI {
    private final ServerAdminPanelPlugin plugin;

    public WorldAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
    }

    public void getWorlds(Context ctx) {
        CompletableFuture.supplyAsync(() -> {
            try {
                return Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                    return plugin.getServer().getWorlds().stream()
                        .map(this::getWorldInfo)
                        .collect(Collectors.toList());
                }).get();
            } catch (Exception e) {
                plugin.getLogger().severe("Error getting worlds: " + e.getMessage());
                e.printStackTrace();
                return Collections.emptyList();
            }
        }).thenAccept(worlds -> {
            ctx.json(Map.of("success", true, "worlds", worlds));
        }).exceptionally(ex -> {
            plugin.getLogger().severe("Exception in getWorlds: " + ex.getMessage());
            ctx.status(500).json(Map.of("success", false, "message", "Internal server error"));
            return null;
        });
    }

    public void getWorld(Context ctx) {
        String worldName = ctx.pathParam("name");
        
        CompletableFuture.supplyAsync(() -> {
            try {
                return Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                    World world = plugin.getServer().getWorld(worldName);
                    if (world == null) {
                        return null;
                    }
                    return getWorldInfo(world);
                }).get();
            } catch (Exception e) {
                plugin.getLogger().severe("Error getting world: " + e.getMessage());
                e.printStackTrace();
                return null;
            }
        }).thenAccept(worldInfo -> {
            if (worldInfo == null) {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "message", "World not found"
                ));
                return;
            }
            ctx.json(Map.of("success", true, "world", worldInfo));
        }).exceptionally(ex -> {
            plugin.getLogger().severe("Exception in getWorld: " + ex.getMessage());
            ctx.status(500).json(Map.of("success", false, "message", "Internal server error"));
            return null;
        });
    }

    public void updateWorldSettings(Context ctx) {
        String worldName = ctx.pathParam("name");
        @SuppressWarnings("unchecked")
        Map<String, Object> settings = ctx.bodyAsClass(Map.class);
        
        CompletableFuture.supplyAsync(() -> {
            try {
                return Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                    World world = plugin.getServer().getWorld(worldName);
                    if (world == null) {
                        return false;
                    }
                    
                    applyWorldSettings(world, settings);
                    return true;
                }).get();
            } catch (Exception e) {
                plugin.getLogger().severe("Error updating world settings: " + e.getMessage());
                e.printStackTrace();
                return false;
            }
        }).thenAccept(success -> {
            if (!success) {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "message", "World not found"
                ));
                return;
            }
            ctx.json(Map.of(
                "success", true,
                "message", "World settings updated successfully"
            ));
        }).exceptionally(ex -> {
            plugin.getLogger().severe("Exception in updateWorldSettings: " + ex.getMessage());
            ctx.status(500).json(Map.of("success", false, "message", "Internal server error"));
            return null;
        });
    }

    private Map<String, Object> getWorldInfo(World world) {
        Map<String, Object> info = new HashMap<>();
        info.put("name", world.getName());
        info.put("environment", world.getEnvironment().toString());
        info.put("difficulty", world.getDifficulty().toString());
        info.put("spawnLocation", formatLocation(world.getSpawnLocation()));
        info.put("time", world.getTime());
        info.put("weatherDuration", world.getWeatherDuration());
        info.put("isThundering", world.isThundering());
        info.put("playerCount", world.getPlayers().size());
        info.put("chunkCount", world.getLoadedChunks().length);
        info.put("entityCount", world.getEntities().size());
        info.put("seed", world.getSeed());
        info.put("pvp", world.getPVP());
        info.put("autoSave", world.isAutoSave());
        return info;
    }

    private void applyWorldSettings(World world, Map<String, Object> settings) {
        if (settings.containsKey("time")) {
            world.setTime(((Number) settings.get("time")).longValue());
        }
        if (settings.containsKey("weather")) {
            String weather = (String) settings.get("weather");
            if ("clear".equalsIgnoreCase(weather)) {
                world.setStorm(false);
                world.setThundering(false);
            } else if ("rain".equalsIgnoreCase(weather)) {
                world.setStorm(true);
                world.setThundering(false);
            } else if ("thunder".equalsIgnoreCase(weather)) {
                world.setStorm(true);
                world.setThundering(true);
            }
        }
        if (settings.containsKey("difficulty")) {
            world.setDifficulty(org.bukkit.Difficulty.valueOf((String) settings.get("difficulty")));
        }
        if (settings.containsKey("pvp")) {
            world.setPVP((Boolean) settings.get("pvp"));
        }
    }

    private String formatLocation(Location loc) {
        return String.format("%s: %.1f, %.1f, %.1f", 
            loc.getWorld().getName(), loc.getX(), loc.getY(), loc.getZ());
    }
}
