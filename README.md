# Server Admin Panel

A comprehensive web-based administration panel for Minecraft Paper servers featuring real-time monitoring, player management, server control, and an intuitive React interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Java](https://img.shields.io/badge/java-21-orange.svg)
![Paper](https://img.shields.io/badge/paper-1.21.1-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)

## 🎯 Overview

A full-stack application that transforms Minecraft server management with a modern web interface. Built with Java 21 and React 18, this panel provides everything you need to manage your Paper server efficiently.

### ✨ Key Features

**📊 Real-Time Monitoring**
- Live TPS, memory, and player count tracking
- Server uptime and performance metrics
- Auto-refreshing dashboard

**👥 Player Management**
- View online and offline players with statistics
- Track playtime, joins, and activity
- Kick players and send private messages
- SQLite database for persistent player data

**💻 Live Console**
- Real-time log streaming via WebSocket
- Execute server commands remotely
- Command history with arrow key navigation
- Color-coded log levels (INFO, WARN, ERROR)

**📦 Plugin Management**
- Enable/disable plugins without restart
- View plugin details and dependencies
- Reload plugin configurations
- Search and filter functionality

**🌍 World Management**
- View all loaded worlds with detailed stats
- Monitor chunks, entities, and players per world
- View spawn locations and game rules
- Environment indicators (Overworld, Nether, End)

**⚙️ Server Control**
- Schedule graceful restarts with countdown warnings
- Control weather (clear, rain, thunder)
- Set time (day, noon, night, midnight)
- Save all worlds command
- Emergency server stop

**🔐 Security**
- JWT-based authentication
- BCrypt password hashing (12 rounds)
- Session management
- Protected API routes
- Auto-generated secure secrets

## 🚀 Quick Start

### Prerequisites

- **Java 21** or higher
- **Paper Server 1.21.1** or compatible
- **Node.js 18+** and npm (for frontend development)
- **Maven** (for building the plugin)

### Backend Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aerohdev/Minecraft-Admin-WebApp.git
   cd Minecraft-Admin-WebApp
   ```

2. **Build the plugin**
   ```bash
   mvn clean package
   ```

3. **Install to server**
   ```bash
   cp target/ServerAdminPanel-1.0.0-SNAPSHOT.jar /path/to/server/plugins/
   ```

4. **Start/restart your server**
   - The plugin will create `plugins/ServerAdminPanel/config.yml`
   - Web server starts automatically on `http://localhost:8080`

### Frontend Installation

1. **Navigate to webapp directory**
   ```bash
   cd webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the panel**
   - Open `http://localhost:3000` in your browser
   - Login with default credentials: `admin` / `changeme`
   - **⚠️ Change the password immediately!**

### Production Deployment

**Backend:**
- Already bundled with server plugin

**Frontend:**
```bash
cd webapp
npm run build
# Serve the dist/ folder with nginx, Apache, or your preferred web server
```

## 📁 Project Structure

```
Minecraft-Admin-WebApp/
├── src/main/java/de/kaicraft/adminpanel/
│   ├── ServerAdminPanelPlugin.java       # Main plugin class
│   ├── api/                              # REST API endpoints
│   │   ├── AuthAPI.java                  # Authentication (login/logout)
│   │   ├── ConsoleAPI.java               # Console operations
│   │   ├── DashboardAPI.java             # Server statistics
│   │   ├── PlayerAPI.java                # Player management (NEW)
│   │   ├── PluginAPI.java                # Plugin management
│   │   ├── ServerControlAPI.java         # Server control (NEW)
│   │   └── WorldAPI.java                 # World management (NEW)
│   ├── auth/                             # Authentication system
│   │   ├── AuthManager.java              # User management
│   │   ├── AuthMiddleware.java           # Route protection
│   │   └── JWTUtil.java                  # JWT utilities
│   ├── config/
│   │   └── ConfigManager.java            # Configuration handling
│   ├── database/                         # Database layer (NEW)
│   │   └── DatabaseManager.java          # SQLite connection management
│   ├── stats/                            # Player statistics (NEW)
│   │   ├── PlayerStatsListener.java      # Event tracking
│   │   └── PlayerStatsManager.java       # Stats management
│   └── web/                              # Web server
│       ├── WebServer.java                # Javalin setup & routing
│       └── WebSocketHandler.java         # WebSocket console
├── src/main/resources/
│   ├── plugin.yml                        # Plugin metadata
│   └── config.yml                        # Default configuration
├── webapp/                               # React Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                 # Axios HTTP client
│   │   ├── components/
│   │   │   ├── Header.jsx                # Top navigation bar
│   │   │   ├── Layout.jsx                # Main layout wrapper
│   │   │   ├── ProtectedRoute.jsx        # Auth guard
│   │   │   └── Sidebar.jsx               # Side navigation menu
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx           # Authentication state
│   │   ├── hooks/
│   │   │   └── useWebSocket.js           # WebSocket hook
│   │   ├── pages/
│   │   │   ├── Console.jsx               # Live console page
│   │   │   ├── Dashboard.jsx             # Statistics dashboard
│   │   │   ├── Login.jsx                 # Login page
│   │   │   ├── Players.jsx               # Player management (NEW)
│   │   │   ├── Plugins.jsx               # Plugin management
│   │   │   ├── ServerControl.jsx         # Server control (NEW)
│   │   │   └── Worlds.jsx                # World management (NEW)
│   │   ├── styles/
│   │   │   └── index.css                 # Global styles + Tailwind
│   │   ├── App.jsx                       # Route configuration
│   │   └── main.jsx                      # Entry point
│   ├── package.json
│   ├── vite.config.js                    # Vite configuration
│   └── tailwind.config.js                # TailwindCSS config
├── pom.xml                               # Maven configuration
└── README.md                             # This file
```

## 🛠 Tech Stack

### Backend
- **Java 21** - Modern Java LTS version
- **Paper API 1.21.1** - Minecraft server API
- **Javalin 6.1.3** - Lightweight web framework
- **Auth0 java-jwt 4.4.0** - JWT authentication
- **BCrypt 0.4** - Password hashing
- **Gson 2.10.1** - JSON serialization
- **SQLite JDBC 3.45.0.0** - Database driver
- **SLF4J 2.0.12** - Logging
- **Log4j2** - Console log interception
- **Maven** - Build automation

### Frontend
- **React 18.2.0** - UI framework
- **Vite 5.0.10** - Build tool & dev server
- **TailwindCSS 3.4.0** - Utility-first CSS
- **React Router 6.21.0** - Client-side routing
- **Axios 1.6.0** - HTTP client
- **Lucide React 0.294.0** - Icon library
- **WebSocket API** - Real-time communication

## ⚙️ Configuration

### Backend Configuration (`plugins/ServerAdminPanel/config.yml`)

```yaml
web-server:
  enabled: true
  port: 8080
  host: "0.0.0.0"

auth:
  default-username: "admin"      # ⚠️ CHANGE THIS!
  default-password: "changeme"   # ⚠️ CHANGE THIS!
  jwt-secret: ""                 # Auto-generated on first start
  session-timeout: 3600          # Session duration in seconds (1 hour)

console:
  max-history-lines: 1000        # Console history buffer size
  allow-commands: true           # Enable remote command execution

security:
  enable-cors: true              # CORS for frontend
  rate-limit: 60                 # Requests per minute per IP
```

### Frontend Configuration (`webapp/src/api/client.js`)

```javascript
const API_URL = 'http://localhost:8080/api';  // Backend URL
```

For production, update to your server's URL or use environment variables.

## 📡 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Authenticate and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "changeme"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin"
}
```

#### POST /api/auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer {token}`

#### GET /api/auth/verify
Verify token validity.

**Headers:** `Authorization: Bearer {token}`

---

### Dashboard Endpoints

#### GET /api/dashboard/stats
Get real-time server statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "tps": 20.0,
    "onlinePlayers": 5,
    "maxPlayers": 100,
    "memory": {
      "used": 4294967296,
      "max": 8589934592,
      "usedMB": 4096,
      "maxMB": 8192,
      "percentage": 50
    },
    "uptime": 3600000,
    "uptimeFormatted": "1h 0m 0s",
    "version": "1.21.1-R0.1-SNAPSHOT",
    "worlds": 3,
    "loadedChunks": 1245,
    "plugins": 15
  }
}
```

---

### Player Management Endpoints

#### GET /api/players
List all players (online and offline).

**Response:**
```json
{
  "success": true,
  "players": [
    {
      "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
      "name": "PlayerName",
      "online": true,
      "firstJoin": 1699564800000,
      "lastSeen": 1699568400000,
      "totalPlaytime": 7200000
    }
  ]
}
```

#### GET /api/players/{uuid}
Get detailed player information and statistics.

**Response:**
```json
{
  "success": true,
  "player": {
    "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
    "name": "PlayerName",
    "online": true,
    "health": 20.0,
    "foodLevel": 20,
    "level": 30,
    "gameMode": "SURVIVAL",
    "world": "world",
    "location": { "x": 100, "y": 64, "z": 200 },
    "stats": {
      "BLOCKS_BROKEN": 1523,
      "DEATHS": 5,
      "JOINS": 42
    }
  }
}
```

#### POST /api/players/{uuid}/kick
Kick a player from the server.

**Request:**
```json
{
  "reason": "Breaking server rules"
}
```

#### POST /api/players/{uuid}/message
Send a private message to a player.

**Request:**
```json
{
  "message": "Please check the server rules!"
}
```

---

### Console Endpoints

#### GET /api/console/history
Get console log history.

**Query Params:** `limit` (optional, default: 1000)

#### POST /api/console/command
Execute a server command.

**Request:**
```json
{
  "command": "say Hello from the admin panel!"
}
```

#### POST /api/console/clear
Clear console history.

#### WebSocket: /ws/console
Real-time console streaming.

**Connection:** `ws://localhost:8080/ws/console?token={jwt_token}`

**Send command:**
```json
{
  "type": "command",
  "command": "list"
}
```

**Receive messages:**
```json
{
  "type": "log",
  "message": "[INFO] Server started",
  "timestamp": 1699568400000
}
```

---

### Plugin Management Endpoints

#### GET /api/plugins
List all plugins with details.

#### GET /api/plugins/{name}
Get specific plugin information.

#### POST /api/plugins/{name}/enable
Enable a disabled plugin.

#### POST /api/plugins/{name}/disable
Disable an active plugin.

#### POST /api/plugins/{name}/reload
Reload plugin configuration.

---

### Server Control Endpoints

#### POST /api/server/restart?delay={seconds}
Schedule a graceful server restart.

**Query Params:** `delay` (minimum: 10 seconds)

**Example:** `/api/server/restart?delay=300` (5 minute countdown)

#### POST /api/server/stop
Immediately stop the server.

#### POST /api/server/save-all
Save all worlds.

#### POST /api/server/weather/{world}/{type}
Set weather in a world.

**Path Params:**
- `world`: World name (e.g., "world")
- `type`: Weather type (`clear`, `rain`, `thunder`)

**Example:** `/api/server/weather/world/clear`

#### POST /api/server/time/{world}/{time}
Set time in a world.

**Path Params:**
- `world`: World name
- `time`: Time value (`day`, `noon`, `night`, `midnight`, or numeric value)

**Example:** `/api/server/time/world/day`

---

### World Management Endpoints

#### GET /api/worlds
List all loaded worlds.

**Response:**
```json
{
  "success": true,
  "worlds": [
    {
      "name": "world",
      "seed": 1234567890,
      "environment": "NORMAL",
      "difficulty": "NORMAL",
      "time": 1000,
      "storm": false,
      "thundering": false,
      "loadedChunks": 524,
      "entities": 152,
      "players": 3,
      "pvp": true,
      "spawnLocation": { "x": 0, "y": 64, "z": 0 }
    }
  ]
}
```

#### GET /api/worlds/{name}
Get detailed world information including entity breakdown.

#### POST /api/worlds/{name}/settings
Update world settings.

**Request:**
```json
{
  "difficulty": "HARD",
  "pvp": false,
  "spawnAnimals": true,
  "spawnMonsters": false
}
```

---

## 🎮 In-Game Commands

### /adminpanel
Main command for the admin panel.

**Aliases:** `/ap`, `/panel`

**Permission:** `adminpanel.use` (default: op)

**Usage:**
```
/adminpanel              Show status and help
/adminpanel reload       Reload configuration
/adminpanel status       Show detailed server status
```

**Example output:**
```
=== Server Admin Panel ===
Version: 1.0.0
Status: Running
Port: 8080
Access: http://localhost:8080
```

## 🎨 Frontend Features

### Pages

**Dashboard** (`/dashboard`)
- Real-time TPS monitoring with color-coded indicators
- Memory usage with progress bar
- Player count and server uptime
- World and plugin statistics
- Auto-refreshes every 5 seconds

**Console** (`/console`)
- Live log streaming via WebSocket
- Command execution interface
- Command history navigation (↑ ↓ arrows)
- Auto-scroll to latest messages
- Color-coded log levels
- Connection status indicator

**Players** (`/players`)
- Online and offline player lists
- Search and filter functionality
- Player statistics (playtime, last seen)
- Kick players with custom reasons
- Send private messages to online players
- Auto-refresh every 10 seconds

**Plugins** (`/plugins`)
- List all installed plugins
- Search and filter
- Enable/disable plugins
- Reload configurations
- View plugin details and dependencies

**Worlds** (`/worlds`)
- View all loaded worlds
- Expandable cards with detailed information
- Environment indicators (🌍 🔥 🌌)
- Real-time stats (players, chunks, entities)
- Game rules and spawn locations

**Server Control** (`/server`)
- Schedule graceful restarts with countdown
- Weather control (clear, rain, thunder)
- Time control (day, noon, night, midnight)
- Save all worlds
- Emergency server stop

### Theme

- **Dark Mode** - Optimized for long sessions
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Clean, intuitive interface with smooth animations
- **Color-Coded Status** - Visual indicators for quick reference

## 🔒 Security Best Practices

1. **Change Default Credentials**
   - Immediately change `admin`/`changeme` after first login
   - Use strong, unique passwords

2. **Use HTTPS in Production**
   - Deploy behind reverse proxy (nginx/Apache) with SSL
   - Update frontend API URL to use `https://`

3. **Firewall Configuration**
   - Restrict port 8080 to trusted IPs
   - Only expose through reverse proxy

4. **Regular Updates**
   - Keep Paper server updated
   - Update plugin dependencies
   - Monitor security advisories

5. **Monitor Access**
   - Review authentication logs
   - Track API usage
   - Check for suspicious activity

## 📊 Database Schema

The plugin uses SQLite for persistent player data storage.

### Tables

**players**
```sql
CREATE TABLE players (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    first_join INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    total_playtime INTEGER DEFAULT 0
);
```

**player_stats**
```sql
CREATE TABLE player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL,
    stat_type TEXT NOT NULL,
    stat_value INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (uuid) REFERENCES players(uuid),
    UNIQUE(uuid, stat_type)
);
```

### Tracked Statistics

- `JOINS` - Total server joins
- `BLOCKS_BROKEN` - Total blocks broken
- `BLOCKS_BROKEN_{TYPE}` - Blocks broken by type
- `BLOCKS_PLACED` - Total blocks placed
- `BLOCKS_PLACED_{TYPE}` - Blocks placed by type
- `DEATHS` - Player deaths
- `MESSAGES_SENT` - Chat messages sent

## 🧪 Testing

### Backend Testing

```bash
# Build and test
mvn clean test

# Integration testing
mvn verify

# Install to local Paper server
mvn clean package
cp target/ServerAdminPanel-1.0.0-SNAPSHOT.jar ~/paperserver/plugins/
```

### Frontend Testing

```bash
cd webapp

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### API Testing with cURL

**Login:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' \
  | jq -r '.token')
```

**Get Dashboard Stats:**
```bash
curl http://localhost:8080/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Execute Command:**
```bash
curl -X POST http://localhost:8080/api/console/command \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"list"}' | jq
```

**Kick Player:**
```bash
curl -X POST "http://localhost:8080/api/players/{uuid}/kick" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Testing"}' | jq
```

## 🐛 Troubleshooting

### Backend Issues

**Plugin won't load:**
- Check Java version: `java -version` (must be 21+)
- Review `logs/latest.log` for errors
- Verify Paper version compatibility

**Web server won't start:**
- Check if port 8080 is in use: `netstat -an | grep 8080`
- Review plugin configuration
- Check firewall settings

**Database errors:**
- Ensure plugin folder has write permissions
- Check SQLite JDBC driver is loaded
- Review `plugins/ServerAdminPanel/players.db`

### Frontend Issues

**Cannot connect to backend:**
- Verify backend is running on port 8080
- Check CORS settings in backend config
- Update API URL in `webapp/src/api/client.js`

**Login fails:**
- Verify credentials match config.yml
- Check JWT secret is generated
- Clear browser localStorage and retry

**WebSocket won't connect:**
- Verify JWT token is valid
- Check WebSocket URL format
- Review browser console for errors

**Build errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## 🗺 Roadmap

### ✅ Completed

- **Phase 1:** Backend Core
  - Javalin web server
  - JWT authentication
  - RESTful API
  - WebSocket console

- **Phase 2:** React Frontend
  - Modern UI with TailwindCSS
  - Real-time dashboard
  - Live console
  - Plugin management

- **Phase 3:** Advanced Features
  - Player management with stats
  - Server control operations
  - World management tools
  - SQLite database integration

### 🔮 Future Enhancements

- **Performance Monitoring**
  - TPS history graphs
  - CPU/RAM usage charts
  - Alert system for low TPS

- **Backup System**
  - Automated world backups
  - Scheduled backup jobs
  - One-click restore

- **Log Management**
  - Advanced log filtering
  - Error grouping and analysis
  - Log file download

- **Multi-User Support**
  - Role-based access control
  - User management interface
  - Audit logging

- **Advanced Features**
  - Whitelist/banlist management
  - Economy system integration
  - Custom command shortcuts
  - Server health monitoring
  - Multi-server support

## 📝 License

This project is for educational purposes. Please ensure compliance with:
- Minecraft EULA
- Paper project terms
- All third-party library licenses

## 👥 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test on multiple screen sizes (frontend)
- Ensure backward compatibility
- Update documentation

## 🙏 Credits

**Built With:**
- [Paper](https://papermc.io/) - High-performance Minecraft server
- [Javalin](https://javalin.io/) - Simple web framework for Java
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Frontend build tool
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Auth0 java-jwt](https://github.com/auth0/java-jwt) - JWT implementation
- [Lucide Icons](https://lucide.dev/) - Beautiful icon library

**Special Thanks:**
- Paper development team
- Open source community
- All contributors

## 📞 Support

**Issues & Questions:**
- GitHub Issues: [Report a bug](https://github.com/aerohdev/Minecraft-Admin-WebApp/issues)
- Documentation: Check this README and inline code comments
- Community: Share your experience and help others

**Useful Links:**
- [Paper Documentation](https://docs.papermc.io/)
- [Javalin Documentation](https://javalin.io/documentation)
- [React Documentation](https://react.dev/)

---

<div align="center">

**Server Admin Panel v1.0.0**

Made with ❤️ for Minecraft Server Administrators

[Report Bug](https://github.com/aerohdev/Minecraft-Admin-WebApp/issues) •
[Request Feature](https://github.com/aerohdev/Minecraft-Admin-WebApp/issues) •
[Documentation](#-api-documentation)

</div>
