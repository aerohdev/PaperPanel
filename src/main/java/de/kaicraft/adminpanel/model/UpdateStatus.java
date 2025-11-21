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
    private int latestBuild;
    private String downloadUrl;
    private long lastCheck;
    private boolean needsCheck;
    
    public UpdateStatus(boolean updateAvailable, boolean updateDownloaded, String currentVersion,
                       String latestVersion, int latestBuild, String downloadUrl,
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
    
    // Getters
    public boolean isUpdateAvailable() { return updateAvailable; }
    public boolean isUpdateDownloaded() { return updateDownloaded; }
    public String getCurrentVersion() { return currentVersion; }
    public String getLatestVersion() { return latestVersion; }
    public int getLatestBuild() { return latestBuild; }
    public String getDownloadUrl() { return downloadUrl; }
    public long getLastCheck() { return lastCheck; }
    public boolean isNeedsCheck() { return needsCheck; }
}
