package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.title.Title;
import org.bukkit.Bukkit;
import org.bukkit.Sound;
import org.bukkit.entity.Player;

import java.time.Duration;
import java.util.Map;

/**
 * API for broadcasting messages to all players
 */
public class BroadcastAPI {

    private final ServerAdminPanelPlugin plugin;
    private final Gson gson;

    /**
     * Request body for chat message broadcast
     */
    public static class ChatMessageRequest {
        public String message;
        public String color;
    }

    /**
     * Request body for title broadcast
     */
    public static class TitleRequest {
        public String title;
        public String subtitle;
        public Double fadeIn;
        public Double stay;
        public Double fadeOut;
    }

    /**
     * Request body for actionbar broadcast
     */
    public static class ActionBarRequest {
        public String message;
    }

    /**
     * Request body for sound broadcast
     */
    public static class SoundRequest {
        public String sound;
        public Double volume;
        public Double pitch;
    }

    public BroadcastAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.gson = new Gson();
    }

    /**
     * POST /api/v1/broadcast/message
     * Send chat message to all players
     */
    @TypeScriptEndpoint(path = "/api/v1/broadcast/message", method = "POST", description = "Send chat message to all online players")
    public void sendChatMessage(Context ctx) {
        try {
            ChatMessageRequest body = gson.fromJson(ctx.body(), ChatMessageRequest.class);
            String message = body.message;
            String colorHex = body.color != null ? body.color : "#FFFFFF";

            if (message == null || message.trim().isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Message is required"));
                return;
            }

            int playerCount = Bukkit.getOnlinePlayers().size();
            
            if (playerCount == 0) {
                ctx.json(ApiResponse.successMessage("No players online to send message"));
                return;
            }

            // Run on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                Component component = Component.text("[Server] " + message).color(parseColor(colorHex));
                for (Player player : Bukkit.getOnlinePlayers()) {
                    player.sendMessage(component);
                }
                plugin.getLogger().info("Broadcast message sent to " + Bukkit.getOnlinePlayers().size() + " players: " + message);
            });

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "sent broadcast message", message);

            ctx.json(ApiResponse.successMessage("Message sent to " + playerCount + " player(s)"));

        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/broadcast/message", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to send broadcast: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/broadcast/title
     * Send title message to all players
     */
    @TypeScriptEndpoint(path = "/api/v1/broadcast/title", method = "POST", description = "Send title message to all online players")
    public void sendTitle(Context ctx) {
        try {
            TitleRequest body = gson.fromJson(ctx.body(), TitleRequest.class);
            String title = body.title;
            String subtitle = body.subtitle != null ? body.subtitle : "";
            int fadeIn = body.fadeIn != null ? body.fadeIn.intValue() : 1;
            int stay = body.stay != null ? body.stay.intValue() : 3;
            int fadeOut = body.fadeOut != null ? body.fadeOut.intValue() : 1;

            if (title == null || title.trim().isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Title is required"));
                return;
            }

            int playerCount = Bukkit.getOnlinePlayers().size();
            
            if (playerCount == 0) {
                ctx.json(ApiResponse.successMessage("No players online to send title"));
                return;
            }

            // Run on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                Title titleComponent = Title.title(
                    Component.text(title).color(NamedTextColor.GOLD),
                    Component.text(subtitle).color(NamedTextColor.YELLOW),
                    Title.Times.times(
                        Duration.ofSeconds(fadeIn),
                        Duration.ofSeconds(stay),
                        Duration.ofSeconds(fadeOut)
                    )
                );

                for (Player player : Bukkit.getOnlinePlayers()) {
                    player.showTitle(titleComponent);
                }
                plugin.getLogger().info("Title sent to " + Bukkit.getOnlinePlayers().size() + " players: " + title);
            });

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "sent title broadcast", title);

            ctx.json(ApiResponse.successMessage("Title sent to " + playerCount + " player(s)"));

        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/broadcast/title", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to send title: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/broadcast/actionbar
     * Send actionbar message to all players
     */
    @TypeScriptEndpoint(path = "/api/v1/broadcast/actionbar", method = "POST", description = "Send action bar message to all online players")
    public void sendActionBar(Context ctx) {
        try {
            ActionBarRequest body = gson.fromJson(ctx.body(), ActionBarRequest.class);
            String message = body.message;

            if (message == null || message.trim().isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Message is required"));
                return;
            }

            int playerCount = Bukkit.getOnlinePlayers().size();
            
            if (playerCount == 0) {
                ctx.json(ApiResponse.successMessage("No players online to send action bar"));
                return;
            }

            // Run on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                Component component = Component.text(message).color(NamedTextColor.AQUA);

                for (Player player : Bukkit.getOnlinePlayers()) {
                    player.sendActionBar(component);
                }
                plugin.getLogger().info("Action bar sent to " + Bukkit.getOnlinePlayers().size() + " players: " + message);
            });

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "sent action bar message", message);

            ctx.json(ApiResponse.successMessage("Action bar sent to " + playerCount + " player(s)"));

        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/broadcast/actionbar", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to send action bar: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/broadcast/sound
     * Play sound for all players
     */
    @TypeScriptEndpoint(path = "/api/v1/broadcast/sound", method = "POST", description = "Play sound for all online players")
    public void playSound(Context ctx) {
        try {
            SoundRequest body = gson.fromJson(ctx.body(), SoundRequest.class);
            String soundName = body.sound;
            float volume = body.volume != null ? body.volume.floatValue() : 1.0f;
            float pitch = body.pitch != null ? body.pitch.floatValue() : 1.0f;

            if (soundName == null) {
                ctx.status(400).json(ApiResponse.error("Sound name is required"));
                return;
            }

            Sound sound;
            try {
                sound = Sound.valueOf(soundName.toUpperCase().replace(".", "_"));
            } catch (IllegalArgumentException e) {
                ctx.status(400).json(ApiResponse.error("Invalid sound name: " + soundName));
                return;
            }

            // Get player count before executing
            int playerCount = Bukkit.getOnlinePlayers().size();
            
            if (playerCount == 0) {
                ctx.json(ApiResponse.successMessage("No players online to play sound"));
                return;
            }

            // Run on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                for (Player player : Bukkit.getOnlinePlayers()) {
                    player.playSound(player.getLocation(), sound, org.bukkit.SoundCategory.MASTER, volume, pitch);
                    plugin.getLogger().info("Playing sound " + soundName + " for player " + player.getName());
                }
            });

            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "played sound", soundName + " for " + playerCount + " players");

            ctx.json(ApiResponse.successMessage("Sound '" + soundName + "' played for " + playerCount + " player(s)"));

        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/broadcast/sound", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to play sound: " + e.getMessage()));
        }
    }

    /**
     * Parse color hex to NamedTextColor
     * Simple color mapping for common colors
     */
    private NamedTextColor parseColor(String hex) {
        switch (hex.toLowerCase()) {
            case "#ff0000": return NamedTextColor.RED;
            case "#00ff00": return NamedTextColor.GREEN;
            case "#0000ff": return NamedTextColor.BLUE;
            case "#ffff00": return NamedTextColor.YELLOW;
            case "#ff00ff": return NamedTextColor.LIGHT_PURPLE;
            case "#00ffff": return NamedTextColor.AQUA;
            case "#ffffff":
            default:
                return NamedTextColor.WHITE;
        }
    }
}
