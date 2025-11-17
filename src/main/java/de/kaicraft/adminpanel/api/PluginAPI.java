package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import io.papermc.paper.plugin.configuration.PluginMeta;
import org.bukkit.Bukkit;
import org.bukkit.plugin.Plugin;

import java.util.*;
import java.util.stream.Collectors;

/**
 * API endpoints for plugin management
 */
public class PluginAPI {
    private final ServerAdminPanelPlugin plugin;

    public PluginAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
    }

    /**
     * GET /api/plugins
     * Get list of all plugins
     */
    public void getPlugins(Context ctx) {
        try {
            Plugin[] plugins = Bukkit.getPluginManager().getPlugins();
            List<Map<String, Object>> pluginList = new ArrayList<>();

            for (Plugin p : plugins) {
                PluginMeta meta = p.getPluginMeta();

                Map<String, Object> pluginInfo = new HashMap<>();
                pluginInfo.put("name", p.getName());
                pluginInfo.put("version", meta.getVersion());
                pluginInfo.put("enabled", p.isEnabled());
                pluginInfo.put("description", meta.getDescription());
                pluginInfo.put("authors", meta.getAuthors());
                pluginInfo.put("website", meta.getWebsite());
                pluginInfo.put("main", meta.getMainClass());
                pluginInfo.put("apiVersion", meta.getAPIVersion());

                // Get dependencies
                List<String> depends = meta.getPluginDependencies();
                List<String> softDepends = meta.getPluginSoftDependencies();
                pluginInfo.put("depends", depends != null ? depends : Collections.emptyList());
                pluginInfo.put("softDepends", softDepends != null ? softDepends : Collections.emptyList());

                // Get commands - PluginMeta doesn't expose commands, use empty list
                pluginInfo.put("commands", Collections.emptyList());

                pluginList.add(pluginInfo);
            }

            // Sort by name
            pluginList.sort(Comparator.comparing(p -> (String) p.get("name")));

            ctx.status(200).json(Map.of(
                    "success", true,
                    "plugins", pluginList,
                    "total", pluginList.size()
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting plugin list: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve plugin list"
            ));
        }
    }

    /**
     * GET /api/plugins/{name}
     * Get detailed information about a specific plugin
     */
    public void getPlugin(Context ctx) {
        try {
            String pluginName = ctx.pathParam("name");
            Plugin p = Bukkit.getPluginManager().getPlugin(pluginName);

            if (p == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "Plugin '" + pluginName + "' not found"
                ));
                return;
            }

            PluginMeta meta = p.getPluginMeta();

            Map<String, Object> pluginInfo = new HashMap<>();
            pluginInfo.put("name", p.getName());
            pluginInfo.put("version", meta.getVersion());
            pluginInfo.put("enabled", p.isEnabled());
            pluginInfo.put("description", meta.getDescription());
            pluginInfo.put("authors", meta.getAuthors());
            pluginInfo.put("website", meta.getWebsite());
            pluginInfo.put("main", meta.getMainClass());
            pluginInfo.put("apiVersion", meta.getAPIVersion());
            pluginInfo.put("depends", meta.getPluginDependencies());
            pluginInfo.put("softDepends", meta.getPluginSoftDependencies());
            pluginInfo.put("loadBefore", meta.getLoadBeforePlugins());
            pluginInfo.put("prefix", meta.getLoggerPrefix());

            // Get commands with details - PluginMeta doesn't expose commands
            pluginInfo.put("commands", Collections.emptyMap());

            // Get permissions - PluginMeta doesn't expose permissions
            pluginInfo.put("permissions", Collections.emptyList());

            ctx.status(200).json(Map.of(
                    "success", true,
                    "plugin", pluginInfo
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error getting plugin info: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to retrieve plugin information"
            ));
        }
    }

    /**
     * POST /api/plugins/{name}/enable
     * Enable a plugin
     */
    public void enablePlugin(Context ctx) {
        try {
            String pluginName = ctx.pathParam("name");
            Plugin p = Bukkit.getPluginManager().getPlugin(pluginName);

            if (p == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "Plugin '" + pluginName + "' not found"
                ));
                return;
            }

            if (p.isEnabled()) {
                ctx.status(400).json(Map.of(
                        "success", false,
                        "error", "Bad Request",
                        "message", "Plugin is already enabled"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' enabling plugin: " + pluginName);

            // Enable plugin on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.getPluginManager().enablePlugin(p);
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Plugin '" + pluginName + "' enabled",
                    "plugin", pluginName
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error enabling plugin: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to enable plugin"
            ));
        }
    }

    /**
     * POST /api/plugins/{name}/disable
     * Disable a plugin
     */
    public void disablePlugin(Context ctx) {
        try {
            String pluginName = ctx.pathParam("name");
            Plugin p = Bukkit.getPluginManager().getPlugin(pluginName);

            if (p == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "Plugin '" + pluginName + "' not found"
                ));
                return;
            }

            if (!p.isEnabled()) {
                ctx.status(400).json(Map.of(
                        "success", false,
                        "error", "Bad Request",
                        "message", "Plugin is already disabled"
                ));
                return;
            }

            // Prevent disabling self
            if (p.getName().equals(plugin.getName())) {
                ctx.status(400).json(Map.of(
                        "success", false,
                        "error", "Bad Request",
                        "message", "Cannot disable ServerAdminPanel itself"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' disabling plugin: " + pluginName);

            // Disable plugin on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                Bukkit.getPluginManager().disablePlugin(p);
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Plugin '" + pluginName + "' disabled",
                    "plugin", pluginName
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error disabling plugin: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to disable plugin"
            ));
        }
    }

    /**
     * POST /api/plugins/{name}/reload
     * Reload a plugin's configuration
     */
    public void reloadPlugin(Context ctx) {
        try {
            String pluginName = ctx.pathParam("name");
            Plugin p = Bukkit.getPluginManager().getPlugin(pluginName);

            if (p == null) {
                ctx.status(404).json(Map.of(
                        "success", false,
                        "error", "Not Found",
                        "message", "Plugin '" + pluginName + "' not found"
                ));
                return;
            }

            String username = ctx.attribute("username");
            plugin.getLogger().info("User '" + username + "' reloading plugin config: " + pluginName);

            // Reload config on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                p.reloadConfig();
            });

            ctx.status(200).json(Map.of(
                    "success", true,
                    "message", "Plugin '" + pluginName + "' configuration reloaded",
                    "plugin", pluginName
            ));
        } catch (Exception e) {
            plugin.getLogger().severe("Error reloading plugin config: " + e.getMessage());
            ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Internal Server Error",
                    "message", "Failed to reload plugin configuration"
            ));
        }
    }
}
