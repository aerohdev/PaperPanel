package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.backup.BackupManager;
import de.kaicraft.adminpanel.backup.BackupManager.*;
import io.javalin.http.Context;

import java.io.File;
import java.io.FileInputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * API endpoints for backup management
 */
public class BackupAPI {
    private final ServerAdminPanelPlugin plugin;
    private final BackupManager backupManager;
    private final Gson gson;

    public BackupAPI(ServerAdminPanelPlugin plugin, BackupManager backupManager) {
        this.plugin = plugin;
        this.backupManager = backupManager;
        this.gson = new Gson();
    }

    /**
     * GET /api/v1/backups - List all backups
     */
    public void listBackups(Context ctx) {
        try {
            List<BackupInfo> backups = backupManager.listBackups();

            List<Map<String, Object>> backupList = backups.stream().map(b -> Map.<String, Object>of(
                "id", b.id,
                "filename", b.filename,
                "sizeBytes", b.sizeBytes,
                "sizeMB", Math.round(b.sizeBytes / 1024.0 / 1024.0 * 100) / 100.0,
                "createdAt", b.createdAt,
                "createdBy", b.createdBy != null ? b.createdBy : "unknown",
                "backupType", b.backupType,
                "includesWorlds", b.includesWorlds,
                "includesPlugins", b.includesPlugins,
                "includesConfigs", b.includesConfigs
            )).collect(Collectors.toList());

            ctx.json(Map.of(
                "success", true,
                "backups", backupList
            ));
        } catch (Exception e) {
            plugin.getLogger().warning("Error listing backups: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to list backups: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/v1/backups/create - Create a manual backup
     */
    public void createBackup(Context ctx) {
        try {
            JsonObject body = gson.fromJson(ctx.body(), JsonObject.class);

            boolean includesWorlds = body.has("includesWorlds") && body.get("includesWorlds").getAsBoolean();
            boolean includesPlugins = body.has("includesPlugins") && body.get("includesPlugins").getAsBoolean();
            boolean includesConfigs = body.has("includesConfigs") && body.get("includesConfigs").getAsBoolean();

            // At least one must be selected
            if (!includesWorlds && !includesPlugins && !includesConfigs) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "error", "At least one backup content type must be selected"
                ));
                return;
            }

            String username = ctx.attribute("username");
            if (username == null) username = "unknown";

            BackupOptions options = new BackupOptions(includesWorlds, includesPlugins, includesConfigs);

            // Run backup asynchronously
            String finalUsername = username;
            plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                BackupResult result = backupManager.createBackup(options, finalUsername);

                // We can't respond after async, but the backup is created
                if (result.success) {
                    plugin.getLogger().info("Backup created successfully: " + result.filename);
                } else {
                    plugin.getLogger().warning("Backup failed: " + result.message);
                }
            });

            ctx.json(Map.of(
                "success", true,
                "message", "Backup creation started",
                "status", "creating"
            ));

        } catch (Exception e) {
            plugin.getLogger().warning("Error creating backup: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to create backup: " + e.getMessage()
            ));
        }
    }

    /**
     * GET /api/v1/backups/{id} - Get backup details
     */
    public void getBackup(Context ctx) {
        try {
            int id = Integer.parseInt(ctx.pathParam("id"));
            BackupInfo backup = backupManager.getBackup(id);

            if (backup == null) {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "error", "Backup not found"
                ));
                return;
            }

            ctx.json(Map.of(
                "success", true,
                "backup", Map.of(
                    "id", backup.id,
                    "filename", backup.filename,
                    "sizeBytes", backup.sizeBytes,
                    "sizeMB", Math.round(backup.sizeBytes / 1024.0 / 1024.0 * 100) / 100.0,
                    "createdAt", backup.createdAt,
                    "createdBy", backup.createdBy != null ? backup.createdBy : "unknown",
                    "backupType", backup.backupType,
                    "includesWorlds", backup.includesWorlds,
                    "includesPlugins", backup.includesPlugins,
                    "includesConfigs", backup.includesConfigs
                )
            ));
        } catch (NumberFormatException e) {
            ctx.status(400).json(Map.of(
                "success", false,
                "error", "Invalid backup ID"
            ));
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting backup: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to get backup: " + e.getMessage()
            ));
        }
    }

    /**
     * DELETE /api/v1/backups/{id} - Delete a backup
     */
    public void deleteBackup(Context ctx) {
        try {
            int id = Integer.parseInt(ctx.pathParam("id"));
            String username = ctx.attribute("username");
            if (username == null) username = "unknown";

            boolean deleted = backupManager.deleteBackup(id, username);

            if (deleted) {
                ctx.json(Map.of(
                    "success", true,
                    "message", "Backup deleted successfully"
                ));
            } else {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "error", "Backup not found or could not be deleted"
                ));
            }
        } catch (NumberFormatException e) {
            ctx.status(400).json(Map.of(
                "success", false,
                "error", "Invalid backup ID"
            ));
        } catch (Exception e) {
            plugin.getLogger().warning("Error deleting backup: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to delete backup: " + e.getMessage()
            ));
        }
    }

    /**
     * GET /api/v1/backups/{id}/download - Download backup as ZIP
     */
    public void downloadBackup(Context ctx) {
        try {
            int id = Integer.parseInt(ctx.pathParam("id"));
            BackupInfo backup = backupManager.getBackup(id);

            if (backup == null) {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "error", "Backup not found"
                ));
                return;
            }

            File file = backupManager.getBackupFile(id);
            if (file == null || !file.exists()) {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "error", "Backup file not found on disk"
                ));
                return;
            }

            String username = ctx.attribute("username");
            if (username != null && plugin.getAuditLogger() != null) {
                plugin.getAuditLogger().logUserAction(username, "download-backup",
                    "Downloaded backup: " + backup.filename);
            }

            ctx.header("Content-Disposition", "attachment; filename=\"" + backup.filename + "\"");
            ctx.header("Content-Length", String.valueOf(file.length()));
            ctx.contentType("application/zip");
            ctx.result(new FileInputStream(file));

        } catch (NumberFormatException e) {
            ctx.status(400).json(Map.of(
                "success", false,
                "error", "Invalid backup ID"
            ));
        } catch (Exception e) {
            plugin.getLogger().warning("Error downloading backup: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to download backup: " + e.getMessage()
            ));
        }
    }

    /**
     * GET /api/v1/backups/schedules - Get all auto-backup schedules
     */
    public void getSchedules(Context ctx) {
        try {
            List<AutoBackupSchedule> schedules = backupManager.getAutoBackupSchedules();

            List<Map<String, Object>> scheduleList = schedules.stream().map(s -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", s.id);
                map.put("enabled", s.enabled);
                map.put("scheduleType", s.scheduleType);
                map.put("intervalValue", s.intervalValue);
                map.put("includesWorlds", s.includesWorlds);
                map.put("includesPlugins", s.includesPlugins);
                map.put("includesConfigs", s.includesConfigs);
                map.put("retentionType", s.retentionType != null ? s.retentionType : "");
                map.put("retentionValue", s.retentionValue);
                map.put("lastRun", s.lastRun);
                map.put("nextRun", s.nextRun);
                map.put("createdBy", s.createdBy != null ? s.createdBy : "unknown");
                map.put("createdAt", s.createdAt);
                return map;
            }).collect(Collectors.toList());

            ctx.json(Map.of(
                "success", true,
                "schedules", scheduleList
            ));
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting schedules: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to get schedules: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/v1/backups/schedules - Create or update auto-backup schedule
     */
    public void saveSchedule(Context ctx) {
        try {
            JsonObject body = gson.fromJson(ctx.body(), JsonObject.class);

            AutoBackupSchedule schedule = new AutoBackupSchedule();
            schedule.id = body.has("id") ? body.get("id").getAsInt() : 0;
            schedule.enabled = !body.has("enabled") || body.get("enabled").getAsBoolean();
            schedule.scheduleType = body.has("scheduleType") ? body.get("scheduleType").getAsString() : "daily";
            schedule.intervalValue = body.has("intervalValue") ? body.get("intervalValue").getAsInt() : 24;
            schedule.cronExpression = body.has("cronExpression") ? body.get("cronExpression").getAsString() : null;
            schedule.includesWorlds = !body.has("includesWorlds") || body.get("includesWorlds").getAsBoolean();
            schedule.includesPlugins = !body.has("includesPlugins") || body.get("includesPlugins").getAsBoolean();
            schedule.includesConfigs = !body.has("includesConfigs") || body.get("includesConfigs").getAsBoolean();
            schedule.retentionType = body.has("retentionType") ? body.get("retentionType").getAsString() : null;
            schedule.retentionValue = body.has("retentionValue") ? body.get("retentionValue").getAsInt() : 0;

            String username = ctx.attribute("username");
            if (username == null) username = "unknown";

            boolean saved = backupManager.saveAutoBackupSchedule(schedule, username);

            if (saved) {
                ctx.json(Map.of(
                    "success", true,
                    "message", schedule.id > 0 ? "Schedule updated successfully" : "Schedule created successfully"
                ));
            } else {
                ctx.status(500).json(Map.of(
                    "success", false,
                    "error", "Failed to save schedule"
                ));
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error saving schedule: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to save schedule: " + e.getMessage()
            ));
        }
    }

    /**
     * DELETE /api/v1/backups/schedules/{id} - Delete auto-backup schedule
     */
    public void deleteSchedule(Context ctx) {
        try {
            int id = Integer.parseInt(ctx.pathParam("id"));
            String username = ctx.attribute("username");
            if (username == null) username = "unknown";

            boolean deleted = backupManager.deleteAutoBackupSchedule(id, username);

            if (deleted) {
                ctx.json(Map.of(
                    "success", true,
                    "message", "Schedule deleted successfully"
                ));
            } else {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "error", "Schedule not found"
                ));
            }
        } catch (NumberFormatException e) {
            ctx.status(400).json(Map.of(
                "success", false,
                "error", "Invalid schedule ID"
            ));
        } catch (Exception e) {
            plugin.getLogger().warning("Error deleting schedule: " + e.getMessage());
            ctx.status(500).json(Map.of(
                "success", false,
                "error", "Failed to delete schedule: " + e.getMessage()
            ));
        }
    }
}
