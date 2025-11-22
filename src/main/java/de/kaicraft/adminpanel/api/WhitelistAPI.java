package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.entity.Player;

import java.util.*;

/**
 * API endpoints for whitelist and ops management
 */
public class WhitelistAPI {
    private final ServerAdminPanelPlugin plugin;

    /**
     * Request body for add player endpoint
     */
    public static class AddPlayerRequest {
        public String identifier; // Can be UUID or username
    }

    /**
     * Request body for bulk import
     */
    public static class BulkImportRequest {
        public List<String> players; // List of UUIDs or usernames
        public String type; // "whitelist" or "ops"
    }

    public WhitelistAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
    }

    /**
     * GET /api/v1/whitelist
     * Get whitelist status and all whitelisted players
     */
    @TypeScriptEndpoint(path = "GET /api/v1/whitelist", responseType = "{ enabled: boolean, players: PlayerListEntry[] }")
    public void getWhitelist(Context ctx) {
        try {
            boolean enabled = Bukkit.hasWhitelist();
            Set<OfflinePlayer> whitelisted = Bukkit.getWhitelistedPlayers();
            
            List<Map<String, Object>> players = new ArrayList<>();
            for (OfflinePlayer offlinePlayer : whitelisted) {
                Map<String, Object> playerData = new HashMap<>();
                playerData.put("uuid", offlinePlayer.getUniqueId().toString());
                playerData.put("name", offlinePlayer.getName());
                playerData.put("online", offlinePlayer.isOnline());
                playerData.put("hasPlayed", offlinePlayer.hasPlayedBefore());
                playerData.put("isOp", offlinePlayer.isOp());
                players.add(playerData);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("enabled", enabled);
            data.put("players", players);
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/whitelist", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to get whitelist"));
        }
    }

    /**
     * GET /api/v1/ops
     * Get all operators
     */
    @TypeScriptEndpoint(path = "GET /api/v1/ops", responseType = "{ players: PlayerListEntry[] }")
    public void getOps(Context ctx) {
        try {
            Set<OfflinePlayer> ops = Bukkit.getOperators();
            
            List<Map<String, Object>> players = new ArrayList<>();
            for (OfflinePlayer offlinePlayer : ops) {
                Map<String, Object> playerData = new HashMap<>();
                playerData.put("uuid", offlinePlayer.getUniqueId().toString());
                playerData.put("name", offlinePlayer.getName());
                playerData.put("online", offlinePlayer.isOnline());
                playerData.put("hasPlayed", offlinePlayer.hasPlayedBefore());
                playerData.put("isWhitelisted", offlinePlayer.isWhitelisted());
                players.add(playerData);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("players", players);
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/ops", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to get ops"));
        }
    }

    /**
     * POST /api/v1/whitelist/enable
     * Enable whitelist
     */
    @TypeScriptEndpoint(path = "POST /api/v1/whitelist/enable", responseType = "{ message: string, enabled: boolean }")
    public void enableWhitelist(Context ctx) {
        try {
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "whitelist-enable", "Enabled server whitelist");
            
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.setWhitelist(true);
            });
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Whitelist enabled successfully");
            data.put("enabled", true);
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/whitelist/enable", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to enable whitelist"));
        }
    }

    /**
     * POST /api/v1/whitelist/disable
     * Disable whitelist
     */
    @TypeScriptEndpoint(path = "POST /api/v1/whitelist/disable", responseType = "{ message: string, enabled: boolean }")
    public void disableWhitelist(Context ctx) {
        try {
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "whitelist-disable", "Disabled server whitelist");
            
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.setWhitelist(false);
            });
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Whitelist disabled successfully");
            data.put("enabled", false);
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/whitelist/disable", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to disable whitelist"));
        }
    }

    /**
     * POST /api/v1/whitelist/add
     * Add player to whitelist
     */
    @TypeScriptEndpoint(path = "POST /api/v1/whitelist/add", responseType = "{ message: string, player: PlayerListEntry, warning?: string }")
    public void addToWhitelist(Context ctx) {
        try {
            AddPlayerRequest body = ctx.bodyAsClass(AddPlayerRequest.class);
            
            if (body.identifier == null || body.identifier.isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Player identifier is required"));
                return;
            }
            
            OfflinePlayer offlinePlayer = resolvePlayer(body.identifier);
            
            if (offlinePlayer == null) {
                ctx.status(404).json(ApiResponse.error("Player not found"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "whitelist-add", offlinePlayer.getName());
            
            UUID uuid = offlinePlayer.getUniqueId();
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.getOfflinePlayer(uuid).setWhitelisted(true);
            });
            
            Map<String, Object> playerData = new HashMap<>();
            playerData.put("uuid", offlinePlayer.getUniqueId().toString());
            playerData.put("name", offlinePlayer.getName());
            playerData.put("online", offlinePlayer.isOnline());
            playerData.put("hasPlayed", offlinePlayer.hasPlayedBefore());
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Player added to whitelist successfully");
            data.put("player", playerData);
            
            // Warning if player never joined
            if (!offlinePlayer.hasPlayedBefore()) {
                data.put("warning", "This player has never joined the server. The UUID may not be accurate.");
            }
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/whitelist/add", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to add player to whitelist"));
        }
    }

    /**
     * DELETE /api/v1/whitelist/remove/{uuid}
     * Remove player from whitelist
     */
    @TypeScriptEndpoint(path = "DELETE /api/v1/whitelist/remove/{uuid}", responseType = "{ message: string, player: string }")
    public void removeFromWhitelist(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);
            
            OfflinePlayer offlinePlayer = Bukkit.getOfflinePlayer(uuid);
            String playerName = offlinePlayer.getName();
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "whitelist-remove", playerName);
            
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.getOfflinePlayer(uuid).setWhitelisted(false);
            });
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Player removed from whitelist successfully");
            data.put("player", playerName);
            ctx.json(ApiResponse.success(data));
            
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(ApiResponse.error("Invalid UUID format"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("DELETE /api/v1/whitelist/remove/{uuid}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to remove player from whitelist"));
        }
    }

    /**
     * POST /api/v1/ops/add
     * Add player to operators
     */
    @TypeScriptEndpoint(path = "POST /api/v1/ops/add", responseType = "{ message: string, player: PlayerListEntry, warning?: string }")
    public void addOp(Context ctx) {
        try {
            AddPlayerRequest body = ctx.bodyAsClass(AddPlayerRequest.class);
            
            if (body.identifier == null || body.identifier.isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Player identifier is required"));
                return;
            }
            
            OfflinePlayer offlinePlayer = resolvePlayer(body.identifier);
            
            if (offlinePlayer == null) {
                ctx.status(404).json(ApiResponse.error("Player not found"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "op-add", offlinePlayer.getName());
            
            UUID uuid = offlinePlayer.getUniqueId();
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.getOfflinePlayer(uuid).setOp(true);
            });
            
            Map<String, Object> playerData = new HashMap<>();
            playerData.put("uuid", offlinePlayer.getUniqueId().toString());
            playerData.put("name", offlinePlayer.getName());
            playerData.put("online", offlinePlayer.isOnline());
            playerData.put("hasPlayed", offlinePlayer.hasPlayedBefore());
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Player opped successfully");
            data.put("player", playerData);
            
            // Warning if player never joined
            if (!offlinePlayer.hasPlayedBefore()) {
                data.put("warning", "This player has never joined the server. The UUID may not be accurate.");
            }
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/ops/add", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to op player"));
        }
    }

    /**
     * DELETE /api/v1/ops/remove/{uuid}
     * Remove player from operators
     */
    @TypeScriptEndpoint(path = "DELETE /api/v1/ops/remove/{uuid}", responseType = "{ message: string, player: string }")
    public void removeOp(Context ctx) {
        try {
            String uuidStr = ctx.pathParam("uuid");
            UUID uuid = UUID.fromString(uuidStr);
            
            OfflinePlayer offlinePlayer = Bukkit.getOfflinePlayer(uuid);
            String playerName = offlinePlayer.getName();
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "op-remove", playerName);
            
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.getOfflinePlayer(uuid).setOp(false);
            });
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Player deopped successfully");
            data.put("player", playerName);
            ctx.json(ApiResponse.success(data));
            
        } catch (IllegalArgumentException e) {
            ctx.status(400).json(ApiResponse.error("Invalid UUID format"));
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("DELETE /api/v1/ops/remove/{uuid}", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to deop player"));
        }
    }

    /**
     * POST /api/v1/whitelist/import
     * Bulk import players to whitelist
     */
    @TypeScriptEndpoint(path = "POST /api/v1/whitelist/import", responseType = "{ message: string, added: number, failed: string[], warnings: string[] }")
    public void bulkImportWhitelist(Context ctx) {
        try {
            BulkImportRequest body = ctx.bodyAsClass(BulkImportRequest.class);
            
            if (body.players == null || body.players.isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Player list is required"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "whitelist-bulk-import", body.players.size() + " players");
            
            List<String> failed = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            int added = 0;
            
            for (String identifier : body.players) {
                try {
                    OfflinePlayer offlinePlayer = resolvePlayer(identifier);
                    if (offlinePlayer != null) {
                        UUID uuid = offlinePlayer.getUniqueId();
                        Bukkit.getScheduler().runTask(plugin, () -> {
                            Bukkit.getOfflinePlayer(uuid).setWhitelisted(true);
                        });
                        added++;
                        
                        if (!offlinePlayer.hasPlayedBefore()) {
                            warnings.add(offlinePlayer.getName() + " has never joined the server");
                        }
                    } else {
                        failed.add(identifier);
                    }
                } catch (Exception e) {
                    failed.add(identifier);
                }
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Bulk import completed");
            data.put("added", added);
            data.put("failed", failed);
            data.put("warnings", warnings);
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/whitelist/import", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to import whitelist"));
        }
    }

    /**
     * POST /api/v1/ops/import
     * Bulk import players to ops
     */
    @TypeScriptEndpoint(path = "POST /api/v1/ops/import", responseType = "{ message: string, added: number, failed: string[], warnings: string[] }")
    public void bulkImportOps(Context ctx) {
        try {
            BulkImportRequest body = ctx.bodyAsClass(BulkImportRequest.class);
            
            if (body.players == null || body.players.isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Player list is required"));
                return;
            }
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "ops-bulk-import", body.players.size() + " players");
            
            List<String> failed = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            int added = 0;
            
            for (String identifier : body.players) {
                try {
                    OfflinePlayer offlinePlayer = resolvePlayer(identifier);
                    if (offlinePlayer != null) {
                        UUID uuid = offlinePlayer.getUniqueId();
                        Bukkit.getScheduler().runTask(plugin, () -> {
                            Bukkit.getOfflinePlayer(uuid).setOp(true);
                        });
                        added++;
                        
                        if (!offlinePlayer.hasPlayedBefore()) {
                            warnings.add(offlinePlayer.getName() + " has never joined the server");
                        }
                    } else {
                        failed.add(identifier);
                    }
                } catch (Exception e) {
                    failed.add(identifier);
                }
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Bulk import completed");
            data.put("added", added);
            data.put("failed", failed);
            data.put("warnings", warnings);
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/ops/import", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to import ops"));
        }
    }

    /**
     * GET /api/v1/whitelist/export
     * Export whitelist as JSON
     */
    @TypeScriptEndpoint(path = "GET /api/v1/whitelist/export", responseType = "{ players: string[] }")
    public void exportWhitelist(Context ctx) {
        try {
            Set<OfflinePlayer> whitelisted = Bukkit.getWhitelistedPlayers();
            List<String> players = new ArrayList<>();
            
            for (OfflinePlayer player : whitelisted) {
                players.add(player.getName() + " (" + player.getUniqueId().toString() + ")");
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("players", players);
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/whitelist/export", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to export whitelist"));
        }
    }

    /**
     * GET /api/v1/ops/export
     * Export ops as JSON
     */
    @TypeScriptEndpoint(path = "GET /api/v1/ops/export", responseType = "{ players: string[] }")
    public void exportOps(Context ctx) {
        try {
            Set<OfflinePlayer> ops = Bukkit.getOperators();
            List<String> players = new ArrayList<>();
            
            for (OfflinePlayer player : ops) {
                players.add(player.getName() + " (" + player.getUniqueId().toString() + ")");
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("players", players);
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/ops/export", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to export ops"));
        }
    }

    /**
     * Helper method to resolve player from UUID or username
     */
    @SuppressWarnings("deprecation")
    private OfflinePlayer resolvePlayer(String identifier) {
        try {
            // Try as UUID first
            UUID uuid = UUID.fromString(identifier);
            return Bukkit.getOfflinePlayer(uuid);
        } catch (IllegalArgumentException e) {
            // Try as username
            Player onlinePlayer = Bukkit.getPlayer(identifier);
            if (onlinePlayer != null) {
                return onlinePlayer;
            }
            // Fallback to offline player (deprecated but works)
            return Bukkit.getOfflinePlayer(identifier);
        }
    }
}
