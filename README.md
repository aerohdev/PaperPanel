# Server Admin Panel

A powerful web-based admin panel for Minecraft Paper servers with real-time console streaming, plugin management, and server statistics.

## Features

### Phase 1 (Current) - Backend Core
- ✅ Embedded Javalin web server (port 8080)
- ✅ JWT-based authentication system
- ✅ Real-time console streaming via WebSocket
- ✅ Server statistics dashboard API
- ✅ Plugin management (enable/disable/reload)
- ✅ Console command execution
- ✅ Secure password hashing with BCrypt
- ✅ CORS support for frontend integration

## Tech Stack

- **Java 21** - Modern Java LTS version
- **Paper API 1.21.1** - Minecraft server API
- **Javalin 6.x** - Lightweight web framework
- **JWT (java-jwt)** - Authentication tokens
- **BCrypt** - Password hashing
- **Gson** - JSON serialization
- **Log4j2** - Console log interception
- **Maven** - Build tool

## Installation

1. **Requirements**
   - Java 21 or higher
   - Paper server 1.21.1 or compatible version
   - Maven (for building)

2. **Build the plugin**
   ```bash
   mvn clean package
   ```

3. **Install**
   - Copy `target/ServerAdminPanel-1.0.0-SNAPSHOT.jar` to your server's `plugins/` folder
   - Start/restart your server

4. **Configure**
   - Edit `plugins/ServerAdminPanel/config.yml`
   - **IMPORTANT:** Change default credentials!
   - Restart server or use `/adminpanel reload`

## Configuration

```yaml
web-server:
  enabled: true
  port: 8080
  host: "0.0.0.0"

auth:
  default-username: "admin"      # CHANGE THIS!
  default-password: "changeme"   # CHANGE THIS!
  jwt-secret: ""                 # Auto-generated
  session-timeout: 3600          # 1 hour in seconds

console:
  max-history-lines: 1000
  allow-commands: true

security:
  enable-cors: true
  rate-limit: 60
```

## API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

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

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer {token}
```

### Dashboard

#### Get Server Statistics
```http
GET /api/dashboard/stats
Authorization: Bearer {token}
```

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

### Console

#### Get Console History
```http
GET /api/console/history?limit=100
Authorization: Bearer {token}
```

#### Execute Command
```http
POST /api/console/command
Authorization: Bearer {token}
Content-Type: application/json

{
  "command": "say Hello World"
}
```

#### Clear History
```http
POST /api/console/clear
Authorization: Bearer {token}
```

#### WebSocket Console Stream
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/console?token=YOUR_JWT_TOKEN');

// Receive log messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.message);
};

// Send command
ws.send(JSON.stringify({
  type: 'command',
  command: 'list'
}));

// Ping/Pong
ws.send(JSON.stringify({ type: 'ping' }));
```

**WebSocket Message Types:**
- `connected` - Connection established
- `log` - Console log line
- `command_sent` - Command was executed
- `pong` - Response to ping
- `error` - Error message

### Plugin Management

#### List All Plugins
```http
GET /api/plugins
Authorization: Bearer {token}
```

#### Get Plugin Details
```http
GET /api/plugins/{name}
Authorization: Bearer {token}
```

#### Enable Plugin
```http
POST /api/plugins/{name}/enable
Authorization: Bearer {token}
```

#### Disable Plugin
```http
POST /api/plugins/{name}/disable
Authorization: Bearer {token}
```

#### Reload Plugin Config
```http
POST /api/plugins/{name}/reload
Authorization: Bearer {token}
```

## Commands

### /adminpanel
- **Aliases:** `/ap`, `/panel`
- **Permission:** `adminpanel.use`

**Usage:**
```
/adminpanel              - Show help and status
/adminpanel reload       - Reload configuration
/adminpanel status       - Show detailed status
```

## Permissions

- `adminpanel.use` - Access to admin panel commands (default: op)
- `adminpanel.webaccess` - Access to web panel (default: op)

## Security Notes

1. **Change default credentials** immediately after installation
2. JWT secret is auto-generated on first start
3. Passwords are hashed using BCrypt (12 rounds)
4. Active sessions are tracked and can be invalidated
5. WebSocket connections require valid JWT token
6. Consider using a reverse proxy (nginx) with HTTPS in production
7. Restrict access with firewall rules (recommended)

## Development

### Project Structure
```
ServerAdminPanel/
├── pom.xml
├── src/main/
│   ├── java/de/kaicraft/adminpanel/
│   │   ├── ServerAdminPanelPlugin.java    # Main plugin class
│   │   ├── web/
│   │   │   ├── WebServer.java             # Javalin server setup
│   │   │   └── WebSocketHandler.java      # WebSocket handling
│   │   ├── api/
│   │   │   ├── AuthAPI.java               # Authentication endpoints
│   │   │   ├── DashboardAPI.java          # Dashboard endpoints
│   │   │   ├── ConsoleAPI.java            # Console endpoints
│   │   │   └── PluginAPI.java             # Plugin management
│   │   ├── auth/
│   │   │   ├── AuthManager.java           # User management
│   │   │   ├── AuthMiddleware.java        # Route protection
│   │   │   └── JWTUtil.java               # JWT utilities
│   │   └── config/
│   │       └── ConfigManager.java         # Config handling
│   └── resources/
│       ├── plugin.yml
│       └── config.yml
```

### Building
```bash
# Clean build
mvn clean package

# Skip tests
mvn clean package -DskipTests

# Install to local repo
mvn clean install
```

## Testing

### Manual Testing Checklist
- [ ] Plugin loads without errors
- [ ] Web server starts on configured port
- [ ] Can login with default credentials
- [ ] JWT token is generated and valid
- [ ] Dashboard returns correct server stats
- [ ] WebSocket console connects successfully
- [ ] Live logs stream to WebSocket clients
- [ ] Can execute commands via API
- [ ] Plugin list endpoint returns data
- [ ] Can disable/enable plugins
- [ ] Can reload plugin configs

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'
```

**Get Stats:**
```bash
curl http://localhost:8080/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Execute Command:**
```bash
curl -X POST http://localhost:8080/api/console/command \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"command":"say Hello from API"}'
```

## Troubleshooting

### Web server won't start
- Check if port 8080 is already in use
- Verify Java version (must be 21+)
- Check server logs for detailed errors

### Authentication fails
- Verify credentials in `users.txt`
- Check JWT secret is generated in config
- Ensure system time is correct (JWT uses timestamps)

### WebSocket disconnects
- Check token is valid and not expired
- Verify network allows WebSocket connections
- Check for proxy/firewall issues

### Console not streaming
- Verify Log4j appender is initialized
- Check WebSocket clients are connected
- Review server logs for errors

## Roadmap

### Phase 2 (Planned)
- Web frontend (React/Vue)
- Player management
- World management
- File editor
- Backup system
- Multi-user support with roles
- Two-factor authentication
- Audit logging

### Phase 3 (Future)
- Mobile app
- Advanced monitoring
- Automated tasks/schedules
- Plugin marketplace integration
- Multi-server support

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is for educational purposes. Please ensure compliance with Minecraft EULA and Paper license terms.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the documentation
- Review API examples

## Credits

- Built for Paper 1.21.1
- Uses Javalin web framework
- JWT authentication by Auth0
- Password hashing with BCrypt

---

**Version:** 1.0.0-SNAPSHOT
**Author:** Kai
**Repository:** https://github.com/aerohdev/Minecraft-Admin-WebApp
