package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.stats.PlayerStatsManager;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
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

    /**
     * Request body for ban player endpoint
     */
    public static class BanRequest {
        public String reason;
        public Long expiresAt; // null for permanent ban
    }

    public PlayerAPI(ServerAdminPanelPlugin plugin, PlayerStatsManager statsManager) {
        this.plugin = plugin;
        this.statsManager = statsManager;
    }

    /**
     * GET /api/players
     * Get list of all players (online and offline)
     */
    @TypeScriptEndpoint(path = "GET /api/v1/players", responseType = "{ players: PlayerInfo[] }")
    public void getPlayers(Context ctx) {
        try {
            List<Map<String, Object>> allPlayers = statsManager.getAllPlayers();

            // Get online player UUIDs
            Set<String> onlineUUIDs = Bukkit.getOnlinePlayers().stream()
                    .map(p -> p.getUniqueId().toString())
                    .collect(Collectors.toSet());

            // Get ban list
            org.bukkit.BanList banList = Bukkit.getBanList(org.bukkit.BanList.Type.NAME);

            // Enrich with online status
            allPlayers.forEach(player -> {
                player.put("online", onlineUUIDs.contains(player.get("uuid")));
                // Check if player is banned
                String playerName = (String) player.get("name");
                player.put("banned", banList.isBanned(playerName));
            });

            // Add current online players not yet in database
            for (Player player : Bukkit.getOnlinePlayers()) {
                String uuid = player.getUniqueId().toString();
                if (!allPlayers.stream().anyMatch(p -> p.get("uuid").equals(uuid))) {
                    Map<String, Object> playerData = new HashMap<>();
                    playerData.put("uuid", uuid);
                    playerData.put("name", player.getName());
                    playerData.put("online", true);
                    playerData.put("banned", banList.isBanned(player.getName()));
                    playerData.put("firstJoin", System.currentTimeMillis());
                    playerData.put("lastSeen", System.currentTimeMillis());
                    playerData.put("totalPlaytime", 0L);
                    allPlayers.add(playerData);
                }
            }

            ctx.status(200).json(ApiResponse.success("players", allPlayers));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/players", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve players"));
        }
    }

    /**
     * GET /api/players/{uuid}
     * Get specific player details
     */
    @TypeScriptEndpoint(path = "GET /api/v1/players/{uuid}", responseType = "{ player: PlayerInfo }")
    public void getPlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            Map<String, Object> playerData = statsManager.getPlayerStats(uuid);

            if (playerData.isEmpty()) {
                ctx.status(404).json(ApiResponse.error("Player not found"));
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

            ctx.status(200).json(ApiResponse.success("player", playerData));
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(ApiResponse.error("Invalid UUID format"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/players/{uuid}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to retrieve player data"));
        }
    }

    /**
     * POST /api/players/{uuid}/kick
     * Kick a player from the server
     */
    @TypeScriptEndpoint(path = "POST /api/v1/players/{uuid}/kick", responseType = "{ message: string, player: string }")
    public void kickPlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            Player player = Bukkit.getPlayer(uuid);

            if (player == null) {
                ctx.status(404).json(ApiResponse.error("Player is not online"));
                return;
            }

            KickRequest body = ctx.bodyAsClass(KickRequest.class);
            String reason = (body.reason != null && !body.reason.isEmpty())
                    ? body.reason
                    : "Kicked by administrator";

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "kick-player", player.getName() + " - " + reason);

            // Kick player on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                player.kick(net.kyori.adventure.text.Component.text(reason));
            });

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Player kicked successfully");
            data.put("player", player.getName());
            ctx.status(200).json(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(ApiResponse.error("Invalid UUID format"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/players/{uuid}/kick", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to kick player"));
        }
    }

    /**
     * POST /api/players/{uuid}/message
     * Send a message to a player
     */
    @TypeScriptEndpoint(path = "POST /api/v1/players/{uuid}/message", responseType = "{ message: string }")
    public void messagePlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            Player player = Bukkit.getPlayer(uuid);

            if (player == null) {
                ctx.status(404).json(ApiResponse.error("Player is not online"));
                return;
            }

            MessageRequest body = ctx.bodyAsClass(MessageRequest.class);
            String message = body.message;

            if (message == null || message.isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Message is required"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "message-player", player.getName() + " - " + message);

            // Send message on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                player.sendMessage("§e[Admin] §f" + message);
            });

            ctx.status(200).json(ApiResponse.successMessage("Message sent successfully"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/players/{uuid}/message", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to send message"));
        }
    }

    /**
     * POST /api/players/{uuid}/ban
     * Ban a player from the server
     */
    @TypeScriptEndpoint(path = "POST /api/v1/players/{uuid}/ban", responseType = "{ message: string, player: string }")
    public void banPlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            Player player = Bukkit.getPlayer(uuid);
            String playerName = player != null ? player.getName() : Bukkit.getOfflinePlayer(uuid).getName();

            if (playerName == null) {
                ctx.status(404).json(ApiResponse.error("Player not found"));
                return;
            }

            BanRequest body = ctx.bodyAsClass(BanRequest.class);
            String reason = (body.reason != null && !body.reason.isEmpty())
                    ? body.reason
                    : "Banned by administrator";

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "ban-player", playerName + " - " + reason);

            // Ban player on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                org.bukkit.BanList banList = Bukkit.getBanList(org.bukkit.BanList.Type.NAME);
                java.util.Date expiresDate = body.expiresAt != null ? new java.util.Date(body.expiresAt) : null;
                banList.addBan(playerName, reason, expiresDate, username);

                // Kick if online
                if (player != null && player.isOnline()) {
                    player.kick(net.kyori.adventure.text.Component.text("§cBanned: " + reason));
                }
            });

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Player banned successfully");
            data.put("player", playerName);
            ctx.status(200).json(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(ApiResponse.error("Invalid UUID format"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/players/{uuid}/ban", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to ban player"));
        }
    }

    /**
     * DELETE /api/players/{uuid}/ban
     * Unban a player
     */
    @TypeScriptEndpoint(path = "DELETE /api/v1/players/{uuid}/ban", responseType = "{ message: string, player: string }")
    public void unbanPlayer(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);

            String playerName = Bukkit.getOfflinePlayer(uuid).getName();

            if (playerName == null) {
                ctx.status(404).json(ApiResponse.error("Player not found"));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "unban-player", playerName);

            // Unban player on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                org.bukkit.BanList banList = Bukkit.getBanList(org.bukkit.BanList.Type.NAME);
                banList.pardon(playerName);
            });

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Player unbanned successfully");
            data.put("player", playerName);
            ctx.status(200).json(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(ApiResponse.error("Invalid UUID format"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("DELETE /api/v1/players/{uuid}/ban", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to unban player"));
        }
    }
}
