package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.title.Title;
import org.bukkit.Bukkit;
import org.bukkit.Sound;
import org.bukkit.entity.Player;

import java.time.Duration;
import java.util.HashMap;
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
     * POST /api/broadcast/message
     * Send chat message to all players
     */
    public void sendChatMessage(Context ctx) {
        try {
            ChatMessageRequest body = gson.fromJson(ctx.body(), ChatMessageRequest.class);
            String message = body.message;
            String colorHex = body.color != null ? body.color : "#FFFFFF";

            if (message == null || message.trim().isEmpty()) {
                ctx.status(400).json(Map.of("error", "Message is required"));
                return;
            }

            // Run on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                Component component = Component.text(message)
                        .color(parseColor(colorHex));

                Bukkit.getServer().sendMessage(component);
            });

            ctx.json(Map.of(
                "success", true,
                "message", "Broadcast sent to " + Bukkit.getOnlinePlayers().size() + " players"
            ));

        } catch (Exception e) {
            plugin.getLogger().severe("Error sending broadcast: " + e.getMessage());
            ctx.status(500).json(Map.of("error", "Failed to send broadcast"));
        }
    }

    /**
     * POST /api/broadcast/title
     * Send title message to all players
     */
    public void sendTitle(Context ctx) {
        try {
            TitleRequest body = gson.fromJson(ctx.body(), TitleRequest.class);
            String title = body.title;
            String subtitle = body.subtitle != null ? body.subtitle : "";
            int fadeIn = body.fadeIn != null ? body.fadeIn.intValue() : 1;
            int stay = body.stay != null ? body.stay.intValue() : 3;
            int fadeOut = body.fadeOut != null ? body.fadeOut.intValue() : 1;

            if (title == null || title.trim().isEmpty()) {
                ctx.status(400).json(Map.of("error", "Title is required"));
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
            });

            ctx.json(Map.of(
                "success", true,
                "message", "Title sent to " + Bukkit.getOnlinePlayers().size() + " players"
            ));

        } catch (Exception e) {
            plugin.getLogger().severe("Error sending title: " + e.getMessage());
            ctx.status(500).json(Map.of("error", "Failed to send title"));
        }
    }

    /**
     * POST /api/broadcast/actionbar
     * Send actionbar message to all players
     */
    public void sendActionBar(Context ctx) {
        try {
            ActionBarRequest body = gson.fromJson(ctx.body(), ActionBarRequest.class);
            String message = body.message;

            if (message == null || message.trim().isEmpty()) {
                ctx.status(400).json(Map.of("error", "Message is required"));
                return;
            }

            // Run on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                Component component = Component.text(message).color(NamedTextColor.AQUA);

                for (Player player : Bukkit.getOnlinePlayers()) {
                    player.sendActionBar(component);
                }
            });

            ctx.json(Map.of(
                "success", true,
                "message", "Action bar sent to " + Bukkit.getOnlinePlayers().size() + " players"
            ));

        } catch (Exception e) {
            plugin.getLogger().severe("Error sending action bar: " + e.getMessage());
            ctx.status(500).json(Map.of("error", "Failed to send action bar"));
        }
    }

    /**
     * POST /api/broadcast/sound
     * Play sound for all players
     */
    public void playSound(Context ctx) {
        try {
            SoundRequest body = gson.fromJson(ctx.body(), SoundRequest.class);
            String soundName = body.sound;
            float volume = body.volume != null ? body.volume.floatValue() : 1.0f;
            float pitch = body.pitch != null ? body.pitch.floatValue() : 1.0f;

            if (soundName == null) {
                ctx.status(400).json(Map.of("error", "Sound name is required"));
                return;
            }

            Sound sound;
            try {
                sound = Sound.valueOf(soundName.toUpperCase());
            } catch (IllegalArgumentException e) {
                ctx.status(400).json(Map.of("error", "Invalid sound name: " + soundName));
                return;
            }

            // Run on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                for (Player player : Bukkit.getOnlinePlayers()) {
                    player.playSound(player.getLocation(), sound, volume, pitch);
                }
            });

            ctx.json(Map.of(
                "success", true,
                "message", "Sound played for " + Bukkit.getOnlinePlayers().size() + " players"
            ));

        } catch (Exception e) {
            plugin.getLogger().severe("Error playing sound: " + e.getMessage());
            ctx.status(500).json(Map.of("error", "Failed to play sound"));
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
