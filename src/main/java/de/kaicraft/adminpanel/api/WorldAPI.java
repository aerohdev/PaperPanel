package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
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

    @TypeScriptEndpoint(path = "GET /api/v1/worlds", responseType = "{ worlds: WorldInfo[] }")
    public void getWorlds(Context ctx) {
        try {
            // Führe synchron im Hauptthread aus und warte auf Ergebnis
            List<Map<String, Object>> worlds = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                return plugin.getServer().getWorlds().stream()
                    .map(this::getWorldInfo)
                    .collect(Collectors.toList());
            }).get();
            
            ctx.json(ApiResponse.success("worlds", worlds));
        } catch (InterruptedException | ExecutionException e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/worlds", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve worlds"));
        }
    }

    @TypeScriptEndpoint(path = "GET /api/v1/worlds/{name}", responseType = "{ world: WorldInfo }")
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
                ctx.status(404).json(ApiResponse.error("World not found"));
                return;
            }
            
            ctx.json(ApiResponse.success("world", worldInfo));
        } catch (InterruptedException | ExecutionException e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/worlds/{name}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve world"));
        }
    }

    /**
     * Update world settings
     */
    @TypeScriptEndpoint(path = "PUT /api/v1/worlds/{name}/settings", responseType = "{ message: string }")
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
                ctx.status(404).json(ApiResponse.error("World not found"));
                return;
            }
            
            // Log the changes
            String currentUser = (String) ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(currentUser, "update-world-settings", worldName + " - " + settings.keySet());
            
            ctx.json(ApiResponse.successMessage("World settings updated successfully"));
        } catch (InterruptedException | ExecutionException e) {
            plugin.getAuditLogger().logApiError("PUT /api/v1/worlds/{name}/settings", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to update world settings"));
        }
    }

    /**
     * POST /api/worlds/{name}/time/{time}
     * Set world time (day, night, noon, midnight, or number)
     */
    @TypeScriptEndpoint(path = "POST /api/v1/worlds/{name}/time/{time}", responseType = "{ message: string }")
    public void setWorldTime(Context ctx) {
        String worldName = ctx.pathParam("name");
        String timeParam = ctx.pathParam("time");
        
        try {
            Boolean success = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                World world = plugin.getServer().getWorld(worldName);
                if (world == null) return false;
                
                long time;
                switch (timeParam.toLowerCase()) {
                    case "day" -> time = 1000;
                    case "noon" -> time = 6000;
                    case "night" -> time = 13000;
                    case "midnight" -> time = 18000;
                    default -> {
                        try {
                            time = Long.parseLong(timeParam);
                        } catch (NumberFormatException e) {
                            return false;
                        }
                    }
                }
                
                world.setTime(time);
                return true;
            }).get();
            
            if (!success) {
                ctx.status(404).json(ApiResponse.error("World not found or invalid time"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "set-world-time", worldName + " - " + timeParam);
            
            ctx.json(ApiResponse.successMessage("World time updated"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/worlds/{name}/time/{time}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to set world time"));
        }
    }

    /**
     * POST /api/worlds/{name}/weather/{type}
     * Set world weather (clear, rain, thunder)
     */
    @TypeScriptEndpoint(path = "POST /api/v1/worlds/{name}/weather/{type}", responseType = "{ message: string }")
    public void setWorldWeather(Context ctx) {
        String worldName = ctx.pathParam("name");
        String weatherType = ctx.pathParam("type");
        
        try {
            Boolean success = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                World world = plugin.getServer().getWorld(worldName);
                if (world == null) return false;
                
                switch (weatherType.toLowerCase()) {
                    case "clear" -> {
                        world.setStorm(false);
                        world.setThundering(false);
                    }
                    case "rain" -> {
                        world.setStorm(true);
                        world.setThundering(false);
                    }
                    case "thunder" -> {
                        world.setStorm(true);
                        world.setThundering(true);
                    }
                    default -> {
                        return false;
                    }
                }
                
                return true;
            }).get();
            
            if (!success) {
                ctx.status(404).json(ApiResponse.error("World not found or invalid weather type"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "set-world-weather", worldName + " - " + weatherType);
            
            ctx.json(ApiResponse.successMessage("World weather updated"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/worlds/{name}/weather/{type}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to set world weather"));
        }
    }

    /**
     * POST /api/worlds/{name}/difficulty/{difficulty}
     * Set world difficulty (peaceful, easy, normal, hard)
     */
    @TypeScriptEndpoint(path = "POST /api/v1/worlds/{name}/difficulty/{difficulty}", responseType = "{ message: string }")
    public void setWorldDifficulty(Context ctx) {
        String worldName = ctx.pathParam("name");
        String difficultyParam = ctx.pathParam("difficulty");
        
        try {
            Boolean success = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                World world = plugin.getServer().getWorld(worldName);
                if (world == null) return false;
                
                try {
                    org.bukkit.Difficulty difficulty = org.bukkit.Difficulty.valueOf(difficultyParam.toUpperCase());
                    world.setDifficulty(difficulty);
                    return true;
                } catch (IllegalArgumentException e) {
                    return false;
                }
            }).get();
            
            if (!success) {
                ctx.status(404).json(ApiResponse.error("World not found or invalid difficulty"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "set-world-difficulty", worldName + " - " + difficultyParam);
            
            ctx.json(ApiResponse.successMessage("World difficulty updated"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/worlds/{name}/difficulty/{difficulty}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to set world difficulty"));
        }
    }

    /**
     * POST /api/worlds/{name}/save
     * Save world
     */
    @TypeScriptEndpoint(path = "POST /api/v1/worlds/{name}/save", responseType = "{ message: string }")
    public void saveWorld(Context ctx) {
        String worldName = ctx.pathParam("name");
        
        try {
            Boolean success = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                World world = plugin.getServer().getWorld(worldName);
                if (world == null) return false;
                
                world.save();
                return true;
            }).get();
            
            if (!success) {
                ctx.status(404).json(ApiResponse.error("World not found"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "save-world", worldName);
            
            ctx.json(ApiResponse.successMessage("World saved successfully"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/worlds/{name}/save", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to save world"));
        }
    }

    /**
     * POST /api/worlds/{name}/gamerule
     * Set a game rule for a world
     */
    @TypeScriptEndpoint(path = "POST /api/v1/worlds/{name}/gamerule", responseType = "{ message: string }")
    public void setGameRule(Context ctx) {
        String worldName = ctx.pathParam("name");
        @SuppressWarnings("unchecked")
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        
        String ruleName = (String) body.get("rule");
        Object ruleValue = body.get("value");
        
        try {
            Boolean success = Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                World world = plugin.getServer().getWorld(worldName);
                if (world == null) return false;
                
                setGameRuleSafely(world, ruleName, ruleValue);
                return true;
            }).get();
            
            if (!success) {
                ctx.status(404).json(ApiResponse.error("World not found"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "set-gamerule", worldName + " - " + ruleName + "=" + ruleValue);
            
            ctx.json(ApiResponse.successMessage("Game rule updated"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/worlds/{name}/gamerule", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to set game rule"));
        }
    }

    /**
     * Update settings for all worlds (bulk operation)
     */
    @TypeScriptEndpoint(path = "PUT /api/v1/worlds/bulk/settings", responseType = "{ message: string, worldsUpdated: number }")
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
            plugin.getAuditLogger().logUserAction(currentUser, "update-all-worlds", updatedCount + " worlds - " + settings.keySet());
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Updated " + updatedCount + " world(s) successfully");
            data.put("worldsUpdated", updatedCount);
            ctx.json(ApiResponse.success(data));
        } catch (InterruptedException | ExecutionException e) {
            plugin.getAuditLogger().logApiError("PUT /api/v1/worlds/bulk/settings", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to update world settings"));
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
        @SuppressWarnings("deprecation")
        boolean keepSpawn = world.getKeepSpawnInMemory(); // Deprecated but still functional
        info.put("keepSpawnInMemory", keepSpawn);
        info.put("hardcore", world.isHardcore());
        info.put("allowAnimals", world.getAllowAnimals());
        info.put("allowMonsters", world.getAllowMonsters());
        
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

    @SuppressWarnings("deprecation")
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
        
        // PVP - Removed from UI as it cannot be changed at runtime in Paper
        // PVP setting is controlled by server.properties and requires a server restart
        if (settings.containsKey("pvp")) {
            plugin.getLogger().warning("PVP setting cannot be changed at runtime. This setting is controlled by server.properties and requires a server restart.");
        }
        
        // Allow Animals (deprecated - use world.setSpawnFlags instead)
        if (settings.containsKey("allowAnimals")) {
            boolean allowAnimals = (Boolean) settings.get("allowAnimals");
            boolean allowMonsters = settings.containsKey("allowMonsters") ? (Boolean) settings.get("allowMonsters") : world.getAllowMonsters();
            world.setSpawnFlags(allowMonsters, allowAnimals);
            plugin.getLogger().fine("Set allowAnimals to " + allowAnimals + " in world '" + world.getName() + "'");
        }
        
        // Allow Monsters (deprecated - use world.setSpawnFlags instead)
        if (settings.containsKey("allowMonsters")) {
            boolean allowMonsters = (Boolean) settings.get("allowMonsters");
            boolean allowAnimals = settings.containsKey("allowAnimals") ? (Boolean) settings.get("allowAnimals") : world.getAllowAnimals();
            world.setSpawnFlags(allowMonsters, allowAnimals);
            plugin.getLogger().fine("Set allowMonsters to " + allowMonsters + " in world '" + world.getName() + "'");
        }
        
        // Hardcore
        if (settings.containsKey("hardcore")) {
            boolean hardcore = (Boolean) settings.get("hardcore");
            world.setHardcore(hardcore);
            plugin.getLogger().fine("Set hardcore to " + hardcore + " in world '" + world.getName() + "'");
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
                    setGameRuleSafely(world, ruleName, ruleValue);
                } catch (Exception e) {
                    plugin.getLogger().warning("Failed to set game rule " + ruleName + ": " + e.getMessage());
                }
            }
        }
    }
    
    /**
     * Safely set a game rule with proper type handling
     */
    @SuppressWarnings("unchecked")
    private <T> void setGameRuleSafely(World world, String ruleName, Object value) {
        org.bukkit.GameRule<T> gameRule = (org.bukkit.GameRule<T>) org.bukkit.GameRule.getByName(ruleName);
        if (gameRule == null) {
            plugin.getLogger().warning("Unknown game rule: " + ruleName);
            return;
        }
        
        try {
            // Try to cast the value to the correct type
            T typedValue = (T) value;
            world.setGameRule(gameRule, typedValue);
            plugin.getLogger().fine("Set game rule " + ruleName + " to " + value + 
                                  " in world '" + world.getName() + "'");
        } catch (ClassCastException e) {
            // If direct cast fails, try to convert
            if (value instanceof Boolean && gameRule.getType() == Boolean.class) {
                world.setGameRule((org.bukkit.GameRule<Boolean>) gameRule, (Boolean) value);
            } else if (value instanceof Number && gameRule.getType() == Integer.class) {
                world.setGameRule((org.bukkit.GameRule<Integer>) gameRule, ((Number) value).intValue());
            } else {
                plugin.getLogger().warning("Type mismatch for game rule " + ruleName + 
                                         ": expected " + gameRule.getType().getSimpleName() + 
                                         " but got " + value.getClass().getSimpleName());
            }
        }
    }
}
