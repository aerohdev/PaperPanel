# PaperPanel

A comprehensive web-based administration panel for Minecraft Paper servers featuring real-time monitoring, player management, server control, and an intuitive React + TypeScript interface.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Java](https://img.shields.io/badge/java-21-orange.svg)
![Paper](https://img.shields.io/badge/paper-1.21.1-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)
![Javalin](https://img.shields.io/badge/javalin-6.3.0-brightgreen.svg)

## 🎯 Overview

A full-stack application that transforms Minecraft server management with a modern web interface. Built with Java 21, React 18, and TypeScript 5.3, this panel provides everything you need to manage your Paper server efficiently.

**✨ What's New in v3.0.0:**
- ⚡ **Javalin 6.3.0 Upgrade** - Complete framework modernization with Jetty 11 + Jakarta EE 9
- 🔧 **Fixed WebSocket Issues** - Resolved ClassNotFoundException for WebSocketServerFactory
- 🎯 **Enhanced Plugin Compatibility** - Classloader switching for Paper plugin environment
- 📦 **Dependency Relocation** - Shaded dependencies prevent conflicts with other plugins
- 🛡️ **Production Ready** - Stable WebSocket connections for real-time console streaming

**Previous releases:**
- v2.0.0: Full TypeScript migration, structured audit logging, API versioning (v1), log viewer
- v1.0.0: Initial release with core features

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
- Real-time log streaming via WebSocket with Javalin 6.x
- **Stable WebSocket connections** - Fixed ClassNotFoundException issues
- **Auto-reconnect with exponential backoff**
- Visual connection status indicators
- Execute server commands remotely
- Command history with arrow key navigation
- Color-coded log levels (INFO, WARN, ERROR)
- Message queuing during disconnection
- **Production-ready** WebSocket implementation

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

**📢 Broadcast Messages**
- Send chat messages to all players
- Display titles and subtitles
- Show action bar messages
- Play sounds globally
- Quick action templates for common announcements

**📝 Log Viewer (NEW in v2.0.0)**
- View all server logs (audit, security, API, server)
- Real-time log streaming with WebSocket support
- Search across multiple logs with 200 result limit
- Download logs for offline analysis
- Auto-scroll toggle and line limits
- File metadata (size, modified date, line count)

**👥 User Management (NEW in v2.0.0)**
- Create and delete admin users
- Change passwords with validation
- Role-based permissions (admin/user)
- Protected operations for default admin

**🔐 Security**
- JWT-based authentication with 1-hour expiry
- BCrypt password hashing (12 rounds)
- Session management with concurrent tracking
- Protected API routes with middleware
- Auto-generated secure secrets
- Comprehensive audit logging
- **Isolated plugin classloading** for Paper compatibility

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Paper Server 1.21.1+
- Node.js 18+ and npm
- Maven

### Installation

**⚠️ IMPORTANT: v3.X.X includes major framework upgrade - ensure Java 21+ is installed!**

```bash
# 1. Clone repository
git clone https://github.com/aerohdev/PaperPanel.git
cd PaperPanel

# 2. Build everything (frontend + backend in one command)
mvn clean package

# This automatically:
# - Installs npm dependencies
# - Builds React TypeScript frontend
# - Copies frontend to resources
# - Compiles Java backend with Javalin 6.3.0
# - Relocates dependencies (Jetty 11, Jakarta EE 9) to prevent conflicts
# - Generates annotation-processed types
# - Creates deployable JAR (~21 MB with embedded server)

# 3. Install to server
cp target/PaperPanel-*.jar /path/to/server/plugins/

# 4. Open firewall (if needed)
sudo ufw allow 8080/tcp

# 5. Start/restart server
```

### Access the Panel
- Open browser: `http://YOUR_SERVER_IP:8080`
- Login: `admin` / `changeme`
- **⚠️ Change password immediately via User Management page!**

### First-Time Setup
1. Login with default credentials
2. Navigate to **User Management** (`/users`)
3. Click **Change Password** for the admin user
4. Create additional users if needed
5. Review logs in **Log Viewer** (`/logs`)

---

## 🔄 Updating

**v3.0.0 is a major upgrade with breaking changes:**

### Upgrading from v2.X to v3.0.0

```bash
# 1. Backup your data (recommended)
cp /path/to/server/plugins/PaperPanel.jar /path/to/backup/
cp -r /path/to/server/plugins/PaperPanel/ /path/to/backup/

# 2. Pull latest changes
git pull

# 3. Build new version
mvn clean package

# 4. Deploy
cp target/PaperPanel-3.0.0.jar /path/to/server/plugins/

# 5. Remove old JAR (if different name)
rm /path/to/server/plugins/PaperPanel-2.*.jar

# 6. Restart server
```

**What changed in v3.0.0:**
- ⚡ Javalin framework: 4.6.7 → 6.3.0
- 🚀 Jetty server: 9.4.x → 11.0.23
- 📦 Servlet API: javax.servlet → jakarta.servlet (Jakarta EE 9)
- 🔧 WebSocket implementation: Completely reworked for stability
- 📦 JAR size increased (~8 MB → ~21 MB) due to embedded Jetty 11

**Configuration:** No config changes required - fully backward compatible with v2.X settings.

### Regular Updates (v3.X patches)

```bash
# Pull latest changes
git pull

# Build and deploy (automated process)
mvn clean package
cp target/PaperPanel-*.jar /path/to/server/plugins/

# Restart server
```

**The Maven build automatically:**
- Updates npm dependencies
- Rebuilds TypeScript frontend
- Processes Java annotations
- Relocates dependencies to prevent conflicts
- Generates type definitions
- Creates deployable JAR

---

## 🐛 Troubleshooting

**WebSocket connection issues (FIXED in v3.0.0):**
```bash
# If upgrading from v2.X and experiencing WebSocket errors:
# ClassNotFoundException: org.eclipse.jetty.websocket.servlet.WebSocketServletFactory

# Solution: Upgrade to v3.0.0 which uses Javalin 6.3.0
mvn clean package
cp target/PaperPanel-3.0.0.jar /path/to/server/plugins/
# Restart server

# Verify fix in logs:
grep "Web server started" logs/latest.log
# Should see: "Web server started on http://0.0.0.0:8080"
```

**Panel won't load:**
```bash
# Verify frontend is bundled in JAR
jar -tf target/PaperPanel-3.0.0.jar | grep webapp/index.html

# Should show: webapp/index.html and other assets

# If missing, rebuild with:
mvn clean package
```

**Build fails:**
```bash
# Check Maven version (3.6+)
mvn -version

# Check Java version (21+)
java -version

# Check Node.js is available (18+)
node -version

# Clean build
mvn clean
rm -rf webapp/node_modules webapp/dist
mvn package
```

**TypeScript errors during build:**
```bash
# Frontend build issues
cd webapp
npm install
npm run build
cd ..
mvn clean package
```

**Can't access:**
```bash
# Check web server started
grep "Web server" logs/latest.log

# Check port is open
sudo ufw status | grep 8080

# Test connection locally
curl http://localhost:8080/api/v1/health
```

**API v1 Migration Notice:**
If upgrading from v1.x, note that all endpoints have moved to `/api/v1/*`:
- Old: `http://server:8080/api/dashboard/stats`
- New: `http://server:8080/api/v1/dashboard/stats`

The frontend automatically uses v1 endpoints. No configuration needed.

---

## ⚠️ Important

**Production (CORRECT):**
- Everything on `http://server-ip:8080`
- Frontend bundled in JAR
- One-file deployment

**Development only:**
- Frontend dev server: `npm run dev` (localhost:3000)
- Only for development, NOT production!

---

## 🔨 Build Configuration

### Automated Maven Build (v3.0.0)

The `pom.xml` is configured to automatically build everything with dependency relocation:

```xml
<dependencies>
  <!-- Javalin 6.3.0 with Jetty 11 + Jakarta EE 9 -->
  <dependency>
    <groupId>io.javalin</groupId>
    <artifactId>javalin</artifactId>
    <version>6.3.0</version>
  </dependency>
  <!-- Other dependencies... -->
</dependencies>

<build>
  <plugins>
    <!-- 1. Frontend build via npm -->
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>exec-maven-plugin</artifactId>
      <executions>
        <execution>
          <id>npm-install</id>
          <phase>generate-resources</phase>
          <goals><goal>exec</goal></goals>
          <configuration>
            <executable>npm</executable>
            <arguments>
              <argument>install</argument>
            </arguments>
            <workingDirectory>${project.basedir}/webapp</workingDirectory>
          </configuration>
        </execution>
        <execution>
          <id>npm-build</id>
          <phase>generate-resources</phase>
          <goals><goal>exec</goal></goals>
          <configuration>
            <executable>npm</executable>
            <arguments>
              <argument>run</argument>
              <argument>build</argument>
            </arguments>
            <workingDirectory>${project.basedir}/webapp</workingDirectory>
          </configuration>
        </execution>
      </executions>
    </plugin>

    <!-- 2. Copy frontend to resources -->
    <plugin>
      <artifactId>maven-resources-plugin</artifactId>
      <executions>
        <execution>
          <id>copy-webapp</id>
          <phase>process-resources</phase>
          <goals><goal>copy-resources</goal></goals>
          <configuration>
            <outputDirectory>${project.build.outputDirectory}/webapp</outputDirectory>
            <resources>
              <resource>
                <directory>${project.basedir}/webapp/dist</directory>
              </resource>
            </resources>
          </configuration>
        </execution>
      </executions>
    </plugin>

    <!-- 3. Java compilation with annotation processing -->
    <plugin>
      <artifactId>maven-compiler-plugin</artifactId>
      <configuration>
        <source>21</source>
        <target>21</target>
        <annotationProcessorPaths>
          <path>
            <groupId>de.kaicraft</groupId>
            <artifactId>adminpanel</artifactId>
            <version>3.0.0</version>
          </path>
        </annotationProcessorPaths>
      </configuration>
    </plugin>

    <!-- 4. Package with dependencies & relocation -->
    <plugin>
      <artifactId>maven-shade-plugin</artifactId>
      <executions>
        <execution>
          <phase>package</phase>
          <goals><goal>shade</goal></goals>
          <configuration>
            <relocations>
              <!-- Relocate to prevent conflicts with other plugins -->
              <relocation>
                <pattern>io.javalin</pattern>
                <shadedPattern>shaded.io.javalin</shadedPattern>
              </relocation>
              <relocation>
                <pattern>org.eclipse.jetty</pattern>
                <shadedPattern>shaded.org.eclipse.jetty</shadedPattern>
              </relocation>
              <relocation>
                <pattern>jakarta.servlet</pattern>
                <shadedPattern>shaded.jakarta.servlet</shadedPattern>
              </relocation>
            </relocations>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

**Key changes in v3.0.0:**
- Javalin 6.3.0 now manages all Jetty dependencies internally
- Removed explicit Jetty version declarations (was causing conflicts)
- Added Maven Shade relocations to isolate embedded libraries
- Classloader switching in plugin initialization for Paper compatibility

### Manual Build (Development)

```bash
# Build frontend only
cd webapp
npm install
npm run build

# Build backend only (requires pre-built frontend)
mvn clean compile

# Full build
mvn clean package
```

---

## 📁 Project Structure

```
PaperPanel/
├── src/main/java/de/kaicraft/adminpanel/
│   ├── ServerAdminPanelPlugin.java       # Main plugin class with classloader switching (v3.0.0)
│   ├── api/                              # REST API endpoints (v1)
│   │   ├── AuthAPI.java                  # Authentication (login/logout/verify)
│   │   ├── BroadcastAPI.java             # Broadcast messages
│   │   ├── ConsoleAPI.java               # Console operations
│   │   ├── DashboardAPI.java             # Server statistics
│   │   ├── LogViewerAPI.java             # Log viewer (v2.0.0)
│   │   ├── PlayerAPI.java                # Player management
│   │   ├── PluginAPI.java                # Plugin management
│   │   ├── ServerControlAPI.java         # Server control
│   │   ├── UserManagementAPI.java        # User CRUD (v2.0.0)
│   │   └── WorldAPI.java                 # World management
│   ├── auth/                             # Authentication system
│   │   ├── AuthManager.java              # User management
│   │   ├── AuthMiddleware.java           # Route protection (v1 paths)
│   │   └── JWTUtil.java                  # JWT utilities
│   ├── config/
│   │   └── ConfigManager.java            # Configuration handling
│   ├── database/                         # Database layer
│   │   └── DatabaseManager.java          # SQLite connection management
│   ├── model/                            # Data models (v2.0.0)
│   │   ├── AuthResponse.java             # @TypeScriptType annotations
│   │   ├── DashboardStats.java
│   │   ├── LogFileInfo.java
│   │   ├── LogMatch.java
│   │   ├── PlayerInfo.java
│   │   ├── PluginInfo.java
│   │   ├── SecurityStatus.java
│   │   ├── UpdateStatus.java
│   │   ├── UserInfo.java
│   │   └── WorldInfo.java
│   ├── stats/                            # Player statistics
│   │   ├── PlayerStatsListener.java      # Event tracking
│   │   └── PlayerStatsManager.java       # Stats management
│   ├── update/                           # Update system (v2.0.0)
│   │   └── PaperVersionChecker.java      # Paper version checking
│   ├── util/                             # Utilities (v2.0.0)
│   │   ├── ApiResponse.java              # Standardized API responses
│   │   ├── AuditLogger.java              # Structured logging with rotation
│   │   └── TypeScriptGenerator.java      # Annotation processor
│   └── web/                              # Web server (Javalin 6.3.0)
│       ├── WebServer.java                # Javalin 6.x config & routing (v3.0.0)
│       └── WebSocketHandler.java         # WebSocket console (v3.0.0 API fixes)
├── src/main/resources/
│   ├── plugin.yml                        # Plugin metadata (v3.0.0)
│   ├── config.yml                        # Configuration (logging section added v2.0.0)
│   └── webapp/                           # Built frontend (auto-generated)
├── webapp/                               # React + TypeScript Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts                 # Axios HTTP client (TypeScript, v1 base URL)
│   │   ├── components/
│   │   │   ├── ConnectionStatus.tsx      # WebSocket status indicator
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx                # TypeScript (v2.0.0)
│   │   │   ├── ProtectedRoute.tsx        # TypeScript (v2.0.0)
│   │   │   ├── Sidebar.tsx               # TypeScript (v2.0.0)
│   │   │   └── Skeleton.tsx              # Loading states (NEW v2.0.0)
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── AuthContext.tsx           # TypeScript (v2.0.0)
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js
│   │   │   └── useWebSocket.ts           # TypeScript (v2.0.0)
│   │   ├── pages/
│   │   │   ├── Broadcast.tsx             # TypeScript (v2.0.0)
│   │   │   ├── Console.tsx               # TypeScript (v2.0.0)
│   │   │   ├── Dashboard.tsx             # TypeScript (v2.0.0)
│   │   │   ├── Login.tsx                 # TypeScript (v2.0.0)
│   │   │   ├── LogViewer.tsx             # NEW v2.0.0
│   │   │   ├── Players.tsx               # TypeScript (v2.0.0)
│   │   │   ├── Plugins.tsx               # TypeScript (v2.0.0)
│   │   │   ├── ServerControl.tsx         # TypeScript (v2.0.0)
│   │   │   ├── Users.tsx                 # NEW v2.0.0
│   │   │   └── Worlds.tsx                # TypeScript (v2.0.0)
│   │   ├── styles/
│   │   │   └── index.css                 # Global styles + Tailwind
│   │   ├── types/
│   │   │   └── api.ts                    # TypeScript interfaces (NEW v2.0.0)
│   │   ├── App.tsx                       # TypeScript route config (v2.0.0)
│   │   └── main.tsx                      # TypeScript entry (v2.0.0)
│   ├── index.html
│   ├── package.json                      # TypeScript deps (v2.0.0)
│   ├── tsconfig.json                     # TypeScript config (NEW v2.0.0)
│   ├── tsconfig.node.json                # Build config (NEW v2.0.0)
│   ├── vite.config.js                    # Vite configuration
│   └── tailwind.config.js                # TailwindCSS config
├── pom.xml                               # Maven with automated build (v2.0.0)
└── README.md                             # This file
```

## 🛠 Tech Stack

### Backend
- **Java 21** - Modern Java LTS version
- **Paper API 1.21.1-R0.1-SNAPSHOT** - Minecraft server API
- **Javalin 6.1.3** - Lightweight web framework
- **Auth0 java-jwt 4.4.0** - JWT authentication
- **BCrypt (jBCrypt) 0.4** - Password hashing
- **Gson 2.10.1** - JSON serialization
- **SQLite JDBC 3.45.0** - Database driver
- **SLF4J Simple 2.0.12** - Logging facade
- **Log4j2 Core 2.23.1** - Console log interception
- **Maven 3.x** - Build automation with annotation processing

### Frontend
- **React 18.2.0** - UI framework
- **TypeScript 5.3.3** - Type-safe JavaScript (NEW v2.0.0)
- **Vite 5.0.10** - Build tool & dev server
- **TailwindCSS 3.4.0** - Utility-first CSS
- **React Router DOM 6.21.0** - Client-side routing
- **Axios 1.6.0** - HTTP client with interceptors
- **Lucide React 0.294.0** - Icon library
- **tsx 4.7.0** - TypeScript execution (NEW v2.0.0)
- **@types/node 20.10.0** - Node.js type definitions (NEW v2.0.0)
- **WebSocket API** - Real-time communication

### Architecture
- **API Versioning** - All endpoints at `/api/v1/*` (v2.0.0)
- **Standardized Responses** - `{ success: boolean, data?: any, message?: string }`
- **Audit Logging** - Daily-rotated files with 7-day retention (v2.0.0)
- **Type Generation** - Java annotations → TypeScript interfaces (v2.0.0)
- **Skeleton UI** - Animated loading states for better UX (v2.0.0)

## ⚙️ Configuration

### Backend Configuration (`plugins/PaperPanel/config.yml`)

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

logging:                         # NEW in v2.0.0
  enable-file-logging: true      # Enable structured file logging
  log-directory: "logs"          # Relative to plugin folder
  max-file-size-mb: 10           # Max size before rotation
  retention-days: 7              # Days to keep old logs
  audit-enabled: true            # Audit log (user actions)
  security-enabled: true         # Security log (auth events)
  api-enabled: true              # API log (endpoint calls)

security:
  enable-cors: true              # CORS for frontend
  rate-limit: 60                 # Requests per minute per IP
```

### Frontend Configuration

The frontend automatically uses the correct API base URL. For development:

**Development** (`webapp/.env.development`):
```bash
VITE_API_URL=http://localhost:8080/api/v1
```

**Production**: Uses relative paths automatically.

## 📡 API Documentation

**Base URL:** `http://localhost:8080/api/v1` (v2.0.0+)

**All responses follow standardized format:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional message"
}
```

**Error responses:**
```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message"
}
```

### Authentication Endpoints

#### POST /api/v1/auth/login
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

### Broadcast Message Endpoints

#### POST /api/broadcast/message
Send a chat message to all online players.

**Request:**
```json
{
  "message": "Server maintenance in 10 minutes!",
  "color": "#FFFFFF"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Broadcast sent to 15 players"
}
```

**Color Options:**
- `#FFFFFF` - White (default)
- `#FF0000` - Red
- `#00FF00` - Green
- `#0000FF` - Blue
- `#FFFF00` - Yellow
- `#FF00FF` - Light Purple
- `#00FFFF` - Aqua

#### POST /api/broadcast/title
Display a title and subtitle on all players' screens.

**Request:**
```json
{
  "title": "⚠️ Server Restart ⚠️",
  "subtitle": "in 5 minutes",
  "fadeIn": 1,
  "stay": 3,
  "fadeOut": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Title sent to 15 players"
}
```

**Parameters:**
- `title` (required) - Main title text
- `subtitle` (optional) - Subtitle text
- `fadeIn` (optional) - Fade in duration in seconds (default: 1)
- `stay` (optional) - Stay duration in seconds (default: 3)
- `fadeOut` (optional) - Fade out duration in seconds (default: 1)

#### POST /api/broadcast/actionbar
Send an action bar message to all players (appears above hotbar).

**Request:**
```json
{
  "message": "⚡ Server maintenance in progress..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action bar sent to 15 players"
}
```

#### POST /api/broadcast/sound
Play a sound effect for all online players.

**Request:**
```json
{
  "sound": "ENTITY_PLAYER_LEVELUP",
  "volume": 1.0,
  "pitch": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sound played for 15 players"
}
```

**Available Sounds:**
- `ENTITY_PLAYER_LEVELUP` - Level up sound
- `ENTITY_EXPERIENCE_ORB_PICKUP` - XP pickup
- `BLOCK_NOTE_BLOCK_PLING` - Note block pling
- `ENTITY_VILLAGER_YES` - Villager yes sound
- `ENTITY_VILLAGER_NO` - Villager no sound
- `BLOCK_ANVIL_LAND` - Anvil landing
- `ENTITY_ENDER_DRAGON_GROWL` - Dragon growl
- `UI_TOAST_CHALLENGE_COMPLETE` - Achievement sound
- [See full list](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/Sound.html)

**Parameters:**
- `sound` (required) - Sound name from Bukkit Sound enum
- `volume` (optional) - Volume level 0.0-1.0 (default: 1.0)
- `pitch` (optional) - Pitch level 0.5-2.0 (default: 1.0)

---

### Log Viewer Endpoints (NEW v2.0.0)

#### GET /api/v1/logs/files
List all available log files with metadata.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "audit-2025-11-21.log",
      "type": "audit",
      "size": 245760,
      "modified": 1732204800000,
      "lines": 1523
    },
    {
      "name": "security-2025-11-21.log",
      "type": "security",
      "size": 12345,
      "modified": 1732204800000,
      "lines": 234
    }
  ]
}
```

#### GET /api/v1/logs/read/{filename}
Read log file content (last 5000 lines).

**Response:**
```json
{
  "success": true,
  "data": {
    "lines": [
      "[2025-11-21 10:30:15] [INFO] Server started",
      "[2025-11-21 10:30:16] [INFO] Player joined: TestPlayer"
    ]
  }
}
```

#### POST /api/v1/logs/search
Search across multiple log files.

**Request:**
```json
{
  "query": "ERROR",
  "files": ["audit-2025-11-21.log", "security-2025-11-21.log"],
  "limit": 200
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "file": "audit-2025-11-21.log",
      "line": 152,
      "content": "[2025-11-21 10:45:23] [ERROR] Failed to connect"
    }
  ]
}
```

#### GET /api/v1/logs/download/{filename}
Download a log file.

**Response:** File stream with `Content-Disposition: attachment`

---

### User Management Endpoints (NEW v2.0.0)

#### GET /api/v1/users
List all admin panel users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "username": "admin",
      "isDefaultAdmin": true,
      "isCurrentUser": true
    },
    {
      "username": "moderator",
      "isDefaultAdmin": false,
      "isCurrentUser": false
    }
  ]
}
```

#### POST /api/v1/users
Create a new user.

**Request:**
```json
{
  "username": "newuser",
  "password": "SecurePass123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

#### PUT /api/v1/users/{username}/password
Change user password.

**Request:**
```json
{
  "password": "NewSecurePass123!"
}
```

**Permissions:**
- Admins can change any user's password
- Users can change their own password

#### DELETE /api/v1/users/{username}
Delete a user (admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Restrictions:**
- Cannot delete default admin
- Cannot delete yourself
- Admin permission required

---

## 🎮 In-Game Commands

### /paperpanel
Main command for PaperPanel.

**Aliases:** `/pp`, `/panel`

**Permission:** `paperpanel.use` (default: op)

**Usage:**
```
/paperpanel              Show status and help
/paperpanel reload       Reload configuration
/paperpanel status       Show detailed server status
```

**Example output:**
```
=== PaperPanel ===
Version: 2.5.0
Status: Running
Port: 8080
Access: http://localhost:8080
TypeScript: Enabled
Audit Logging: Enabled (7-day retention)
```

## 🎨 Frontend Features

### Pages

**Dashboard** (`/dashboard`)
- Real-time TPS monitoring with color-coded indicators
- Memory usage with progress bar and skeleton loading
- Player count and server uptime
- World and plugin statistics
- Update status checking
- Auto-refreshes every 5 seconds

**Console** (`/console`)
- Live log streaming via WebSocket
- Auto-reconnect with exponential backoff (5s - 30s)
- Visual connection status indicator (connected/reconnecting/disconnected)
- Message queuing during disconnection
- Manual "Retry Now" button
- Command execution interface
- Command history navigation (↑ ↓ arrows)
- Auto-scroll to latest messages
- Color-coded log levels

**Log Viewer** (`/logs`) **NEW in v2.0.0**
- View all server logs (audit, security, API, server)
- Real-time log streaming with WebSocket support
- Search across multiple logs (max 200 results)
- Download logs for offline analysis
- Auto-scroll toggle
- File metadata display (size, modified, lines, type)
- Color-coded log types

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

**Broadcast** (`/broadcast`)
- **Send chat messages** to all players with color options
- **Display titles and subtitles** with customizable timing
- **Show action bar messages** above player hotbars
- **Play sounds** globally with 8+ preset options
- **Quick Actions** for common announcements:
  - Server restart warning (5 minutes)
  - Welcome message
  - Maintenance notice
  - Event announcement with sound

**User Management** (`/users`) **NEW in v2.0.0**
- View all admin panel users
- Create new users with password validation
- Change user passwords (admin or self)
- Delete users (admin only, restrictions apply)
- Role indicators (Admin badge)
- Password requirements enforced (8+ chars, mixed case, digit, special)

### Theme

- **Dark Mode** - Optimized for long sessions with v2.0.0 enhancements
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Clean, intuitive interface with smooth animations
- **Skeleton Loading** - Animated placeholders for better perceived performance (NEW)
- **Color-Coded Status** - Visual indicators for quick reference
- **TypeScript** - Full type safety prevents runtime errors (NEW)

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
cp target/PaperPanel-3.0.0.jar ~/paperserver/plugins/
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

## 🔧 Technical Details (v3.0.0)

### Framework Migration

**Javalin 4.6.7 → 6.3.0:**
- Configuration API restructured (DSL changes)
- Static files: `addStaticFiles()` → `staticFiles.add()`
- CORS: `enableCorsForAllOrigins()` → `bundledPlugins.enableCors()`
- HTTP config: `maxRequestSize` moved to `http.maxRequestSize`
- Context API: Field access changed to method calls
- WebSocket API: `session.close()` → `closeSession()`

**Jetty 9.4.x → 11.0.23:**
- Servlet API: `javax.servlet.*` → `jakarta.servlet.*`
- WebSocket: New implementation architecture
- Thread model improvements
- Better performance and stability

**Dependency Management:**
```xml
<!-- v2.X - Explicit Jetty management (caused conflicts) -->
<dependency>
    <groupId>org.eclipse.jetty</groupId>
    <artifactId>jetty-server</artifactId>
    <version>9.4.53.v20231009</version>
</dependency>
<!-- ...40+ more explicit Jetty deps -->

<!-- v3.0.0 - Let Javalin manage internally -->
<dependency>
    <groupId>io.javalin</groupId>
    <artifactId>javalin</artifactId>
    <version>6.3.0</version>
</dependency>
```

**Classloader Isolation:**
```java
// ServerAdminPanelPlugin.java - v3.0.0
@Override
public void onEnable() {
    ClassLoader originalClassLoader = Thread.currentThread().getContextClassLoader();
    try {
        // Switch to plugin classloader for Javalin initialization
        Thread.currentThread().setContextClassLoader(getClass().getClassLoader());
        webServer = new WebServer(this);
        webServer.start();
    } finally {
        // Restore original classloader
        Thread.currentThread().setContextClassLoader(originalClassLoader);
    }
}
```

### Maven Shade Relocations

Prevents conflicts with other plugins:
```xml
<relocations>
    <relocation>
        <pattern>io.javalin</pattern>
        <shadedPattern>shaded.io.javalin</shadedPattern>
    </relocation>
    <relocation>
        <pattern>org.eclipse.jetty</pattern>
        <shadedPattern>shaded.org.eclipse.jetty</shadedPattern>
    </relocation>
    <relocation>
        <pattern>jakarta.servlet</pattern>
        <shadedPattern>shaded.jakarta.servlet</shadedPattern>
    </relocation>
</relocations>
```

---

### API Testing with cURL

**Login:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' \
  | jq -r '.token')
```

**Get Dashboard Stats:**
```bash
curl http://localhost:8080/api/v1/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Execute Command:**
```bash
curl -X POST http://localhost:8080/api/v1/console/command \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"list"}' | jq
```

**Kick Player:**
```bash
curl -X POST "http://localhost:8080/api/v1/players/{uuid}/kick" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Testing"}' | jq
```

**Send Broadcast Message:**
```bash
curl -X POST http://localhost:8080/api/v1/broadcast/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Server maintenance starting soon!","color":"#FFFF00"}' | jq
```

**Send Title:**
```bash
curl -X POST http://localhost:8080/api/v1/broadcast/title \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Welcome!","subtitle":"Enjoy your stay","fadeIn":1,"stay":3,"fadeOut":1}' | jq
```

**Play Sound:**
```bash
curl -X POST http://localhost:8080/api/v1/broadcast/sound \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sound":"ENTITY_PLAYER_LEVELUP","volume":1.0,"pitch":1.0}' | jq
```

**List Log Files (v2.0.0):**
```bash
curl http://localhost:8080/api/v1/logs/files \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Search Logs (v2.0.0):**
```bash
curl -X POST http://localhost:8080/api/v1/logs/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"ERROR","limit":50}' | jq
```

**List Users (v2.0.0):**
```bash
curl http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Create User (v2.0.0):**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"SecurePass123!"}' | jq
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
- Review `plugins/PaperPanel/players.db`

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
- Check connection status indicator on Console page
- Use manual "Retry Now" button if auto-reconnect fails
- Ensure server is running and port 8080 is accessible

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

### ✅ v1.0.0 - Initial Release

- Backend Core (Javalin, JWT, RESTful API, WebSocket)
- React Frontend (TailwindCSS, real-time dashboard, live console)
- Advanced Features (player management, server control, world management, SQLite)
- WebSocket auto-reconnect, broadcast messaging

### ✅ v2.0.0 - TypeScript & Architecture Upgrade (November 2025)

- **🎯 Full TypeScript Migration**
  - All React components migrated to TypeScript
  - Complete type safety across frontend
  - Type definitions for all API responses
  - Proper event handler typing

- **📋 Structured Audit Logging**
  - Daily-rotated log files (audit, security, API)
  - 7-day automatic retention
  - 10MB file size limits
  - Separate logs for different concerns

- **🔄 API Versioning**
  - All endpoints moved to `/api/v1/*`
  - Standardized response format
  - ApiResponse utility class
  - Consistent error handling

- **📝 Log Viewer System**
  - View all server logs in web interface
  - Real-time log streaming (WebSocket ready)
  - Search across multiple logs (200 result limit)
  - Download logs for offline analysis
  - File metadata display

- **👥 User Management**
  - Create/delete admin users via UI
  - Password change with validation
  - Role-based permissions
  - Admin/user indicators

- **🎨 UX Enhancements**
  - Skeleton loading components
  - Improved error messages
  - Better loading states
  - Enhanced visual feedback

- **🔧 Build System**
  - Automated Maven build process
  - Single `mvn package` command
  - Annotation processing for type generation
  - Frontend/backend bundled in JAR

### 🔮 v2.1.0 - Performance & Monitoring (Planned)

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
- [Javalin 6.3.0](https://javalin.io/) - Simple web framework for Java & Kotlin
- [Jetty 11](https://eclipse.dev/jetty/) - Embedded servlet container
- [React 18](https://react.dev/) - UI library
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

**PaperPanel v3.0.0**

Made with ❤️ for Minecraft Server Administrators

Javalin 6 • Jetty 11 • TypeScript • WebSocket • Audit Logging

[Report Bug](https://github.com/aerohdev/PaperPanel/issues) •
[Request Feature](https://github.com/aerohdev/PaperPanel/issues) •
[Documentation](#-api-documentation)

</div>
