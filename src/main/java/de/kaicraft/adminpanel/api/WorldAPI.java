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

    /**
     * Update world settings
     */
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
            
            // Log the changes
            String currentUser = (String) ctx.attribute("username");
            plugin.getLogger().info("User '" + currentUser + "' updated settings for world '" + worldName + "': " + 
                                   settings.keySet());
            
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

    /**
     * Update settings for all worlds (bulk operation)
     */
    public void updateAllWorldSettings(Context ctx) {
        @SuppressWarnings("unchecked")
        Map<String, Object> settings = ctx.bodyAsClass(Map.class);
        
        try {
            Integer updatedCount = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                int count = 0;
                for (World world : plugin.getServer().getWorlds()) {
                    applyWorldSettings(world, settings);
                    count++;
                }
                return count;
            }).get();
            
            // Log the bulk changes
            String currentUser = (String) ctx.attribute("username");
            plugin.getLogger().info("User '" + currentUser + "' updated settings for all " + updatedCount + 
                                   " world(s): " + settings.keySet());
            
            ctx.json(Map.of(
                "success", true,
                "message", "Updated " + updatedCount + " world(s) successfully",
                "worldsUpdated", updatedCount
            ));
        } catch (InterruptedException | ExecutionException e) {
            plugin.getLogger().severe("Error updating all worlds settings: " + e.getMessage());
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
        info.put("keepSpawnInMemory", world.getKeepSpawnInMemory());
        
        // Add common game rules
        Map<String, Object> gameRules = new HashMap<>();
        addGameRule(gameRules, world, "doDaylightCycle");
        addGameRule(gameRules, world, "doWeatherCycle");
        addGameRule(gameRules, world, "keepInventory");
        addGameRule(gameRules, world, "mobGriefing");
        addGameRule(gameRules, world, "doMobSpawning");
        addGameRule(gameRules, world, "naturalRegeneration");
        addGameRule(gameRules, world, "showDeathMessages");
        addGameRule(gameRules, world, "announceAdvancements");
        addGameRule(gameRules, world, "doFireTick");
        addGameRule(gameRules, world, "doImmediateRespawn");
        info.put("gameRules", gameRules);
        
        return info;
    }
    
    private void addGameRule(Map<String, Object> map, World world, String ruleName) {
        try {
            org.bukkit.GameRule<?> rule = org.bukkit.GameRule.getByName(ruleName);
            if (rule != null) {
                Object value = world.getGameRuleValue(rule);
                map.put(ruleName, value);
            }
        } catch (Exception e) {
            // Ignore if game rule doesn't exist
        }
    }

    private void applyWorldSettings(World world, Map<String, Object> settings) {
        // Time
        if (settings.containsKey("time")) {
            long time = ((Number) settings.get("time")).longValue();
            world.setTime(time);
            plugin.getLogger().fine("Set time to " + time + " in world '" + world.getName() + "'");
        }
        
        // Weather
        if (settings.containsKey("weather")) {
            String weather = (String) settings.get("weather");
            if ("clear".equalsIgnoreCase(weather)) {
                world.setStorm(false);
                world.setThundering(false);
                plugin.getLogger().fine("Cleared weather in world '" + world.getName() + "'");
            } else if ("rain".equalsIgnoreCase(weather)) {
                world.setStorm(true);
                world.setThundering(false);
                plugin.getLogger().fine("Set rain in world '" + world.getName() + "'");
            } else if ("thunder".equalsIgnoreCase(weather)) {
                world.setStorm(true);
                world.setThundering(true);
                plugin.getLogger().fine("Set thunder in world '" + world.getName() + "'");
            }
        }
        
        // Difficulty
        if (settings.containsKey("difficulty")) {
            String difficultyStr = (String) settings.get("difficulty");
            try {
                org.bukkit.Difficulty difficulty = org.bukkit.Difficulty.valueOf(difficultyStr.toUpperCase());
                world.setDifficulty(difficulty);
                plugin.getLogger().fine("Set difficulty to " + difficulty + " in world '" + world.getName() + "'");
            } catch (IllegalArgumentException e) {
                plugin.getLogger().warning("Invalid difficulty: " + difficultyStr);
            }
        }
        
        // PVP
        if (settings.containsKey("pvp")) {
            boolean pvp = (Boolean) settings.get("pvp");
            world.setPVP(pvp);
            plugin.getLogger().fine("Set PVP to " + pvp + " in world '" + world.getName() + "'");
        }
        
        // Spawn Location
        if (settings.containsKey("spawnLocation")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> spawnData = (Map<String, Object>) settings.get("spawnLocation");
            int x = ((Number) spawnData.get("x")).intValue();
            int y = ((Number) spawnData.get("y")).intValue();
            int z = ((Number) spawnData.get("z")).intValue();
            
            Location newSpawn = new Location(world, x, y, z);
            world.setSpawnLocation(newSpawn);
            plugin.getLogger().fine("Set spawn to " + x + "," + y + "," + z + " in world '" + world.getName() + "'");
        }
        
        // Keep Spawn in Memory
        if (settings.containsKey("keepSpawnInMemory")) {
            boolean keepSpawn = (Boolean) settings.get("keepSpawnInMemory");
            world.setKeepSpawnInMemory(keepSpawn);
            plugin.getLogger().fine("Set keepSpawnInMemory to " + keepSpawn + " in world '" + world.getName() + "'");
        }
        
        // Game Rules
        if (settings.containsKey("gameRules")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> gameRules = (Map<String, Object>) settings.get("gameRules");
            for (Map.Entry<String, Object> rule : gameRules.entrySet()) {
                String ruleName = rule.getKey();
                Object ruleValue = rule.getValue();
                
                try {
                    if (ruleValue instanceof Boolean) {
                        world.setGameRule(org.bukkit.GameRule.getByName(ruleName), ruleValue);
                    } else if (ruleValue instanceof Number) {
                        world.setGameRule(org.bukkit.GameRule.getByName(ruleName), ((Number) ruleValue).intValue());
                    } else {
                        world.setGameRule(org.bukkit.GameRule.getByName(ruleName), ruleValue.toString());
                    }
                    plugin.getLogger().fine("Set game rule " + ruleName + " to " + ruleValue + 
                                          " in world '" + world.getName() + "'");
                } catch (Exception e) {
                    plugin.getLogger().warning("Failed to set game rule " + ruleName + ": " + e.getMessage());
                }
            }
        }
    }
}
