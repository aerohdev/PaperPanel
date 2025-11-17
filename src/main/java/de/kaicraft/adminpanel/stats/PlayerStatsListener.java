package de.kaicraft.adminpanel.stats;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.papermc.paper.event.player.AsyncChatEvent;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.*;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.entity.PlayerDeathEvent;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Listens to player events and tracks statistics
 */
public class PlayerStatsListener implements Listener {
    private final PlayerStatsManager statsManager;
    private final Map<UUID, Long> joinTimes = new HashMap<>();

    public PlayerStatsListener(PlayerStatsManager statsManager) {
        this.statsManager = statsManager;
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        UUID uuid = event.getPlayer().getUniqueId();
        String name = event.getPlayer().getName();

        // Update player in database
        statsManager.updatePlayer(uuid, name);

        // Track join time for playtime calculation
        joinTimes.put(uuid, System.currentTimeMillis());

        // Increment join count
        statsManager.incrementStat(uuid, "JOINS", 1);
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        UUID uuid = event.getPlayer().getUniqueId();

        // Calculate playtime
        if (joinTimes.containsKey(uuid)) {
            long sessionTime = System.currentTimeMillis() - joinTimes.get(uuid);
            statsManager.updatePlaytime(uuid, sessionTime);
            joinTimes.remove(uuid);
        }

        // Update last seen
        statsManager.updatePlayer(uuid, event.getPlayer().getName());
    }

    @EventHandler
    public void onBlockBreak(BlockBreakEvent event) {
        UUID uuid = event.getPlayer().getUniqueId();
        String blockType = event.getBlock().getType().name();

        statsManager.incrementStat(uuid, "BLOCKS_BROKEN", 1);
        statsManager.incrementStat(uuid, "BLOCKS_BROKEN_" + blockType, 1);
    }

    @EventHandler
    public void onBlockPlace(BlockPlaceEvent event) {
        UUID uuid = event.getPlayer().getUniqueId();
        String blockType = event.getBlock().getType().name();

        statsManager.incrementStat(uuid, "BLOCKS_PLACED", 1);
        statsManager.incrementStat(uuid, "BLOCKS_PLACED_" + blockType, 1);
    }

    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        UUID uuid = event.getPlayer().getUniqueId();
        statsManager.incrementStat(uuid, "DEATHS", 1);
    }

    @EventHandler
    public void onPlayerChat(AsyncChatEvent event) {
        UUID uuid = event.getPlayer().getUniqueId();
        statsManager.incrementStat(uuid, "MESSAGES_SENT", 1);
    }
}
