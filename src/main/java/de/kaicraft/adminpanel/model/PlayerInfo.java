package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Player information response model
 */
@TypeScriptType
public class PlayerInfo {
    private String name;
    private String uuid;
    private int ping;
    private String gameMode;
    private String world;
    private LocationInfo location;
    private int level;
    private float health;
    private float maxHealth;
    private int foodLevel;
    
    public static class LocationInfo {
        private double x;
        private double y;
        private double z;
        private float yaw;
        private float pitch;
        
        public LocationInfo(double x, double y, double z, float yaw, float pitch) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.yaw = yaw;
            this.pitch = pitch;
        }
        
        // Getters
        public double getX() { return x; }
        public double getY() { return y; }
        public double getZ() { return z; }
        public float getYaw() { return yaw; }
        public float getPitch() { return pitch; }
    }
    
    public PlayerInfo(String name, String uuid, int ping, String gameMode, String world,
                     LocationInfo location, int level, float health, float maxHealth, int foodLevel) {
        this.name = name;
        this.uuid = uuid;
        this.ping = ping;
        this.gameMode = gameMode;
        this.world = world;
        this.location = location;
        this.level = level;
        this.health = health;
        this.maxHealth = maxHealth;
        this.foodLevel = foodLevel;
    }
    
    // Getters
    public String getName() { return name; }
    public String getUuid() { return uuid; }
    public int getPing() { return ping; }
    public String getGameMode() { return gameMode; }
    public String getWorld() { return world; }
    public LocationInfo getLocation() { return location; }
    public int getLevel() { return level; }
    public float getHealth() { return health; }
    public float getMaxHealth() { return maxHealth; }
    public int getFoodLevel() { return foodLevel; }
}
