package de.kaicraft.adminpanel.backup;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.database.DatabaseManager;

import java.io.*;
import java.sql.*;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Manages backup creation, storage, and scheduling for PaperPanel
 */
public class BackupManager {
    private final ServerAdminPanelPlugin plugin;
    private final DatabaseManager databaseManager;
    private final File backupDir;
    private int schedulerTaskId = -1;

    public BackupManager(ServerAdminPanelPlugin plugin, DatabaseManager databaseManager) {
        this.plugin = plugin;
        this.databaseManager = databaseManager;
        this.backupDir = new File("backups");

        if (!backupDir.exists()) {
            backupDir.mkdirs();
        }

        // Scan and import any existing backups not in DB
        scanExistingBackups();
    }

    /**
     * Start the scheduler for auto-backups and scheduled updates
     */
    public void startScheduler() {
        // Run every minute to check for scheduled tasks
        schedulerTaskId = plugin.getServer().getScheduler().runTaskTimerAsynchronously(
            plugin,
            this::checkScheduledTasks,
            20L * 60,  // 1 minute initial delay
            20L * 60   // 1 minute period
        ).getTaskId();

        plugin.getLogger().info("Backup scheduler started");
    }

    /**
     * Stop the scheduler
     */
    public void stopScheduler() {
        if (schedulerTaskId != -1) {
            plugin.getServer().getScheduler().cancelTask(schedulerTaskId);
            schedulerTaskId = -1;
        }
    }

    /**
     * Check for scheduled tasks (auto-backups)
     */
    private void checkScheduledTasks() {
        try {
            long currentTime = System.currentTimeMillis();

            // Check for auto-backup schedules that need to run
            String query = "SELECT * FROM auto_backup_schedules WHERE enabled = 1 AND next_run <= ?";
            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setLong(1, currentTime);
                ResultSet rs = stmt.executeQuery();

                while (rs.next()) {
                    int scheduleId = rs.getInt("id");
                    boolean includesWorlds = rs.getBoolean("includes_worlds");
                    boolean includesPlugins = rs.getBoolean("includes_plugins");
                    boolean includesConfigs = rs.getBoolean("includes_configs");
                    String scheduleType = rs.getString("schedule_type");
                    int intervalValue = rs.getInt("interval_value");
                    String retentionType = rs.getString("retention_type");
                    int retentionValue = rs.getInt("retention_value");

                    // Create the backup
                    BackupOptions options = new BackupOptions(includesWorlds, includesPlugins, includesConfigs);
                    BackupResult result = createBackup(options, "auto-scheduler");

                    if (result.success) {
                        plugin.getLogger().info("Auto-backup completed: " + result.filename);

                        // Apply retention policy
                        applyRetentionPolicy(retentionType, retentionValue);
                    } else {
                        plugin.getLogger().warning("Auto-backup failed: " + result.message);
                    }

                    // Calculate next run time
                    long nextRun = calculateNextRun(scheduleType, intervalValue);

                    // Update the schedule
                    String updateQuery = "UPDATE auto_backup_schedules SET last_run = ?, next_run = ?, updated_at = ? WHERE id = ?";
                    try (PreparedStatement updateStmt = databaseManager.getConnection().prepareStatement(updateQuery)) {
                        updateStmt.setLong(1, currentTime);
                        updateStmt.setLong(2, nextRun);
                        updateStmt.setLong(3, currentTime);
                        updateStmt.setInt(4, scheduleId);
                        updateStmt.executeUpdate();
                    }
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error checking scheduled tasks: " + e.getMessage());
        }
    }

    /**
     * Calculate the next run time based on schedule type
     */
    private long calculateNextRun(String scheduleType, int intervalValue) {
        long now = System.currentTimeMillis();

        return switch (scheduleType) {
            case "daily" -> now + (24L * 60 * 60 * 1000);
            case "every-6-hours" -> now + (6L * 60 * 60 * 1000);
            case "weekly" -> now + (7L * 24 * 60 * 60 * 1000);
            case "custom" -> now + ((long) intervalValue * 60 * 60 * 1000); // intervalValue in hours
            default -> now + (24L * 60 * 60 * 1000);
        };
    }

    /**
     * Create a backup with the specified options
     */
    public BackupResult createBackup(BackupOptions options, String username) {
        try {
            String timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new java.util.Date());
            String filename = "backup-" + timestamp + ".zip";
            File backupFile = new File(backupDir, filename);

            plugin.getLogger().info("Creating backup: " + filename);

            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(backupFile))) {
                // Backup worlds if selected
                if (options.includesWorlds) {
                    String[] worldDirs = {"world", "world_nether", "world_the_end"};
                    for (String dirName : worldDirs) {
                        File dir = new File(dirName);
                        if (dir.exists()) {
                            zipDirectory(dir, dir.getName(), zos);
                            plugin.getLogger().info("  + " + dirName);
                        }
                    }
                }

                // Backup plugins if selected
                if (options.includesPlugins) {
                    File pluginsDir = new File("plugins");
                    if (pluginsDir.exists()) {
                        zipDirectory(pluginsDir, "plugins", zos);
                        plugin.getLogger().info("  + plugins");
                    }
                }

                // Backup configs if selected
                if (options.includesConfigs) {
                    String[] configFiles = {
                        "server.properties", "bukkit.yml", "spigot.yml", "paper.yml",
                        "paper-global.yml", "paper-world-defaults.yml",
                        "eula.txt", "ops.json", "whitelist.json", "banned-players.json", "banned-ips.json"
                    };

                    for (String fileName : configFiles) {
                        File file = new File(fileName);
                        if (file.exists() && file.isFile()) {
                            addFileToZip(file, fileName, zos);
                            plugin.getLogger().info("  + " + fileName);
                        }
                    }

                    // Also include config directory if it exists
                    File configDir = new File("config");
                    if (configDir.exists()) {
                        zipDirectory(configDir, "config", zos);
                        plugin.getLogger().info("  + config/");
                    }
                }
            }

            long fileSize = backupFile.length();
            plugin.getLogger().info("Backup complete: " + filename + " (" + (fileSize / 1024 / 1024) + " MB)");

            // Record in database
            recordBackup(filename, backupFile.getAbsolutePath(), fileSize, username, "manual", options);

            // Log audit
            if (plugin.getAuditLogger() != null) {
                plugin.getAuditLogger().logUserAction(username, "create-backup",
                    "Created backup: " + filename + " (worlds=" + options.includesWorlds +
                    ", plugins=" + options.includesPlugins + ", configs=" + options.includesConfigs + ")");
            }

            return new BackupResult(true, "Backup created successfully", filename, fileSize);

        } catch (Exception e) {
            plugin.getLogger().severe("Backup creation failed: " + e.getMessage());
            e.printStackTrace();
            return new BackupResult(false, "Backup failed: " + e.getMessage(), null, 0);
        }
    }

    /**
     * Create a backup specifically for updates (used by PaperVersionChecker)
     */
    public BackupResult createUpdateBackup(String username) {
        BackupOptions options = new BackupOptions(true, true, true);
        try {
            String timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new java.util.Date());
            String filename = "update-backup-" + timestamp + ".zip";
            File backupFile = new File(backupDir, filename);

            plugin.getLogger().info("Creating update backup: " + filename);

            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(backupFile))) {
                // Backup worlds
                String[] worldDirs = {"world", "world_nether", "world_the_end"};
                for (String dirName : worldDirs) {
                    File dir = new File(dirName);
                    if (dir.exists()) {
                        zipDirectory(dir, dir.getName(), zos);
                        plugin.getLogger().info("  + " + dirName);
                    }
                }

                // Backup plugins
                File pluginsDir = new File("plugins");
                if (pluginsDir.exists()) {
                    zipDirectory(pluginsDir, "plugins", zos);
                    plugin.getLogger().info("  + plugins");
                }

                // Backup configs
                String[] configFiles = {
                    "server.properties", "bukkit.yml", "spigot.yml", "paper.yml",
                    "paper-global.yml", "paper-world-defaults.yml",
                    "start.sh", "run.sh", "start.bat", "run.bat",
                    "eula.txt", "ops.json", "whitelist.json", "banned-players.json", "banned-ips.json"
                };

                for (String fileName : configFiles) {
                    File file = new File(fileName);
                    if (file.exists() && file.isFile()) {
                        addFileToZip(file, fileName, zos);
                        plugin.getLogger().info("  + " + fileName);
                    }
                }
            }

            long fileSize = backupFile.length();
            plugin.getLogger().info("Update backup complete: " + filename + " (" + (fileSize / 1024 / 1024) + " MB)");

            // Record in database
            recordBackup(filename, backupFile.getAbsolutePath(), fileSize, username, "update", options);

            return new BackupResult(true, "Update backup created successfully", filename, fileSize);

        } catch (Exception e) {
            plugin.getLogger().severe("Update backup creation failed: " + e.getMessage());
            e.printStackTrace();
            return new BackupResult(false, "Backup failed: " + e.getMessage(), null, 0);
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
                addFileToZip(file, zipPath + "/" + file.getName(), zos);
            }
        }
    }

    /**
     * Add a single file to the ZIP
     */
    private void addFileToZip(File file, String entryPath, ZipOutputStream zos) throws IOException {
        try (FileInputStream fis = new FileInputStream(file)) {
            ZipEntry zipEntry = new ZipEntry(entryPath);
            zos.putNextEntry(zipEntry);

            byte[] buffer = new byte[8192];
            int length;
            while ((length = fis.read(buffer)) > 0) {
                zos.write(buffer, 0, length);
            }

            zos.closeEntry();
        }
    }

    /**
     * Record backup in database
     */
    private void recordBackup(String filename, String filePath, long sizeBytes,
                               String createdBy, String backupType, BackupOptions options) throws SQLException {
        String query = """
            INSERT INTO backups (filename, file_path, size_bytes, created_at, created_by, backup_type,
                                 includes_worlds, includes_plugins, includes_configs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
            stmt.setString(1, filename);
            stmt.setString(2, filePath);
            stmt.setLong(3, sizeBytes);
            stmt.setLong(4, System.currentTimeMillis());
            stmt.setString(5, createdBy);
            stmt.setString(6, backupType);
            stmt.setBoolean(7, options.includesWorlds);
            stmt.setBoolean(8, options.includesPlugins);
            stmt.setBoolean(9, options.includesConfigs);
            stmt.executeUpdate();
        }
    }

    /**
     * List all backups from database
     */
    public List<BackupInfo> listBackups() {
        List<BackupInfo> backups = new ArrayList<>();

        try {
            String query = "SELECT * FROM backups ORDER BY created_at DESC";
            try (Statement stmt = databaseManager.getConnection().createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {

                while (rs.next()) {
                    BackupInfo info = new BackupInfo(
                        rs.getInt("id"),
                        rs.getString("filename"),
                        rs.getString("file_path"),
                        rs.getLong("size_bytes"),
                        rs.getLong("created_at"),
                        rs.getString("created_by"),
                        rs.getString("backup_type"),
                        rs.getBoolean("includes_worlds"),
                        rs.getBoolean("includes_plugins"),
                        rs.getBoolean("includes_configs"),
                        rs.getString("notes")
                    );
                    backups.add(info);
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error listing backups: " + e.getMessage());
        }

        return backups;
    }

    /**
     * Get backup by ID
     */
    public BackupInfo getBackup(int id) {
        try {
            String query = "SELECT * FROM backups WHERE id = ?";
            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setInt(1, id);
                ResultSet rs = stmt.executeQuery();

                if (rs.next()) {
                    return new BackupInfo(
                        rs.getInt("id"),
                        rs.getString("filename"),
                        rs.getString("file_path"),
                        rs.getLong("size_bytes"),
                        rs.getLong("created_at"),
                        rs.getString("created_by"),
                        rs.getString("backup_type"),
                        rs.getBoolean("includes_worlds"),
                        rs.getBoolean("includes_plugins"),
                        rs.getBoolean("includes_configs"),
                        rs.getString("notes")
                    );
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error getting backup: " + e.getMessage());
        }

        return null;
    }

    /**
     * Get backup file for download
     */
    public File getBackupFile(int id) {
        BackupInfo backup = getBackup(id);
        if (backup != null) {
            File file = new File(backup.filePath);
            if (file.exists()) {
                return file;
            }
        }
        return null;
    }

    /**
     * Delete a backup
     */
    public boolean deleteBackup(int id, String username) {
        BackupInfo backup = getBackup(id);
        if (backup == null) {
            return false;
        }

        try {
            // Delete file
            File file = new File(backup.filePath);
            if (file.exists()) {
                file.delete();
            }

            // Delete from database
            String query = "DELETE FROM backups WHERE id = ?";
            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
            }

            // Log audit
            if (plugin.getAuditLogger() != null) {
                plugin.getAuditLogger().logUserAction(username, "delete-backup",
                    "Deleted backup: " + backup.filename);
            }

            plugin.getLogger().info("Backup deleted: " + backup.filename + " by " + username);
            return true;

        } catch (SQLException e) {
            plugin.getLogger().warning("Error deleting backup: " + e.getMessage());
            return false;
        }
    }

    /**
     * Apply retention policy - delete old backups based on settings
     */
    public void applyRetentionPolicy(String retentionType, int retentionValue) {
        if (retentionType == null || retentionValue <= 0) return;

        try {
            if ("keep-last".equals(retentionType)) {
                // Keep only the last N backups
                String query = """
                    DELETE FROM backups WHERE id NOT IN (
                        SELECT id FROM backups ORDER BY created_at DESC LIMIT ?
                    )
                """;

                // Get backups to delete for file cleanup
                String selectQuery = """
                    SELECT file_path FROM backups WHERE id NOT IN (
                        SELECT id FROM backups ORDER BY created_at DESC LIMIT ?
                    )
                """;

                try (PreparedStatement selectStmt = databaseManager.getConnection().prepareStatement(selectQuery)) {
                    selectStmt.setInt(1, retentionValue);
                    ResultSet rs = selectStmt.executeQuery();

                    while (rs.next()) {
                        File file = new File(rs.getString("file_path"));
                        if (file.exists()) {
                            file.delete();
                            plugin.getLogger().info("Retention policy: deleted old backup " + file.getName());
                        }
                    }
                }

                try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                    stmt.setInt(1, retentionValue);
                    int deleted = stmt.executeUpdate();
                    if (deleted > 0) {
                        plugin.getLogger().info("Retention policy: cleaned up " + deleted + " old backup records");
                    }
                }

            } else if ("delete-older".equals(retentionType)) {
                // Delete backups older than N days
                long cutoffTime = System.currentTimeMillis() - ((long) retentionValue * 24 * 60 * 60 * 1000);

                // Get backups to delete for file cleanup
                String selectQuery = "SELECT file_path FROM backups WHERE created_at < ?";

                try (PreparedStatement selectStmt = databaseManager.getConnection().prepareStatement(selectQuery)) {
                    selectStmt.setLong(1, cutoffTime);
                    ResultSet rs = selectStmt.executeQuery();

                    while (rs.next()) {
                        File file = new File(rs.getString("file_path"));
                        if (file.exists()) {
                            file.delete();
                            plugin.getLogger().info("Retention policy: deleted old backup " + file.getName());
                        }
                    }
                }

                String query = "DELETE FROM backups WHERE created_at < ?";
                try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                    stmt.setLong(1, cutoffTime);
                    int deleted = stmt.executeUpdate();
                    if (deleted > 0) {
                        plugin.getLogger().info("Retention policy: cleaned up " + deleted + " old backup records");
                    }
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error applying retention policy: " + e.getMessage());
        }
    }

    /**
     * Scan existing backups directory and import to DB if not already tracked
     */
    private void scanExistingBackups() {
        File[] files = backupDir.listFiles((dir, name) -> name.endsWith(".zip"));
        if (files == null) return;

        for (File file : files) {
            try {
                // Check if already in DB
                String query = "SELECT id FROM backups WHERE filename = ?";
                try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                    stmt.setString(1, file.getName());
                    ResultSet rs = stmt.executeQuery();

                    if (!rs.next()) {
                        // Not in DB, add it
                        String backupType = file.getName().startsWith("update-") ? "update" :
                                           file.getName().startsWith("server-backup-") ? "update" : "manual";

                        BackupOptions options = new BackupOptions(true, true, true); // Assume all content for legacy backups
                        recordBackup(file.getName(), file.getAbsolutePath(), file.length(),
                                    "system-import", backupType, options);
                        plugin.getLogger().info("Imported existing backup to database: " + file.getName());
                    }
                }
            } catch (SQLException e) {
                plugin.getLogger().warning("Error importing backup " + file.getName() + ": " + e.getMessage());
            }
        }
    }

    // ===== Auto-Backup Schedule Management =====

    /**
     * Get all auto-backup schedules
     */
    public List<AutoBackupSchedule> getAutoBackupSchedules() {
        List<AutoBackupSchedule> schedules = new ArrayList<>();

        try {
            String query = "SELECT * FROM auto_backup_schedules ORDER BY created_at DESC";
            try (Statement stmt = databaseManager.getConnection().createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {

                while (rs.next()) {
                    AutoBackupSchedule schedule = new AutoBackupSchedule(
                        rs.getInt("id"),
                        rs.getBoolean("enabled"),
                        rs.getString("schedule_type"),
                        rs.getInt("interval_value"),
                        rs.getString("cron_expression"),
                        rs.getBoolean("includes_worlds"),
                        rs.getBoolean("includes_plugins"),
                        rs.getBoolean("includes_configs"),
                        rs.getString("retention_type"),
                        rs.getInt("retention_value"),
                        rs.getLong("last_run"),
                        rs.getLong("next_run"),
                        rs.getString("created_by"),
                        rs.getLong("created_at"),
                        rs.getLong("updated_at")
                    );
                    schedules.add(schedule);
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error listing auto-backup schedules: " + e.getMessage());
        }

        return schedules;
    }

    /**
     * Create or update an auto-backup schedule
     */
    public boolean saveAutoBackupSchedule(AutoBackupSchedule schedule, String username) {
        try {
            long now = System.currentTimeMillis();
            long nextRun = calculateNextRun(schedule.scheduleType, schedule.intervalValue);

            if (schedule.id > 0) {
                // Update existing
                String query = """
                    UPDATE auto_backup_schedules SET
                        enabled = ?, schedule_type = ?, interval_value = ?, cron_expression = ?,
                        includes_worlds = ?, includes_plugins = ?, includes_configs = ?,
                        retention_type = ?, retention_value = ?, next_run = ?, updated_at = ?
                    WHERE id = ?
                """;

                try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                    stmt.setBoolean(1, schedule.enabled);
                    stmt.setString(2, schedule.scheduleType);
                    stmt.setInt(3, schedule.intervalValue);
                    stmt.setString(4, schedule.cronExpression);
                    stmt.setBoolean(5, schedule.includesWorlds);
                    stmt.setBoolean(6, schedule.includesPlugins);
                    stmt.setBoolean(7, schedule.includesConfigs);
                    stmt.setString(8, schedule.retentionType);
                    stmt.setInt(9, schedule.retentionValue);
                    stmt.setLong(10, nextRun);
                    stmt.setLong(11, now);
                    stmt.setInt(12, schedule.id);
                    stmt.executeUpdate();
                }
            } else {
                // Create new
                String query = """
                    INSERT INTO auto_backup_schedules (enabled, schedule_type, interval_value, cron_expression,
                        includes_worlds, includes_plugins, includes_configs, retention_type, retention_value,
                        next_run, created_by, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

                try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                    stmt.setBoolean(1, schedule.enabled);
                    stmt.setString(2, schedule.scheduleType);
                    stmt.setInt(3, schedule.intervalValue);
                    stmt.setString(4, schedule.cronExpression);
                    stmt.setBoolean(5, schedule.includesWorlds);
                    stmt.setBoolean(6, schedule.includesPlugins);
                    stmt.setBoolean(7, schedule.includesConfigs);
                    stmt.setString(8, schedule.retentionType);
                    stmt.setInt(9, schedule.retentionValue);
                    stmt.setLong(10, nextRun);
                    stmt.setString(11, username);
                    stmt.setLong(12, now);
                    stmt.setLong(13, now);
                    stmt.executeUpdate();
                }
            }

            // Log audit
            if (plugin.getAuditLogger() != null) {
                plugin.getAuditLogger().logUserAction(username, "save-auto-backup-schedule",
                    "Saved auto-backup schedule: " + schedule.scheduleType);
            }

            return true;

        } catch (SQLException e) {
            plugin.getLogger().warning("Error saving auto-backup schedule: " + e.getMessage());
            return false;
        }
    }

    /**
     * Delete an auto-backup schedule
     */
    public boolean deleteAutoBackupSchedule(int id, String username) {
        try {
            String query = "DELETE FROM auto_backup_schedules WHERE id = ?";
            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setInt(1, id);
                int deleted = stmt.executeUpdate();

                if (deleted > 0) {
                    if (plugin.getAuditLogger() != null) {
                        plugin.getAuditLogger().logUserAction(username, "delete-auto-backup-schedule",
                            "Deleted auto-backup schedule ID: " + id);
                    }
                    return true;
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error deleting auto-backup schedule: " + e.getMessage());
        }
        return false;
    }

    // ===== Data Classes =====

    /**
     * Backup creation options
     */
    public static class BackupOptions {
        public final boolean includesWorlds;
        public final boolean includesPlugins;
        public final boolean includesConfigs;

        public BackupOptions(boolean includesWorlds, boolean includesPlugins, boolean includesConfigs) {
            this.includesWorlds = includesWorlds;
            this.includesPlugins = includesPlugins;
            this.includesConfigs = includesConfigs;
        }
    }

    /**
     * Result of a backup operation
     */
    public static class BackupResult {
        public final boolean success;
        public final String message;
        public final String filename;
        public final long sizeBytes;

        public BackupResult(boolean success, String message, String filename, long sizeBytes) {
            this.success = success;
            this.message = message;
            this.filename = filename;
            this.sizeBytes = sizeBytes;
        }
    }

    /**
     * Backup metadata
     */
    public static class BackupInfo {
        public final int id;
        public final String filename;
        public final String filePath;
        public final long sizeBytes;
        public final long createdAt;
        public final String createdBy;
        public final String backupType;
        public final boolean includesWorlds;
        public final boolean includesPlugins;
        public final boolean includesConfigs;
        public final String notes;

        public BackupInfo(int id, String filename, String filePath, long sizeBytes, long createdAt,
                         String createdBy, String backupType, boolean includesWorlds,
                         boolean includesPlugins, boolean includesConfigs, String notes) {
            this.id = id;
            this.filename = filename;
            this.filePath = filePath;
            this.sizeBytes = sizeBytes;
            this.createdAt = createdAt;
            this.createdBy = createdBy;
            this.backupType = backupType;
            this.includesWorlds = includesWorlds;
            this.includesPlugins = includesPlugins;
            this.includesConfigs = includesConfigs;
            this.notes = notes;
        }
    }

    /**
     * Auto-backup schedule data
     */
    public static class AutoBackupSchedule {
        public int id;
        public boolean enabled;
        public String scheduleType;
        public int intervalValue;
        public String cronExpression;
        public boolean includesWorlds;
        public boolean includesPlugins;
        public boolean includesConfigs;
        public String retentionType;
        public int retentionValue;
        public long lastRun;
        public long nextRun;
        public String createdBy;
        public long createdAt;
        public long updatedAt;

        public AutoBackupSchedule() {}

        public AutoBackupSchedule(int id, boolean enabled, String scheduleType, int intervalValue,
                                  String cronExpression, boolean includesWorlds, boolean includesPlugins,
                                  boolean includesConfigs, String retentionType, int retentionValue,
                                  long lastRun, long nextRun, String createdBy, long createdAt, long updatedAt) {
            this.id = id;
            this.enabled = enabled;
            this.scheduleType = scheduleType;
            this.intervalValue = intervalValue;
            this.cronExpression = cronExpression;
            this.includesWorlds = includesWorlds;
            this.includesPlugins = includesPlugins;
            this.includesConfigs = includesConfigs;
            this.retentionType = retentionType;
            this.retentionValue = retentionValue;
            this.lastRun = lastRun;
            this.nextRun = nextRun;
            this.createdBy = createdBy;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }
}
