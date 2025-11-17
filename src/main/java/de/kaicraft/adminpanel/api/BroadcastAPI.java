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
            Map<String, Object> body = gson.fromJson(ctx.body(), Map.class);
            String message = (String) body.get("message");
            String colorHex = (String) body.getOrDefault("color", "#FFFFFF");

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
            Map<String, Object> body = gson.fromJson(ctx.body(), Map.class);
            String title = (String) body.get("title");
            String subtitle = (String) body.getOrDefault("subtitle", "");
            int fadeIn = ((Double) body.getOrDefault("fadeIn", 1.0)).intValue();
            int stay = ((Double) body.getOrDefault("stay", 3.0)).intValue();
            int fadeOut = ((Double) body.getOrDefault("fadeOut", 1.0)).intValue();

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
            Map<String, Object> body = gson.fromJson(ctx.body(), Map.class);
            String message = (String) body.get("message");

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
            Map<String, Object> body = gson.fromJson(ctx.body(), Map.class);
            String soundName = (String) body.get("sound");
            float volume = ((Double) body.getOrDefault("volume", 1.0)).floatValue();
            float pitch = ((Double) body.getOrDefault("pitch", 1.0)).floatValue();

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
