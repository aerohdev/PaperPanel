package de.kaicraft.adminpanel.model;

import de.kaicraft.adminpanel.util.TypeScriptType;

/**
 * Update status response model
 */
@TypeScriptType
public class UpdateStatus {
    private boolean updateAvailable;
    private boolean updateDownloaded;
    private String currentVersion;
    private String latestVersion;
    private String latestBuild;
    private String downloadUrl;
    private long lastCheck;
    private boolean needsCheck;
    private String backupStatus; // idle, running, completed, failed, skipped
    private int backupProgress; // 0-100

    public UpdateStatus(boolean updateAvailable, boolean updateDownloaded, String currentVersion,
                       String latestVersion, String latestBuild, String downloadUrl,
                       long lastCheck, boolean needsCheck, String backupStatus, int backupProgress) {
        this.updateAvailable = updateAvailable;
        this.updateDownloaded = updateDownloaded;
        this.currentVersion = currentVersion;
        this.latestVersion = latestVersion;
        this.latestBuild = latestBuild;
        this.downloadUrl = downloadUrl;
        this.lastCheck = lastCheck;
        this.needsCheck = needsCheck;
        this.backupStatus = backupStatus;
        this.backupProgress = backupProgress;
    }

    // Getters
    public boolean isUpdateAvailable() { return updateAvailable; }
    public boolean isUpdateDownloaded() { return updateDownloaded; }
    public String getCurrentVersion() { return currentVersion; }
    public String getLatestVersion() { return latestVersion; }
    public String getLatestBuild() { return latestBuild; }
    public String getDownloadUrl() { return downloadUrl; }
    public long getLastCheck() { return lastCheck; }
    public boolean isNeedsCheck() { return needsCheck; }
    public String getBackupStatus() { return backupStatus; }
    public int getBackupProgress() { return backupProgress; }
}
