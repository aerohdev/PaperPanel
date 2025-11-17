package de.kaicraft.adminpanel.stats;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.database.DatabaseManager;

import java.sql.*;
import java.util.*;

/**
 * Manages player statistics and database operations
 */
public class PlayerStatsManager {
    private final ServerAdminPanelPlugin plugin;
    private final DatabaseManager database;

    public PlayerStatsManager(ServerAdminPanelPlugin plugin, DatabaseManager database) {
        this.plugin = plugin;
        this.database = database;
    }

    /**
     * Update player's last seen time
     */
    public void updatePlayer(UUID uuid, String name) {
        try {
            long now = System.currentTimeMillis();
            String query = """
                INSERT INTO players (uuid, name, first_join, last_seen)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(uuid) DO UPDATE SET
                    name = excluded.name,
                    last_seen = excluded.last_seen
            """;

            database.executeUpdate(query, uuid.toString(), name, now, now);
        } catch (SQLException e) {
            plugin.getLogger().warning("Failed to update player: " + e.getMessage());
        }
    }

    /**
     * Increment a player stat
     */
    public void incrementStat(UUID uuid, String statType, int amount) {
        try {
            long now = System.currentTimeMillis();
            String query = """
                INSERT INTO player_stats (uuid, stat_type, stat_value, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(uuid, stat_type) DO UPDATE SET
                    stat_value = stat_value + excluded.stat_value,
                    updated_at = excluded.updated_at
            """;

            database.executeUpdate(query, uuid.toString(), statType, amount, now);
        } catch (SQLException e) {
            plugin.getLogger().warning("Failed to increment stat: " + e.getMessage());
        }
    }

    /**
     * Get player statistics
     */
    public Map<String, Object> getPlayerStats(UUID uuid) {
        Map<String, Object> stats = new HashMap<>();

        try {
            // Get player info
            String playerQuery = "SELECT * FROM players WHERE uuid = ?";
            try (ResultSet rs = database.executeQuery(playerQuery, uuid.toString())) {
                if (rs.next()) {
                    stats.put("uuid", rs.getString("uuid"));
                    stats.put("name", rs.getString("name"));
                    stats.put("firstJoin", rs.getLong("first_join"));
                    stats.put("lastSeen", rs.getLong("last_seen"));
                    stats.put("totalPlaytime", rs.getLong("total_playtime"));
                }
            }

            // Get player stats
            String statsQuery = "SELECT stat_type, stat_value FROM player_stats WHERE uuid = ?";
            Map<String, Integer> playerStats = new HashMap<>();
            try (ResultSet rs = database.executeQuery(statsQuery, uuid.toString())) {
                while (rs.next()) {
                    playerStats.put(rs.getString("stat_type"), rs.getInt("stat_value"));
                }
            }
            stats.put("stats", playerStats);

        } catch (SQLException e) {
            plugin.getLogger().warning("Failed to get player stats: " + e.getMessage());
        }

        return stats;
    }

    /**
     * Get all players
     */
    public List<Map<String, Object>> getAllPlayers() {
        List<Map<String, Object>> players = new ArrayList<>();

        try {
            String query = "SELECT * FROM players ORDER BY last_seen DESC";
            try (ResultSet rs = database.executeQuery(query)) {
                while (rs.next()) {
                    Map<String, Object> player = new HashMap<>();
                    player.put("uuid", rs.getString("uuid"));
                    player.put("name", rs.getString("name"));
                    player.put("firstJoin", rs.getLong("first_join"));
                    player.put("lastSeen", rs.getLong("last_seen"));
                    player.put("totalPlaytime", rs.getLong("total_playtime"));
                    players.add(player);
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Failed to get all players: " + e.getMessage());
        }

        return players;
    }

    /**
     * Update player's total playtime
     */
    public void updatePlaytime(UUID uuid, long additionalTime) {
        try {
            String query = "UPDATE players SET total_playtime = total_playtime + ? WHERE uuid = ?";
            database.executeUpdate(query, additionalTime, uuid.toString());
        } catch (SQLException e) {
            plugin.getLogger().warning("Failed to update playtime: " + e.getMessage());
        }
    }
}
