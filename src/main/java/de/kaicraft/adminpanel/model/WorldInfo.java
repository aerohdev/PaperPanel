package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;
import java.util.Map;

/**
 * World information response model
 */
@TypeScriptType
public class WorldInfo {
    private String name;
    private String environment;
    private int playerCount;
    private int loadedChunks;
    private long seed;
    private long time;
    private boolean pvp;
    private String difficulty;
    private boolean allowAnimals;
    private boolean allowMonsters;
    private SpawnLocation spawnLocation;
    private Map<String, Object> gameRules;
    
    public static class SpawnLocation {
        private int x;
        private int y;
        private int z;
        
        public SpawnLocation(int x, int y, int z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        
        // Getters
        public int getX() { return x; }
        public int getY() { return y; }
        public int getZ() { return z; }
    }
    
    public WorldInfo(String name, String environment, int playerCount, int loadedChunks,
                    long seed, long time, boolean pvp, String difficulty, boolean allowAnimals,
                    boolean allowMonsters, SpawnLocation spawnLocation, Map<String, Object> gameRules) {
        this.name = name;
        this.environment = environment;
        this.playerCount = playerCount;
        this.loadedChunks = loadedChunks;
        this.seed = seed;
        this.time = time;
        this.pvp = pvp;
        this.difficulty = difficulty;
        this.allowAnimals = allowAnimals;
        this.allowMonsters = allowMonsters;
        this.spawnLocation = spawnLocation;
        this.gameRules = gameRules;
    }
    
    // Getters
    public String getName() { return name; }
    public String getEnvironment() { return environment; }
    public int getPlayerCount() { return playerCount; }
    public int getLoadedChunks() { return loadedChunks; }
    public long getSeed() { return seed; }
    public long getTime() { return time; }
    public boolean isPvp() { return pvp; }
    public String getDifficulty() { return difficulty; }
    public boolean isAllowAnimals() { return allowAnimals; }
    public boolean isAllowMonsters() { return allowMonsters; }
    public SpawnLocation getSpawnLocation() { return spawnLocation; }
    public Map<String, Object> getGameRules() { return gameRules; }
}
