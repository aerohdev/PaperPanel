package de.kaicraft.adminpanel.database;

import de.kaicraft.adminpanel.ServerAdminPanelPlugin;

import java.io.File;
import java.sql.*;
import java.util.UUID;

/**
 * Manages SQLite database connections and operations
 */
public class DatabaseManager {
    private final ServerAdminPanelPlugin plugin;
    private Connection connection;
    private final File databaseFile;

    public DatabaseManager(ServerAdminPanelPlugin plugin) {
        this.plugin = plugin;
        this.databaseFile = new File(plugin.getDataFolder(), "players.db");
    }

    /**
     * Initialize database connection and create tables
     */
    public void initialize() {
        try {
            Class.forName("org.sqlite.JDBC");
            connect();
            createTables();
            plugin.getLogger().info("Database initialized successfully");
        } catch (Exception e) {
            plugin.getLogger().severe("Failed to initialize database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Connect to SQLite database
     */
    private void connect() throws SQLException {
        if (!databaseFile.getParentFile().exists()) {
            databaseFile.getParentFile().mkdirs();
        }

        String url = "jdbc:sqlite:" + databaseFile.getAbsolutePath();
        connection = DriverManager.getConnection(url);
    }

    /**
     * Create database tables if they don't exist
     */
    private void createTables() throws SQLException {
        String createPlayersTable = """
            CREATE TABLE IF NOT EXISTS players (
                uuid TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                first_join INTEGER NOT NULL,
                last_seen INTEGER NOT NULL,
                total_playtime INTEGER DEFAULT 0
            )
        """;

        String createPlayerStatsTable = """
            CREATE TABLE IF NOT EXISTS player_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT NOT NULL,
                stat_type TEXT NOT NULL,
                stat_value INTEGER DEFAULT 0,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (uuid) REFERENCES players(uuid),
                UNIQUE(uuid, stat_type)
            )
        """;

        try (Statement stmt = connection.createStatement()) {
            stmt.execute(createPlayersTable);
            stmt.execute(createPlayerStatsTable);
        }
    }

    /**
     * Get database connection
     */
    public Connection getConnection() {
        try {
            if (connection == null || connection.isClosed()) {
                connect();
            }
        } catch (SQLException e) {
            plugin.getLogger().severe("Failed to get database connection: " + e.getMessage());
        }
        return connection;
    }

    /**
     * Close database connection
     */
    public void close() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                plugin.getLogger().info("Database connection closed");
            }
        } catch (SQLException e) {
            plugin.getLogger().severe("Error closing database: " + e.getMessage());
        }
    }

    /**
     * Execute a query
     */
    public ResultSet executeQuery(String query, Object... params) throws SQLException {
        PreparedStatement stmt = connection.prepareStatement(query);
        for (int i = 0; i < params.length; i++) {
            stmt.setObject(i + 1, params[i]);
        }
        return stmt.executeQuery();
    }

    /**
     * Execute an update
     */
    public int executeUpdate(String query, Object... params) throws SQLException {
        try (PreparedStatement stmt = connection.prepareStatement(query)) {
            for (int i = 0; i < params.length; i++) {
                stmt.setObject(i + 1, params[i]);
            }
            return stmt.executeUpdate();
        }
    }
}
