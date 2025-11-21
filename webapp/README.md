# PaperPanel - Frontend

Modern React-based web interface for managing Minecraft Paper servers.

## Features

- 🔐 **JWT Authentication** - Secure login system
- 📊 **Real-time Dashboard** - Live server statistics (TPS, memory, players, uptime)
- 🖥️ **Live Console** - WebSocket-based real-time console with command execution
- 🔌 **Plugin Management** - Enable, disable, and reload plugins
- 🎨 **Dark Mode UI** - Beautiful dark theme optimized for long sessions
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library
- **WebSocket** - Real-time console streaming

## Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:8080`

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server (runs on http://localhost:3000)
npm run dev
```

The dev server includes:
- Hot module replacement (HMR)
- Proxy to backend API at `http://localhost:8080`
- WebSocket proxy for console streaming

## Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The production build will be in the `dist/` folder.

## Project Structure

```
webapp/
├── public/              # Static assets
├── src/
│   ├── api/
│   │   └── client.js    # Axios client with interceptors
│   ├── components/
│   │   ├── Layout.jsx   # Main layout wrapper
│   │   ├── Sidebar.jsx  # Navigation sidebar
│   │   ├── Header.jsx   # Top header bar
│   │   └── ProtectedRoute.jsx  # Auth guard
│   ├── contexts/
│   │   └── AuthContext.jsx  # Authentication state
│   ├── hooks/
│   │   └── useWebSocket.js  # WebSocket hook
│   ├── pages/
│   │   ├── Login.jsx       # Login page
│   │   ├── Dashboard.jsx   # Server stats dashboard
│   │   ├── Console.jsx     # Live console
│   │   └── Plugins.jsx     # Plugin management
│   ├── styles/
│   │   └── index.css    # Global styles + Tailwind
│   ├── App.jsx          # Route configuration
│   └── main.jsx         # Entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Pages

### Login
- Username/password authentication
- JWT token storage
- Error handling
- Auto-redirect if already logged in

### Dashboard
- Real-time server statistics
- TPS monitoring with color-coded status
- Memory usage visualization
- Player count
- Server uptime
- World and chunk information
- Auto-refreshes every 5 seconds

### Console
- Live log streaming via WebSocket
- Command execution
- Command history (use ↑ ↓ arrows)
- Auto-scroll to latest logs
- Color-coded log levels (INFO, WARN, ERROR)
- Connection status indicator
- Clear console button

### Plugins
- List all installed plugins
- Search/filter plugins
- Enable/disable plugins
- Reload plugin configurations
- View plugin details (version, author, dependencies)
- Status indicators

## Configuration

### API Endpoint

The API endpoint is configured in `src/api/client.js`:

```javascript
const API_URL = 'http://localhost:8080/api';
```

For production, update this to your server's URL.

### WebSocket URL

WebSocket connections are configured in each component that uses them:

```javascript
useWebSocket('ws://localhost:8080/ws/console')
```

### Vite Proxy

The dev server proxy is configured in `vite.config.js`:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:8080',
    '/ws': {
      target: 'ws://localhost:8080',
      ws: true
    }
  }
}
```

## Authentication Flow

1. User enters credentials on `/login`
2. API call to `POST /api/auth/login`
3. JWT token received and stored in localStorage
4. Token attached to all subsequent API requests via Axios interceptor
5. Protected routes check for token existence
6. 401 responses automatically redirect to login

## WebSocket Features

The console page uses WebSocket for real-time communication:

- **Auto-reconnect** - Automatically reconnects if connection is lost
- **Connection status** - Visual indicator of connection state
- **Message types**:
  - `log` - Console log messages
  - `command` - Command execution requests
  - `connected` - Connection established
  - `error` - Error messages

## Styling

The app uses a custom dark theme with TailwindCSS:

- Background: `#1a1a1a`
- Surface: `#2d2d2d`
- Border: `#404040`
- Hover: `#3a3a3a`

Colors are defined in `tailwind.config.js` and can be customized.

## Development Tips

### Hot Reload
Vite provides instant hot module replacement. Changes to components will reflect immediately without page refresh.

### API Testing
Use browser DevTools Network tab to inspect API calls. All requests include the JWT token in the Authorization header.

### WebSocket Debugging
Open browser console to see WebSocket connection events and messages.

### Component Development
Each page component is self-contained and can be developed independently.

## Troubleshooting

### Cannot connect to backend
- Ensure backend server is running on `http://localhost:8080`
- Check CORS settings in backend
- Verify API endpoints match

### WebSocket not connecting
- Check backend WebSocket endpoint is accessible
- Verify JWT token is valid
- Check browser console for errors

### Login fails
- Verify credentials (default: admin/changeme)
- Check backend `/api/auth/login` endpoint
- Inspect network request/response in DevTools

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Update dependencies: `npm update`

## Production Deployment

### Static Hosting

Build and deploy the `dist/` folder to any static host:

```bash
npm run build
# Upload dist/ folder to hosting service
```

### Environment Variables

For production, create a `.env.production` file:

```env
VITE_API_URL=https://your-server.com/api
VITE_WS_URL=wss://your-server.com/ws
```

Update `src/api/client.js` to use:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

### Nginx Configuration

Example nginx config for serving the frontend:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Lazy loading of routes
- Optimized bundle size with Vite
- Efficient re-renders with React hooks
- WebSocket connection pooling

## Security

- JWT tokens stored in localStorage
- Automatic token refresh on 401
- CSRF protection via JWT
- XSS protection via React
- Secure WebSocket connections in production (wss://)

## Contributing

1. Follow the existing code style
2. Use functional components with hooks
3. Add comments for complex logic
4. Test on multiple screen sizes

## License

Part of the PaperPanel project.

---

**Built with ❤️ for Minecraft Server Administrators**
