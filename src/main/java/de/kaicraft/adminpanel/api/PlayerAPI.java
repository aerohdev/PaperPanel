package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.stats.PlayerStatsManager;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.*;
import java.util.stream.Collectors;

/**
 * API endpoints for player management
 */
public class PlayerAPI {
    private final ServerAdminPanelPlugin plugin;
    private final PlayerStatsManager statsManager;

    /**
     * Request body for kick player endpoint
     */
    public static class KickRequest {
        public String reason;
    }

    /**
     * Request body for message player endpoint
     */
    public static class MessageRequest {
        public String message;
    }

    public PlayerAPI(ServerAdminPanelPlugin plugin, PlayerStatsManager statsManager) {
        this.plugin = plugin;
        this.statsManager = statsManager;
    }

    /**
     * GET /api/players
     * Get list of all players (online and offline)
     */
    public void getPlayers(Context ctx) {
        try {
            List<Map<String, Object>> allPlayers = statsManager.getAllPlayers();

            // Get online player UUIDs
            Set<String> onlineUUIDs = Bukkit.getOnlinePlayers().stream()
                    .map(p -> p.getUniqueId().toString())
                    .collect(Collectors.toSet());

            // Enrich with online status
            allPlayers.forEach(player -> {
                player.put("online", onlineUUIDs.contains(player.get("uuid")));
            });

            // Add current online players not yet in database
            for (Player player : Bukkit.getOnlinePlayers()) {
                String uuid = player.getUniqueId().toString();
                if (!allPlayers.stream().anyMatch(p -> p.get("uuid").equals(uuid))) {
                    Map<String, Object> playerData = new HashMap<>();
                    playerData.put("uuid", uuid);
                    playerData.put("name", player.getName());
                    playerData.put("online", true);
                    playerData.put("firstJoin", System.currentTimeMillis());
                    playerData.put("lastSeen", System.currentTimeMillis());
                    playerData.put("totalPlaytime", 0L);
                    allPlayers.add(playerData);
                }
            }

            ctx.status(200).json(Map.of(
                    "success", true,
                    "players", allPlayers
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting players: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve players"
            ));
        }
    }

    /**
     * GET /api/players/{uuid}
     * Get specific player details
     */
    public void getPlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            Map<String, Object> playerData = statsManager.getPlayerStats(uuid);

            if (playerData.isEmpty()) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "Player not found"
                ));
                return;
            }

            // Check if player is online
            Player player = Bukkit.getPlayer(uuid);
            playerData.put("online", player != null);

            if (player != null) {
                playerData.put("health", player.getHealth());
                playerData.put("foodLevel", player.getFoodLevel());
                playerData.put("level", player.getLevel());
                playerData.put("gameMode", player.getGameMode().name());
                playerData.put("world", player.getWorld().getName());
                playerData.put("location", Map.of(
                        "x", player.getLocation().getBlockX(),
                        "y", player.getLocation().getBlockY(),
                        "z", player.getLocation().getBlockZ()
                ));
            }

            ctx.status(200).json(Map.of(
                    "success", true,
                    "player", playerData
            ));
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(Map.of(
                    "success", false,
                    "error", "Bad Request",
                    "message", "Invalid UUID format"
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting player: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve player data"
            ));
        }
    }

    /**
     * POST /api/players/{uuid}/kick
     * Kick a player from the server
     */
    public void kickPlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            Player player = Bukkit.getPlayer(uuid);

            if (player == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "Player is not online"
                ));
                return;
            }

            KickRequest body = ctx.bodyAsClass(KickRequest.class);
            String reason = (body.reason != null && !body.reason.isEmpty())
                    ? body.reason
                    : "Kicked by administrator";

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' kicked player: " + player.getName());

            // Kick player on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                player.kick(net.kyori.adventure.text.Component.text(reason));
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Player kicked successfully",
                    "player", player.getName()
            ));
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(Map.of(
                    "success", false,
                    "error", "Bad Request",
                    "message", "Invalid UUID format"
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error kicking player: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to kick player"
            ));
        }
    }

    /**
     * POST /api/players/{uuid}/message
     * Send a message to a player
     */
    public void messagePlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            Player player = Bukkit.getPlayer(uuid);

            if (player == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "Player is not online"
                ));
                return;
            }

            MessageRequest body = ctx.bodyAsClass(MessageRequest.class);
            String message = body.message;

            if (message == null || message.isEmpty()) {
                ctx.status(400).json(Map.of(
                        "success", false,
                        "error", "Bad Request",
                        "message", "Message is required"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' sent message to " + player.getName());

            // Send message on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                player.sendMessage("§e[Admin] §f" + message);
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Message sent successfully"
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error sending message: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to send message"
            ));
        }
    }
}
