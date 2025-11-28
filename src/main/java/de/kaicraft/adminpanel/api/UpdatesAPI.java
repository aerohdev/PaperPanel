package de.kaicraft.adminpanel.api;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import de.kaicraft.adminpanel.ServerAdminPanelPlugin;
import de.kaicraft.adminpanel.backup.BackupManager;
import de.kaicraft.adminpanel.database.DatabaseManager;
import de.kaicraft.adminpanel.model.UpdateStatus;
import de.kaicraft.adminpanel.update.PaperVersionChecker;
import de.kaicraft.adminpanel.util.ApiResponse;
import io.javalin.http.Context;

import java.sql.*;
import java.util.*;

/**
 * API endpoints for update management and history
 */
public class UpdatesAPI {
    private final ServerAdminPanelPlugin plugin;
    private final DatabaseManager databaseManager;
    private final BackupManager backupManager;
    private final Gson gson;
    private int schedulerTaskId = -1;

    public UpdatesAPI(ServerAdminPanelPlugin plugin, DatabaseManager databaseManager, BackupManager backupManager) {
        this.plugin = plugin;
        this.databaseManager = databaseManager;
        this.backupManager = backupManager;
        this.gson = new Gson();
    }

    /**
     * Start the scheduler to check for scheduled updates
     */
    public void startScheduler() {
        schedulerTaskId = plugin.getServer().getScheduler().runTaskTimerAsynchronously(
            plugin,
            this::checkScheduledUpdates,
            20L * 60,  // 1 minute initial delay
            20L * 60   // 1 minute period
        ).getTaskId();

        plugin.getLogger().info("Update scheduler started");
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
     * Check for pending scheduled updates
     */
    private void checkScheduledUpdates() {
        try {
            long currentTime = System.currentTimeMillis();

            String query = "SELECT * FROM scheduled_updates WHERE status = 'pending' AND scheduled_time <= ?";
            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setLong(1, currentTime);
                ResultSet rs = stmt.executeQuery();

                while (rs.next()) {
                    int id = rs.getInt("id");
                    String version = rs.getString("version");
                    int buildNumber = rs.getInt("build_number");
                    String createdBy = rs.getString("created_by");

                    plugin.getLogger().info("Executing scheduled update: " + version + " build #" + buildNumber);

                    // Mark as executing
                    updateScheduledUpdateStatus(id, "executing", null);

                    // Run installation on main thread
                    plugin.getServer().getScheduler().runTask(plugin, () -> {
                        try {
                            PaperVersionChecker checker = plugin.getVersionChecker();

                            // Record the update history before installation
                            recordUpdateHistory(checker, createdBy, true, null);

                            // Execute installation
                            checker.installUpdate().thenAccept(result -> {
                                if (result.success) {
                                    updateScheduledUpdateStatus(id, "completed", System.currentTimeMillis());
                                } else {
                                    updateScheduledUpdateStatus(id, "failed", System.currentTimeMillis());
                                }
                            });
                        } catch (Exception e) {
                            plugin.getLogger().warning("Scheduled update failed: " + e.getMessage());
                            updateScheduledUpdateStatus(id, "failed", System.currentTimeMillis());
                        }
                    });
                }
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error checking scheduled updates: " + e.getMessage());
        }
    }

    /**
     * Update the status of a scheduled update
     */
    private void updateScheduledUpdateStatus(int id, String status, Long executedAt) {
        try {
            String query = "UPDATE scheduled_updates SET status = ?, executed_at = ? WHERE id = ?";
            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setString(1, status);
                if (executedAt != null) {
                    stmt.setLong(2, executedAt);
                } else {
                    stmt.setNull(2, Types.INTEGER);
                }
                stmt.setInt(3, id);
                stmt.executeUpdate();
            }
        } catch (SQLException e) {
            plugin.getLogger().warning("Error updating scheduled update status: " + e.getMessage());
        }
    }

    /**
     * GET /api/v1/updates/status - Get current update status
     */
    public void getStatus(Context ctx) {
        try {
            PaperVersionChecker checker = plugin.getVersionChecker();
            PaperVersionChecker.UpdateStatus status = checker.getStatus();

            UpdateStatus updateStatus = new UpdateStatus(
                status.updateAvailable,
                status.updateDownloaded,
                status.currentVersion,
                status.latestVersion,
                status.latestBuild,
                status.downloadUrl,
                status.lastCheck,
                status.needsCheck
            );

            ctx.json(ApiResponse.success("updateStatus", updateStatus));

        } catch (Exception e) {
            plugin.getLogger().warning("Error getting update status: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to get update status"));
        }
    }

    /**
     * POST /api/v1/updates/check - Check for updates
     */
    public void checkForUpdates(Context ctx) {
        try {
            String username = ctx.attribute("username");
            if (plugin.getAuditLogger() != null) {
                plugin.getAuditLogger().logUserAction(username, "check-updates", "Initiated manual update check");
            }

            PaperVersionChecker checker = plugin.getVersionChecker();
            checker.checkForUpdates().thenAccept(updateAvailable -> {
                plugin.getLogger().info("Update check complete. Update available: " + updateAvailable);
            });

            ctx.json(ApiResponse.successMessage("Update check started"));

        } catch (Exception e) {
            plugin.getLogger().warning("Error checking for updates: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to check for updates"));
        }
    }

    /**
     * POST /api/v1/updates/download - Download update
     */
    public void downloadUpdate(Context ctx) {
        try {
            String username = ctx.attribute("username");

            PaperVersionChecker checker = plugin.getVersionChecker();
            PaperVersionChecker.UpdateStatus status = checker.getStatus();

            if (!status.updateAvailable) {
                ctx.status(400).json(ApiResponse.error("No update available"));
                return;
            }

            if (plugin.getAuditLogger() != null) {
                plugin.getAuditLogger().logUserAction(username, "download-update",
                    "Started download of build #" + status.latestBuild);
            }

            checker.downloadUpdate().thenAccept(result -> {
                if (result.success) {
                    plugin.getLogger().info("Update download completed");
                } else {
                    plugin.getLogger().warning("Update download failed: " + result.message);
                }
            });

            ctx.json(ApiResponse.successMessage("Update download started. Check server logs for progress."));

        } catch (Exception e) {
            plugin.getLogger().warning("Error downloading update: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to start download"));
        }
    }

    /**
     * POST /api/v1/updates/install - Install update immediately
     */
    public void installUpdate(Context ctx) {
        try {
            String username = ctx.attribute("username");

            PaperVersionChecker checker = plugin.getVersionChecker();
            PaperVersionChecker.UpdateStatus status = checker.getStatus();

            if (!status.updateDownloaded) {
                ctx.status(400).json(ApiResponse.error("Update not downloaded yet"));
                return;
            }

            if (plugin.getAuditLogger() != null) {
                plugin.getAuditLogger().logSecurityEvent(username, "install-update",
                    true);
            }

            // Record update history
            recordUpdateHistory(checker, username, true, null);

            checker.installUpdate().thenAccept(result -> {
                if (result.success) {
                    plugin.getLogger().info("Update installation started");
                } else {
                    plugin.getLogger().warning("Update installation failed: " + result.message);
                }
            });

            ctx.json(ApiResponse.successMessage("Update installation started. Server will restart in 5 minutes."));

        } catch (Exception e) {
            plugin.getLogger().warning("Error installing update: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to start installation"));
        }
    }

    /**
     * GET /api/v1/updates/history - Get update history
     */
    public void getHistory(Context ctx) {
        try {
            List<Map<String, Object>> history = new ArrayList<>();

            String query = "SELECT * FROM update_history ORDER BY updated_at DESC LIMIT 50";
            try (Statement stmt = databaseManager.getConnection().createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {

                while (rs.next()) {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("id", rs.getInt("id"));
                    entry.put("fromVersion", rs.getString("from_version"));
                    entry.put("fromBuild", rs.getInt("from_build"));
                    entry.put("toVersion", rs.getString("to_version"));
                    entry.put("toBuild", rs.getInt("to_build"));
                    entry.put("updatedAt", rs.getLong("updated_at"));
                    entry.put("updatedBy", rs.getString("updated_by"));
                    entry.put("backupCreated", rs.getBoolean("backup_created"));
                    entry.put("backupFilename", rs.getString("backup_filename"));
                    entry.put("success", rs.getBoolean("success"));
                    entry.put("notes", rs.getString("notes"));
                    history.add(entry);
                }
            }

            ctx.json(Map.of(
                "success", true,
                "history", history
            ));

        } catch (SQLException e) {
            plugin.getLogger().warning("Error getting update history: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to get update history"));
        }
    }

    /**
     * POST /api/v1/updates/schedule - Schedule an update for later
     */
    public void scheduleUpdate(Context ctx) {
        try {
            JsonObject body = gson.fromJson(ctx.body(), JsonObject.class);

            if (!body.has("scheduledTime")) {
                ctx.status(400).json(ApiResponse.error("scheduledTime is required"));
                return;
            }

            long scheduledTime = body.get("scheduledTime").getAsLong();

            if (scheduledTime <= System.currentTimeMillis()) {
                ctx.status(400).json(ApiResponse.error("Scheduled time must be in the future"));
                return;
            }

            PaperVersionChecker checker = plugin.getVersionChecker();
            PaperVersionChecker.UpdateStatus status = checker.getStatus();

            if (!status.updateAvailable && !status.updateDownloaded) {
                ctx.status(400).json(ApiResponse.error("No update available to schedule"));
                return;
            }

            String username = ctx.attribute("username");
            if (username == null) username = "unknown";

            String notes = body.has("notes") ? body.get("notes").getAsString() : null;

            // Insert scheduled update
            String query = """
                INSERT INTO scheduled_updates (scheduled_time, version, build_number, created_by, created_at, status, notes)
                VALUES (?, ?, ?, ?, ?, 'pending', ?)
            """;

            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query,
                    Statement.RETURN_GENERATED_KEYS)) {
                stmt.setLong(1, scheduledTime);
                stmt.setString(2, status.latestVersion);
                stmt.setInt(3, Integer.parseInt(status.latestBuild));
                stmt.setString(4, username);
                stmt.setLong(5, System.currentTimeMillis());
                stmt.setString(6, notes);
                stmt.executeUpdate();

                ResultSet keys = stmt.getGeneratedKeys();
                int id = keys.next() ? keys.getInt(1) : -1;

                if (plugin.getAuditLogger() != null) {
                    plugin.getAuditLogger().logUserAction(username, "schedule-update",
                        "Scheduled update to build #" + status.latestBuild + " for " + new java.util.Date(scheduledTime));
                }

                ctx.json(Map.of(
                    "success", true,
                    "message", "Update scheduled successfully",
                    "id", id,
                    "scheduledTime", scheduledTime
                ));
            }

        } catch (SQLException e) {
            plugin.getLogger().warning("Error scheduling update: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to schedule update"));
        } catch (Exception e) {
            plugin.getLogger().warning("Error scheduling update: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to schedule update: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v1/updates/scheduled - Get all scheduled updates
     */
    public void getScheduledUpdates(Context ctx) {
        try {
            List<Map<String, Object>> updates = new ArrayList<>();

            String query = "SELECT * FROM scheduled_updates WHERE status IN ('pending', 'executing') ORDER BY scheduled_time ASC";
            try (Statement stmt = databaseManager.getConnection().createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {

                while (rs.next()) {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("id", rs.getInt("id"));
                    entry.put("scheduledTime", rs.getLong("scheduled_time"));
                    entry.put("version", rs.getString("version"));
                    entry.put("buildNumber", rs.getInt("build_number"));
                    entry.put("createdBy", rs.getString("created_by"));
                    entry.put("createdAt", rs.getLong("created_at"));
                    entry.put("status", rs.getString("status"));
                    entry.put("notes", rs.getString("notes"));
                    updates.add(entry);
                }
            }

            ctx.json(Map.of(
                "success", true,
                "scheduledUpdates", updates
            ));

        } catch (SQLException e) {
            plugin.getLogger().warning("Error getting scheduled updates: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to get scheduled updates"));
        }
    }

    /**
     * DELETE /api/v1/updates/schedule/{id} - Cancel a scheduled update
     */
    public void cancelScheduledUpdate(Context ctx) {
        try {
            int id = Integer.parseInt(ctx.pathParam("id"));
            String username = ctx.attribute("username");
            if (username == null) username = "unknown";

            String query = "UPDATE scheduled_updates SET status = 'cancelled', cancelled_at = ? WHERE id = ? AND status = 'pending'";
            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setLong(1, System.currentTimeMillis());
                stmt.setInt(2, id);
                int updated = stmt.executeUpdate();

                if (updated > 0) {
                    if (plugin.getAuditLogger() != null) {
                        plugin.getAuditLogger().logUserAction(username, "cancel-scheduled-update",
                            "Cancelled scheduled update ID: " + id);
                    }

                    ctx.json(Map.of(
                        "success", true,
                        "message", "Scheduled update cancelled"
                    ));
                } else {
                    ctx.status(404).json(ApiResponse.error("Scheduled update not found or already executed"));
                }
            }

        } catch (NumberFormatException e) {
            ctx.status(400).json(ApiResponse.error("Invalid ID"));
        } catch (SQLException e) {
            plugin.getLogger().warning("Error cancelling scheduled update: " + e.getMessage());
            ctx.status(500).json(ApiResponse.error("Failed to cancel scheduled update"));
        }
    }

    /**
     * Record update in history
     */
    public void recordUpdateHistory(PaperVersionChecker checker, String username,
                                     boolean backupCreated, String backupFilename) {
        try {
            PaperVersionChecker.UpdateStatus status = checker.getStatus();

            // Extract current build number from version string
            int fromBuild = 0;
            if (status.currentVersion != null) {
                try {
                    String buildStr = status.currentVersion.replaceAll(".*#(\\d+).*", "$1");
                    fromBuild = Integer.parseInt(buildStr);
                } catch (Exception ignored) {}
            }

            String query = """
                INSERT INTO update_history (from_version, from_build, to_version, to_build,
                    updated_at, updated_by, backup_created, backup_filename, success)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

            try (PreparedStatement stmt = databaseManager.getConnection().prepareStatement(query)) {
                stmt.setString(1, status.currentVersion);
                stmt.setInt(2, fromBuild);
                stmt.setString(3, status.latestVersion);
                stmt.setInt(4, Integer.parseInt(status.latestBuild));
                stmt.setLong(5, System.currentTimeMillis());
                stmt.setString(6, username);
                stmt.setBoolean(7, backupCreated);
                stmt.setString(8, backupFilename);
                stmt.setBoolean(9, true);
                stmt.executeUpdate();
            }

        } catch (SQLException e) {
            plugin.getLogger().warning("Error recording update history: " + e.getMessage());
        }
    }
}
