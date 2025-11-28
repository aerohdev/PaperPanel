package de.kaicraft.adminpanel.update;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import org.bukkit.entity.Player;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.*;
import java.util.concurrent.CompletableFuture;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Manages Paper server updates with full workflow
 */
public class PaperVersionChecker {
    private final ServerAdminPanelPlugin plugin;
    private final Gson gson;
    
    private String currentVersion;
    private String latestVersion;
    private String latestBuild;
    private boolean updateAvailable;
    private boolean updateDownloaded;
    private long lastCheck;
    private String downloadUrl;
    private File downloadedJar;
    private int installedBuildNumber; // Persisted build number after update

    private static final String PAPER_API_BASE = "https://api.papermc.io/v2/projects/paper";
    private static final long CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
    private static final File BUILD_INFO_FILE = new File("plugins/PaperPanel/build-info.txt");

    public PaperVersionChecker(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.gson = new Gson();
        this.updateAvailable = false;
        this.updateDownloaded = false;
        this.lastCheck = 0;
        this.installedBuildNumber = -1;

        loadInstalledBuildNumber();
        extractVersionNumber();
    }

    /**
     * Start periodic version checks
     */
    public void startPeriodicCheck() {
        // Initial check after 1 minute
        plugin.getServer().getScheduler().runTaskLaterAsynchronously(plugin, 
            this::checkForUpdates, 20L * 60);
        
        // Periodic check every 6 hours
        plugin.getServer().getScheduler().runTaskTimerAsynchronously(plugin, 
            this::checkForUpdates, 20L * 60 * 60, 20L * 60 * 360);
    }

    /**
     * Check for updates (can be called manually or automatically)
     */
    public CompletableFuture<Boolean> checkForUpdates() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                plugin.getLogger().info("Checking for Paper server updates...");
                
                String mcVersion = extractMinecraftVersion();
                if (mcVersion == null) {
                    plugin.getLogger().warning("Could not determine Minecraft version");
                    return false;
                }
                
                String apiUrl = PAPER_API_BASE + "/versions/" + mcVersion;
                JsonObject versionData = fetchJson(apiUrl);
                
                if (versionData == null) {
                    plugin.getLogger().warning("Could not fetch version data from Paper API");
                    return false;
                }
                
                JsonArray builds = versionData.getAsJsonArray("builds");
                if (builds == null || builds.size() == 0) {
                    return false;
                }
                
                int latestBuildNum = builds.get(builds.size() - 1).getAsInt();
                this.latestBuild = String.valueOf(latestBuildNum);
                this.latestVersion = mcVersion;

                int currentBuildNum = extractBuildNumber();

                // Use persisted build number if extraction fails
                if (currentBuildNum == 0 && installedBuildNumber > 0) {
                    currentBuildNum = installedBuildNumber;
                    plugin.getLogger().info("Using persisted build number: " + installedBuildNumber);
                }

                if (latestBuildNum > currentBuildNum) {
                    this.updateAvailable = true;
                    this.downloadUrl = String.format(
                        "https://api.papermc.io/v2/projects/paper/versions/%s/builds/%d/downloads/paper-%s-%d.jar",
                        mcVersion, latestBuildNum, mcVersion, latestBuildNum
                    );
                    
                    plugin.getLogger().warning("Paper server update available!");
                    plugin.getLogger().warning("Current: Build #" + currentBuildNum);
                    plugin.getLogger().warning("Latest: Build #" + latestBuildNum);
                } else {
                    this.updateAvailable = false;
                    plugin.getLogger().info("Paper server is up to date (Build #" + currentBuildNum + ")");
                }
                
                this.lastCheck = System.currentTimeMillis();
                return this.updateAvailable;
                
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to check for updates: " + e.getMessage());
                return false;
            }
        });
    }

    /**
     * Step 2: Download the update
     */
    public CompletableFuture<UpdateResult> downloadUpdate() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!updateAvailable) {
                    return new UpdateResult(false, "No update available", UpdatePhase.IDLE);
                }
                
                plugin.getLogger().info("========================================");
                plugin.getLogger().info("Downloading Paper update...");
                plugin.getLogger().info("Build #" + latestBuild);
                plugin.getLogger().info("========================================");
                
                String newJarName = String.format("paper-%s-%s.jar", latestVersion, latestBuild);
                File serverDir = new File(".");
                File newJar = new File(serverDir, newJarName);
                
                // Check if already downloaded
                if (newJar.exists()) {
                    plugin.getLogger().info("Update already downloaded: " + newJarName);
                    this.downloadedJar = newJar;
                    this.updateDownloaded = true;
                    return new UpdateResult(true, "Update already downloaded", UpdatePhase.DOWNLOADED);
                }
                
                // Download
                boolean success = downloadFile(downloadUrl, newJar);
                if (!success) {
                    return new UpdateResult(false, "Download failed", UpdatePhase.ERROR);
                }
                
                plugin.getLogger().info("========================================");
                plugin.getLogger().info("✓ Download complete: " + newJarName);
                plugin.getLogger().info("Size: " + (newJar.length() / 1024 / 1024) + " MB");
                plugin.getLogger().info("========================================");
                
                this.downloadedJar = newJar;
                this.updateDownloaded = true;
                
                return new UpdateResult(true, "Download successful", UpdatePhase.DOWNLOADED);
                
            } catch (Exception e) {
                plugin.getLogger().severe("Download failed: " + e.getMessage());
                e.printStackTrace();
                return new UpdateResult(false, "Download error: " + e.getMessage(), UpdatePhase.ERROR);
            }
        });
    }

    /**
     * Step 3: Install update (full workflow)
     */
    public CompletableFuture<UpdateResult> installUpdate() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!updateDownloaded || downloadedJar == null) {
                    return new UpdateResult(false, "Update not downloaded yet", UpdatePhase.ERROR);
                }
                
                // Run installation on main thread
                plugin.getServer().getScheduler().runTask(plugin, () -> {
                    executeInstallation();
                });
                
                return new UpdateResult(true, "Installation started", UpdatePhase.INSTALLING);
                
            } catch (Exception e) {
                plugin.getLogger().severe("Installation failed: " + e.getMessage());
                e.printStackTrace();
                return new UpdateResult(false, "Installation error: " + e.getMessage(), UpdatePhase.ERROR);
            }
        });
    }

    /**
     * Execute the full installation workflow (must run on main thread)
     */
    private void executeInstallation() {
        plugin.getLogger().info("========================================");
        plugin.getLogger().info("Starting update installation...");
        plugin.getLogger().info("========================================");
        
        // Phase 1: 5-minute countdown with broadcasts
        broadcastUpdate("§e§l[UPDATE] Server update will be installed in 5 minutes!");
        broadcastUpdate("§e§lPlease finish your activities and prepare to disconnect.");
        
        scheduleCountdownBroadcasts();
        
        // Phase 2: After 5 minutes, execute installation
        plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
            executeInstallationSteps();
        }, 20L * 60 * 5); // 5 minutes
    }

    /**
     * Schedule countdown broadcasts
     */
    private void scheduleCountdownBroadcasts() {
        int[] intervals = {240, 180, 120, 60, 30, 10, 5, 4, 3, 2, 1}; // seconds before installation
        
        for (int remaining : intervals) {
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                String color = remaining <= 10 ? "§c§l" : remaining <= 30 ? "§6§l" : "§e§l";
                broadcastUpdate(color + "[UPDATE] Installation in " + remaining + " second" + (remaining == 1 ? "" : "s") + "!");
            }, 20L * (300 - remaining)); // 300s = 5min
        }
    }

    /**
     * Execute installation steps
     */
    private void executeInstallationSteps() {
        try {
            // Step 1: Kick all players
            plugin.getLogger().info("Step 1/5: Kicking all players...");
            for (Player player : plugin.getServer().getOnlinePlayers()) {
                player.kickPlayer("§c§lServer Update\n§e\nThe server is being updated to a new version.\n§7Please reconnect in a few minutes!");
            }
            plugin.getLogger().info("  ✓ All players kicked");
            
            // Step 2: Create backup
            plugin.getLogger().info("Step 2/5: Creating backup...");
            boolean backupSuccess = false;
            String backupFilename = null;
            if (plugin.getBackupManager() != null) {
                var result = plugin.getBackupManager().createUpdateBackup("update-system");
                backupSuccess = result.success;
                backupFilename = result.filename;
            } else {
                backupSuccess = createBackup();
            }
            if (backupSuccess) {
                plugin.getLogger().info("  ✓ Backup created" + (backupFilename != null ? ": " + backupFilename : ""));
            } else {
                plugin.getLogger().warning("  ! Backup failed, but continuing...");
            }
            
            // Step 3: Update start.sh
            plugin.getLogger().info("Step 3/5: Updating start script...");
            File currentJar = detectServerJar();
            String oldJarName = currentJar != null ? currentJar.getName() : "paper.jar";
            String newJarName = downloadedJar.getName();
            
            boolean scriptUpdated = updateStartScript(oldJarName, newJarName);
            if (scriptUpdated) {
                plugin.getLogger().info("  ✓ Start script updated");
            } else {
                plugin.getLogger().warning("  ! Could not update start script");
            }
            
            // Step 4: Delete old JAR
            plugin.getLogger().info("Step 4/5: Removing old JAR...");
            if (currentJar != null && currentJar.exists() && !currentJar.equals(downloadedJar)) {
                currentJar.delete();
                plugin.getLogger().info("  ✓ Old JAR deleted: " + oldJarName);
            }
            
            // Step 5: Restart server
            plugin.getLogger().info("Step 5/5: Restarting server...");
            plugin.getLogger().info("========================================");
            plugin.getLogger().info("UPDATE COMPLETE!");
            plugin.getLogger().info("Server will now restart with new version");
            plugin.getLogger().info("========================================");

            // Save the installed build number before restart
            try {
                int newBuildNum = Integer.parseInt(latestBuild);
                saveInstalledBuildNumber(newBuildNum);
                plugin.getLogger().info("  ✓ Saved build number: " + newBuildNum);
            } catch (Exception e) {
                plugin.getLogger().warning("  ! Could not save build number: " + e.getMessage());
            }

            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                try {
                    // First try Paper's restart command (uses spigot.yml restart-script)
                    plugin.getLogger().info("Attempting restart using Paper restart command...");
                    plugin.getServer().dispatchCommand(plugin.getServer().getConsoleSender(), "restart");
                } catch (Exception e) {
                    plugin.getLogger().severe("Restart command failed: " + e.getMessage());
                    plugin.getLogger().warning("Please manually restart the server to complete the update.");
                    plugin.getLogger().warning("Make sure spigot.yml has 'restart-script' configured.");
                }
            }, 40L); // 2 seconds delay
            
        } catch (Exception e) {
            plugin.getLogger().severe("Installation steps failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Create full server backup
     */
    private boolean createBackup() {
        try {
            String timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new java.util.Date());
            File backupDir = new File("backups");
            if (!backupDir.exists()) {
                backupDir.mkdirs();
            }
            
            File backupFile = new File(backupDir, "server-backup-" + timestamp + ".zip");
            
            plugin.getLogger().info("  Creating backup: " + backupFile.getName());
            
            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(backupFile))) {
                // Backup critical directories
                String[] dirsToBackup = {"world", "world_nether", "world_the_end", "plugins", "config"};
                
                for (String dirName : dirsToBackup) {
                    File dir = new File(dirName);
                    if (dir.exists()) {
                        zipDirectory(dir, dir.getName(), zos);
                        plugin.getLogger().info("    + " + dirName);
                    }
                }
                
                // Backup critical root files
                String[] filesToBackup = {
                    "server.properties", "bukkit.yml", "spigot.yml", "paper.yml", 
                    "start.sh", "run.sh", "start.bat", "run.bat",
                    "eula.txt", "ops.json", "whitelist.json", "banned-players.json"
                };
                
                for (String fileName : filesToBackup) {
                    File file = new File(fileName);
                    if (file.exists() && file.isFile()) {
                        try (FileInputStream fis = new FileInputStream(file)) {
                            ZipEntry zipEntry = new ZipEntry(fileName);
                            zos.putNextEntry(zipEntry);
                            
                            byte[] buffer = new byte[8192];
                            int length;
                            while ((length = fis.read(buffer)) > 0) {
                                zos.write(buffer, 0, length);
                            }
                            
                            zos.closeEntry();
                            plugin.getLogger().info("    + " + fileName);
                        }
                    }
                }
            }
            
            plugin.getLogger().info("  Backup size: " + (backupFile.length() / 1024 / 1024) + " MB");
            
            return true;
            
        } catch (Exception e) {
            plugin.getLogger().warning("Backup failed: " + e.getMessage());
            return false;
        }
    }

    /**
     * Zip directory recursively
     */
    private void zipDirectory(File dir, String zipPath, ZipOutputStream zos) throws IOException {
        File[] files = dir.listFiles();
        if (files == null) return;
        
        for (File file : files) {
            if (file.isDirectory()) {
                zipDirectory(file, zipPath + "/" + file.getName(), zos);
            } else {
                try (FileInputStream fis = new FileInputStream(file)) {
                    ZipEntry zipEntry = new ZipEntry(zipPath + "/" + file.getName());
                    zos.putNextEntry(zipEntry);
                    
                    byte[] buffer = new byte[8192];
                    int length;
                    while ((length = fis.read(buffer)) > 0) {
                        zos.write(buffer, 0, length);
                    }
                    
                    zos.closeEntry();
                }
            }
        }
    }

    /**
     * Broadcast message to all players
     */
    private void broadcastUpdate(String message) {
        plugin.getServer().broadcastMessage(message);
        plugin.getLogger().info(message.replaceAll("§[0-9a-fk-or]", "")); // Log without color codes
    }

    /**
     * Get update status
     */
    public UpdateStatus getStatus() {
        boolean needsCheck = (System.currentTimeMillis() - lastCheck) > CHECK_INTERVAL;
        
        return new UpdateStatus(
            updateAvailable,
            updateDownloaded,
            currentVersion,
            latestVersion,
            latestBuild,
            downloadUrl,
            lastCheck,
            needsCheck
        );
    }

    private String extractMinecraftVersion() {
        try {
            String version = plugin.getServer().getVersion();
            int start = version.indexOf("MC: ") + 4;
            int end = version.indexOf(")", start);
            if (start > 3 && end > start) {
                return version.substring(start, end);
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to extract MC version: " + e.getMessage());
        }
        return null;
    }

    private int extractBuildNumber() {
        try {
            String version = plugin.getServer().getVersion();
            plugin.getLogger().info("Debug: Full version string: " + version);

            // Try multiple patterns to extract build number
            // Pattern 1: "Paper-123 " (old format)
            int paperIndex = version.indexOf("Paper-");
            if (paperIndex >= 0) {
                int start = paperIndex + 6;
                int end = version.indexOf(" ", start);
                if (end == -1) end = version.indexOf(")", start);
                if (end == -1) end = version.length();
                if (start < end) {
                    String buildStr = version.substring(start, end).trim();
                    plugin.getLogger().info("Debug: Extracted build string (Pattern 1): " + buildStr);
                    return Integer.parseInt(buildStr);
                }
            }

            // Pattern 2: "git-Paper-123)" or "(git-Paper-123)"
            int gitPaperIndex = version.indexOf("git-Paper-");
            if (gitPaperIndex >= 0) {
                int start = gitPaperIndex + 10;
                int end = version.indexOf(")", start);
                if (end == -1) end = version.indexOf(" ", start);
                if (end == -1) end = version.length();
                if (start < end) {
                    String buildStr = version.substring(start, end).trim();
                    plugin.getLogger().info("Debug: Extracted build string (Pattern 2): " + buildStr);
                    return Integer.parseInt(buildStr);
                }
            }

            // Pattern 3: Look for "(MC: X.X.X)" and extract number before it
            int mcIndex = version.indexOf("(MC:");
            if (mcIndex > 0) {
                String beforeMC = version.substring(0, mcIndex).trim();
                String[] parts = beforeMC.split("[-\\s]+");
                for (int i = parts.length - 1; i >= 0; i--) {
                    try {
                        int buildNum = Integer.parseInt(parts[i]);
                        if (buildNum > 0) {
                            plugin.getLogger().info("Debug: Extracted build number (Pattern 3): " + buildNum);
                            return buildNum;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }

            plugin.getLogger().warning("Could not extract build number from version string: " + version);
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to extract build number: " + e.getMessage());
            e.printStackTrace();
        }
        return 0;
    }

    private void extractVersionNumber() {
        String mcVersion = extractMinecraftVersion();
        int buildNum = extractBuildNumber();

        // Use persisted build number if extraction fails
        if (buildNum == 0 && installedBuildNumber > 0) {
            buildNum = installedBuildNumber;
            plugin.getLogger().info("Using persisted build number for display: " + installedBuildNumber);
        }

        if (mcVersion != null) {
            this.currentVersion = mcVersion + " (Build #" + buildNum + ")";
        }
    }

    /**
     * Load installed build number from persistent storage
     */
    private void loadInstalledBuildNumber() {
        try {
            if (BUILD_INFO_FILE.exists()) {
                String content = new String(Files.readAllBytes(BUILD_INFO_FILE.toPath())).trim();
                installedBuildNumber = Integer.parseInt(content);
                plugin.getLogger().info("Loaded persisted build number: " + installedBuildNumber);
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Could not load build info: " + e.getMessage());
        }
    }

    /**
     * Save installed build number to persistent storage
     */
    private void saveInstalledBuildNumber(int buildNumber) {
        try {
            BUILD_INFO_FILE.getParentFile().mkdirs();
            Files.write(BUILD_INFO_FILE.toPath(), String.valueOf(buildNumber).getBytes());
            this.installedBuildNumber = buildNumber;
        } catch (Exception e) {
            plugin.getLogger().warning("Could not save build info: " + e.getMessage());
        }
    }

    private JsonObject fetchJson(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("User-Agent", "PaperPanel/2.0.0");
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                return null;
            }
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            
            return gson.fromJson(response.toString(), JsonObject.class);
            
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to fetch from " + urlString + ": " + e.getMessage());
            return null;
        }
    }

    private boolean downloadFile(String urlString, File destination) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "PaperPanel/2.0.0");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(60000);
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                plugin.getLogger().warning("Download failed with response code: " + responseCode);
                return false;
            }
            
            long fileSize = conn.getContentLengthLong();
            plugin.getLogger().info("  File size: " + (fileSize / 1024 / 1024) + " MB");
            
            try (InputStream in = conn.getInputStream();
                 FileOutputStream out = new FileOutputStream(destination)) {
                
                byte[] buffer = new byte[8192];
                int bytesRead;
                long totalBytesRead = 0;
                long lastLogTime = System.currentTimeMillis();
                int lastProgress = 0;
                
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;
                    
                    int progress = (int) ((totalBytesRead * 100) / fileSize);
                    if (progress >= lastProgress + 10 || System.currentTimeMillis() - lastLogTime > 5000) {
                        plugin.getLogger().info("  Progress: " + progress + "%");
                        lastLogTime = System.currentTimeMillis();
                        lastProgress = progress;
                    }
                }
                
                return true;
            }
            
        } catch (Exception e) {
            plugin.getLogger().severe("Download failed: " + e.getMessage());
            return false;
        }
    }

    private File detectServerJar() {
        try {
            File currentDir = new File(".");
            File[] jars = currentDir.listFiles((dir, name) -> 
                name.toLowerCase().contains("paper") && name.endsWith(".jar") && !name.contains(".backup"));
            
            if (jars != null && jars.length > 0) {
                File currentJar = jars[0];
                for (File jar : jars) {
                    if (jar.length() > currentJar.length()) {
                        currentJar = jar;
                    }
                }
                return currentJar;
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error detecting server JAR: " + e.getMessage());
        }
        return null;
    }

    private boolean updateStartScript(String oldJarName, String newJarName) {
        String[] scriptNames = {"start.sh", "run.sh", "start.bat", "run.bat"};
        boolean anyUpdated = false;
        
        for (String scriptName : scriptNames) {
            File script = new File(scriptName);
            if (script.exists()) {
                try {
                    String content = new String(Files.readAllBytes(script.toPath()));
                    String newContent = content;
                    boolean modified = false;
                    
                    // Replace any *.jar reference with the new JAR name
                    // This handles paper.jar, server.jar, paper-1.21.1-115.jar, etc.
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("([^\\s/\\\\]+\\.jar)");
                    java.util.regex.Matcher matcher = pattern.matcher(content);
                    
                    if (matcher.find()) {
                        String oldJarInScript = matcher.group(1);
                        newContent = content.replaceAll("\\b" + java.util.regex.Pattern.quote(oldJarInScript) + "\\b", newJarName);
                        modified = true;
                        plugin.getLogger().info("    ✓ Replaced: " + oldJarInScript + " -> " + newJarName);
                    }
                    
                    if (modified) {
                        // Create backup before modifying
                        File backup = new File(scriptName + ".backup");
                        Files.copy(script.toPath(), backup.toPath(), StandardCopyOption.REPLACE_EXISTING);
                        
                        // Write new content
                        Files.write(script.toPath(), newContent.getBytes());
                        
                        plugin.getLogger().info("    ✓ Updated: " + scriptName + " (backup created)");
                        anyUpdated = true;
                    } else {
                        plugin.getLogger().info("    - No JAR reference found in " + scriptName);
                    }
                } catch (Exception e) {
                    plugin.getLogger().warning("    ! Failed to update " + scriptName + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
        
        if (!anyUpdated) {
            plugin.getLogger().warning("  ! No start scripts were updated - manual JAR name change may be needed");
        }
        
        return anyUpdated;
    }

    /**
     * Update phases enum
     */
    public enum UpdatePhase {
        IDLE,
        CHECKING,
        AVAILABLE,
        DOWNLOADING,
        DOWNLOADED,
        INSTALLING,
        COMPLETE,
        ERROR
    }

    /**
     * Update status data class
     */
    public static class UpdateStatus {
        public final boolean updateAvailable;
        public final boolean updateDownloaded;
        public final String currentVersion;
        public final String latestVersion;
        public final String latestBuild;
        public final String downloadUrl;
        public final long lastCheck;
        public final boolean needsCheck;

        public UpdateStatus(boolean updateAvailable, boolean updateDownloaded, String currentVersion, 
                          String latestVersion, String latestBuild, String downloadUrl, 
                          long lastCheck, boolean needsCheck) {
            this.updateAvailable = updateAvailable;
            this.updateDownloaded = updateDownloaded;
            this.currentVersion = currentVersion;
            this.latestVersion = latestVersion;
            this.latestBuild = latestBuild;
            this.downloadUrl = downloadUrl;
            this.lastCheck = lastCheck;
            this.needsCheck = needsCheck;
        }
    }

    /**
     * Update result data class
     */
    public static class UpdateResult {
        public final boolean success;
        public final String message;
        public final UpdatePhase phase;

        public UpdateResult(boolean success, String message, UpdatePhase phase) {
            this.success = success;
            this.message = message;
            this.phase = phase;
        }
    }
}