package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

import java.util.Map;

/**
 * Dashboard statistics response model
 */
@TypeScriptType
public class DashboardStats {
    private double tps;
    private int onlinePlayers;
    private int maxPlayers;
    private MemoryInfo memory;
    private long uptime;
    private String uptimeFormatted;
    private String version;
    private String bukkitVersion;
    private int worlds;
    private int loadedChunks;
    private int plugins;

    public static class MemoryInfo {
        private long used;
        private long max;
        private long usedMB;
        private long maxMB;
        private int percentage;

        public MemoryInfo(long used, long max, long usedMB, long maxMB, int percentage) {
            this.used = used;
            this.max = max;
            this.usedMB = usedMB;
            this.maxMB = maxMB;
            this.percentage = percentage;
        }

        // Getters
        public long getUsed() { return used; }
        public long getMax() { return max; }
        public long getUsedMB() { return usedMB; }
        public long getMaxMB() { return maxMB; }
        public int getPercentage() { return percentage; }
    }

    // Constructor
    public DashboardStats(double tps, int onlinePlayers, int maxPlayers, MemoryInfo memory,
                         long uptime, String uptimeFormatted, String version, String bukkitVersion,
                         int worlds, int loadedChunks, int plugins) {
        this.tps = tps;
        this.onlinePlayers = onlinePlayers;
        this.maxPlayers = maxPlayers;
        this.memory = memory;
        this.uptime = uptime;
        this.uptimeFormatted = uptimeFormatted;
        this.version = version;
        this.bukkitVersion = bukkitVersion;
        this.worlds = worlds;
        this.loadedChunks = loadedChunks;
        this.plugins = plugins;
    }

    // Getters
    public double getTps() { return tps; }
    public int getOnlinePlayers() { return onlinePlayers; }
    public int getMaxPlayers() { return maxPlayers; }
    public MemoryInfo getMemory() { return memory; }
    public long getUptime() { return uptime; }
    public String getUptimeFormatted() { return uptimeFormatted; }
    public String getVersion() { return version; }
    public String getBukkitVersion() { return bukkitVersion; }
    public int getWorlds() { return worlds; }
    public int getLoadedChunks() { return loadedChunks; }
    public int getPlugins() { return plugins; }
}
