package de.kaicraft.adminpanel.api;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.util.ApiResponse;
import de.kaicraft.adminpanel.util.TypeScriptEndpoint;
import io.javalin.http.Context;
import org.bukkit.Bukkit;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;
import java.util.*;

/**
 * API for editing server and plugin configuration files
 */
public class ConfigEditorAPI {
    private final ServerAdminPanelPlugin plugin;
    private final File serverRoot;
    private final Set<String> allowedPaths;

    public ConfigEditorAPI(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.serverRoot = plugin.getDataFolder().getParentFile().getParentFile();
        
        // Define allowed paths for config editing (security)
        this.allowedPaths = new HashSet<>(Arrays.asList(
            "server.properties",
            "bukkit.yml",
            "spigot.yml",
            "paper.yml",
            "paper-world-defaults.yml",
            "config/paper-global.yml",
            "config/paper-world-defaults.yml",
            "start.sh",
            "start.bat",
            "plugins"
        ));
    }

    /**
     * GET /api/v1/configs
     * List all editable config files
     */
    @TypeScriptEndpoint(path = "GET /api/v1/configs", responseType = "{ configs: ConfigFile[] }")
    public void listConfigs(Context ctx) {
        try {
            List<Map<String, Object>> configs = new ArrayList<>();
            
            // Server configs
            addConfigIfExists(configs, "server.properties", "Server Properties", "properties");
            addConfigIfExists(configs, "bukkit.yml", "Bukkit", "yaml");
            addConfigIfExists(configs, "spigot.yml", "Spigot", "yaml");
            addConfigIfExists(configs, "paper.yml", "Paper (Legacy)", "yaml");
            addConfigIfExists(configs, "paper-world-defaults.yml", "Paper World Defaults (Legacy)", "yaml");
            addConfigIfExists(configs, "config/paper-global.yml", "Paper Global", "yaml");
            addConfigIfExists(configs, "config/paper-world-defaults.yml", "Paper World Defaults", "yaml");
            
            // Startup scripts
            addConfigIfExists(configs, "start.sh", "Start Script (Linux)", "shell");
            addConfigIfExists(configs, "start.bat", "Start Script (Windows)", "batch");
            
            // Plugin configs
            File pluginsDir = new File(serverRoot, "plugins");
            if (pluginsDir.exists() && pluginsDir.isDirectory()) {
                File[] pluginFolders = pluginsDir.listFiles(File::isDirectory);
                if (pluginFolders != null) {
                    for (File pluginFolder : pluginFolders) {
                        File configYml = new File(pluginFolder, "config.yml");
                        if (configYml.exists() && configYml.isFile()) {
                            Map<String, Object> config = new HashMap<>();
                            config.put("path", "plugins/" + pluginFolder.getName() + "/config.yml");
                            config.put("name", pluginFolder.getName());
                            config.put("category", "Plugin");
                            config.put("type", "yaml");
                            config.put("size", configYml.length());
                            config.put("lastModified", configYml.lastModified());
                            configs.add(config);
                        }
                    }
                }
            }
            
            ctx.json(ApiResponse.success("configs", configs));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/configs", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to list configs"));
        }
    }

    /**
     * GET /api/v1/configs/read
     * Read a config file
     */
    @TypeScriptEndpoint(path = "GET /api/v1/configs/read", responseType = "{ content: string, path: string }")
    public void readConfig(Context ctx) {
        try {
            String path = ctx.queryParam("path");
            
            if (path == null || path.isEmpty()) {
                ctx.status(400).json(ApiResponse.error("Path parameter is required"));
                return;
            }
            
            // Security check
            if (!isPathAllowed(path)) {
                ctx.status(403).json(ApiResponse.error("Access to this path is not allowed"));
                return;
            }
            
            File configFile = new File(serverRoot, path);
            
            if (!configFile.exists() || !configFile.isFile()) {
                ctx.status(404).json(ApiResponse.error("Config file not found"));
                return;
            }
            
            // Read file content
            String content = Files.readString(configFile.toPath());
            
            Map<String, Object> data = new HashMap<>();
            data.put("content", content);
            data.put("path", path);
            data.put("size", configFile.length());
            data.put("lastModified", configFile.lastModified());
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logUserAction(username, "read-config", path);
            
            ctx.json(ApiResponse.success(data));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("GET /api/v1/configs/read", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to read config: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/configs/write
     * Write to a config file
     */
    @TypeScriptEndpoint(path = "POST /api/v1/configs/write", responseType = "{ message: string }")
    public void writeConfig(Context ctx) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            
            String path = (String) body.get("path");
            String content = (String) body.get("content");
            
            if (path == null || content == null) {
                ctx.status(400).json(ApiResponse.error("Path and content are required"));
                return;
            }
            
            // Security check
            if (!isPathAllowed(path)) {
                ctx.status(403).json(ApiResponse.error("Access to this path is not allowed"));
                return;
            }
            
            File configFile = new File(serverRoot, path);
            
            if (!configFile.exists()) {
                ctx.status(404).json(ApiResponse.error("Config file not found"));
                return;
            }
            
            // Create backup before writing
            createBackup(configFile);
            
            // Write new content
            Files.writeString(configFile.toPath(), content, StandardOpenOption.TRUNCATE_EXISTING);
            
            String username = ctx.attribute("username");
            plugin.getAuditLogger().logSecurityEvent(username, "modified-config: " + path, true);
            plugin.getAuditLogger().logUserAction(username, "write-config", path + " (" + content.length() + " bytes)");
            
            ctx.json(ApiResponse.successMessage("Config file saved successfully"));
            
        } catch (Exception e) {
            plugin.getAuditLogger().logApiError("POST /api/v1/configs/write", e.getMessage(), e);
            ctx.status(500).json(ApiResponse.error("Failed to write config: " + e.getMessage()));
        }
    }

    /**
     * Helper: Add config to list if it exists
     */
    private void addConfigIfExists(List<Map<String, Object>> configs, String path, String name, String type) {
        File file = new File(serverRoot, path);
        if (file.exists() && file.isFile()) {
            Map<String, Object> config = new HashMap<>();
            config.put("path", path);
            config.put("name", name);
            config.put("category", "Server");
            config.put("type", type);
            config.put("size", file.length());
            config.put("lastModified", file.lastModified());
            configs.add(config);
        }
    }

    /**
     * Security: Check if path is allowed for editing
     */
    private boolean isPathAllowed(String path) {
        // Prevent directory traversal
        if (path == null || path.contains("..") || path.startsWith("/") || path.startsWith("\\")) {
            return false;
        }
        
        // Check if path starts with any allowed path
        for (String allowedPath : allowedPaths) {
            if (path.equals(allowedPath) || path.startsWith(allowedPath + "/") || path.startsWith(allowedPath + "\\")) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Create backup of config file before editing
     */
    private void createBackup(File configFile) {
        try {
            File backupDir = new File(serverRoot, "config-backups");
            if (!backupDir.exists()) {
                backupDir.mkdir();
            }
            
            String timestamp = String.valueOf(System.currentTimeMillis());
            String backupName = configFile.getName() + "." + timestamp + ".backup";
            File backupFile = new File(backupDir, backupName);
            
            Files.copy(configFile.toPath(), backupFile.toPath());
            
            plugin.getLogger().info("Created backup: " + backupName);
            
        } catch (IOException e) {
            plugin.getLogger().warning("Failed to create backup: " + e.getMessage());
        }
    }
}
