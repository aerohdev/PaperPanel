package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import io.javalin.http.Context;
import org.bukkit.Bukkit;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.PluginDescriptionFile;

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
                PluginDescriptionFile desc = p.getDescription();

                Map<String, Object> pluginInfo = new HashMap<>();
                pluginInfo.put("name", p.getName());
                pluginInfo.put("version", desc.getVersion());
                pluginInfo.put("enabled", p.isEnabled());
                pluginInfo.put("description", desc.getDescription());
                pluginInfo.put("authors", desc.getAuthors());
                pluginInfo.put("website", desc.getWebsite());
                pluginInfo.put("main", desc.getMain());
                pluginInfo.put("apiVersion", desc.getAPIVersion());

                // Get dependencies
                List<String> depends = desc.getDepend();
                List<String> softDepends = desc.getSoftDepend();
                pluginInfo.put("depends", depends != null ? depends : Collections.emptyList());
                pluginInfo.put("softDepends", softDepends != null ? softDepends : Collections.emptyList());

                // Get commands
                if (desc.getCommands() != null) {
                    pluginInfo.put("commands", new ArrayList<>(desc.getCommands().keySet()));
                } else {
                    pluginInfo.put("commands", Collections.emptyList());
                }

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

            PluginDescriptionFile desc = p.getDescription();

            Map<String, Object> pluginInfo = new HashMap<>();
            pluginInfo.put("name", p.getName());
            pluginInfo.put("version", desc.getVersion());
            pluginInfo.put("enabled", p.isEnabled());
            pluginInfo.put("description", desc.getDescription());
            pluginInfo.put("authors", desc.getAuthors());
            pluginInfo.put("website", desc.getWebsite());
            pluginInfo.put("main", desc.getMain());
            pluginInfo.put("apiVersion", desc.getAPIVersion());
            pluginInfo.put("depends", desc.getDepend());
            pluginInfo.put("softDepends", desc.getSoftDepend());
            pluginInfo.put("loadBefore", desc.getLoadBefore());
            pluginInfo.put("prefix", desc.getPrefix());

            // Get commands with details
            if (desc.getCommands() != null) {
                pluginInfo.put("commands", desc.getCommands());
            }

            // Get permissions
            if (desc.getPermissions() != null) {
                pluginInfo.put("permissions", desc.getPermissions().stream()
                        .map(perm -> Map.of(
                                "name", perm.getName(),
                                "description", perm.getDescription() != null ? perm.getDescription() : "",
                                "default", perm.getDefault().toString()
                        ))
                        .collect(Collectors.toList()));
            }

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
