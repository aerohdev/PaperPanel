package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class WorldAPI {
    private final ServerAdminPanelPlugin plugin;

    public WorldAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
    }

    public void getWorlds(Context ctx) {
        try {
            // Führe synchron im Hauptthread aus und warte auf Ergebnis
            List<Map<String, Object>> worlds = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                return plugin.getServer().getWorlds().stream()
                    .map(this::getWorldInfo)
                    .collect(Collectors.toList());
            }).get();
            
            ctx.json(Map.of("success", true, "worlds", worlds));
        } catch (InterruptedException | ExecutionException e) {
            plugin.getLogger().severe("Error getting worlds: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                "success", false, 
                "message", "Failed to retrieve worlds",
                "error", e.getMessage()
            ));
        }
    }

    public void getWorld(Context ctx) {
        String worldName = ctx.pathParam("name");
        
        try {
            Map<String, Object> worldInfo = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                World world = plugin.getServer().getWorld(worldName);
                if (world == null) {
                    return null;
                }
                return getWorldInfo(world);
            }).get();
            
            if (worldInfo == null) {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "message", "World not found"
                ));
                return;
            }
            
            ctx.json(Map.of("success", true, "world", worldInfo));
        } catch (InterruptedException | ExecutionException e) {
            plugin.getLogger().severe("Error getting world: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Failed to retrieve world"
            ));
        }
    }

    public void updateWorldSettings(Context ctx) {
        String worldName = ctx.pathParam("name");
        @SuppressWarnings("unchecked")
        Map<String, Object> settings = ctx.bodyAsClass(Map.class);
        
        try {
            Boolean success = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                World world = plugin.getServer().getWorld(worldName);
                if (world == null) {
                    return false;
                }
                
                applyWorldSettings(world, settings);
                return true;
            }).get();
            
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
        } catch (InterruptedException | ExecutionException e) {
            plugin.getLogger().severe("Error updating world settings: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Failed to update world settings"
            ));
        }
    }

    private Map<String, Object> getWorldInfo(World world) {
        Map<String, Object> info = new HashMap<>();
        info.put("name", world.getName());
        info.put("environment", world.getEnvironment().toString());
        info.put("difficulty", world.getDifficulty().toString());
        
        Location spawn = world.getSpawnLocation();
        Map<String, Integer> spawnLoc = new HashMap<>();
        spawnLoc.put("x", spawn.getBlockX());
        spawnLoc.put("y", spawn.getBlockY());
        spawnLoc.put("z", spawn.getBlockZ());
        info.put("spawnLocation", spawnLoc);
        
        info.put("time", world.getTime());
        info.put("weatherDuration", world.getWeatherDuration());
        info.put("thundering", world.isThundering());
        info.put("storm", world.hasStorm());
        info.put("players", world.getPlayers().size());
        info.put("loadedChunks", world.getLoadedChunks().length);
        info.put("entities", world.getEntities().size());
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
}
