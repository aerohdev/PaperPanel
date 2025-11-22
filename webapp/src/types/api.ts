/**
 * Core API Response Types
 * These types will be supplemented by auto-generated types from Java backend
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

/**
 * Dashboard Types
 */
export interface MemoryInfo {
  used: number;
  max: number;
  usedMB: number;
  maxMB: number;
  percentage: number;
}

export interface DashboardStats {
  tps: number;
  onlinePlayers: number;
  maxPlayers: number;
  memory: MemoryInfo;
  uptime: number;
  uptimeFormatted: string;
  version: string;
  bukkitVersion: string;
  worlds: number;
  loadedChunks: number;
  plugins: number;
}

export interface UpdateStatus {
  updateAvailable: boolean;
  updateDownloaded: boolean;
  currentVersion: string;
  latestVersion?: string;
  latestBuild?: number;
  downloadUrl?: string;
  lastCheck: number;
  needsCheck: boolean;
}

export interface SecurityStatus {
  usingDefaultPassword: boolean;
}

/**
 * Player Types
 */
export interface LocationInfo {
  x: number;
  y: number;
  z: number;
  yaw?: number;
  pitch?: number;
}

export interface PlayerInfo {
  name: string;
  uuid: string;
  ping?: number;
  gameMode?: string;
  world?: string;
  location?: LocationInfo;
  level?: number;
  health?: number;
  maxHealth?: number;
  foodLevel?: number;
  online?: boolean;
  firstJoin?: number;
  lastSeen?: number;
  totalPlaytime?: number;
  banned?: boolean;
  stats?: Record<string, number>;
}

/**
 * Plugin Types
 */
export interface PluginInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  authors?: string[];
  website?: string;
  enabled: boolean;
  main?: string;
  apiVersion?: string;
  depends?: string[];
  softDepends?: string[];
  loadBefore?: string[];
  prefix?: string;
  commands?: Record<string, any>;
  permissions?: any[];
}

/**
 * World Types
 */
export interface SpawnLocation {
  x: number;
  y: number;
  z: number;
}

export interface WorldInfo {
  name: string;
  environment: string;
  playerCount?: number;
  players?: number;
  loadedChunks: number;
  entities?: number;
  seed: number;
  time: number;
  weatherDuration?: number;
  thundering?: boolean;
  storm?: boolean;
  pvp: boolean;
  difficulty: string;
  spawnLocation: SpawnLocation;
  autoSave?: boolean;
  keepSpawnInMemory?: boolean;
  hardcore?: boolean;
  allowAnimals?: boolean;
  allowMonsters?: boolean;
  gameRules?: {
    doDaylightCycle?: boolean;
    doWeatherCycle?: boolean;
    keepInventory?: boolean;
    mobGriefing?: boolean;
    doMobSpawning?: boolean;
    naturalRegeneration?: boolean;
    showDeathMessages?: boolean;
    announceAdvancements?: boolean;
    doFireTick?: boolean;
    doImmediateRespawn?: boolean;
    [key: string]: any;
  };
}

/**
 * User Management Types
 */
export interface UserInfo {
  username: string;
  isDefaultAdmin: boolean;
  isCurrentUser?: boolean;
  usingDefaultPassword?: boolean;
}

/**
 * Auth Types
 */
export interface AuthResponse {
  token: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Console Types
 */
export interface ConsoleHistoryResponse {
  lines: string[];
  total: number;
}

export interface CommandRequest {
  command: string;
}

/**
 * Broadcast Types
 */
export interface BroadcastMessageRequest {
  message: string;
  color?: string;
}

export interface BroadcastTitleRequest {
  title: string;
  subtitle?: string;
  fadeIn?: number;
  stay?: number;
  fadeOut?: number;
}

export interface BroadcastActionBarRequest {
  message: string;
}

export interface BroadcastSoundRequest {
  sound: string;
  volume?: number;
  pitch?: number;
}

/**
 * Log Viewer Types
 */
export interface LogFileInfo {
  name: string;
  type: string;
  size: number;
  modified: number;
  lines?: number;
}

export interface LogMatch {
  lineNumber: number;
  line: string;
  file?: string;
}

export interface LogSearchRequest {
  query: string;
  files?: string[];
  limit?: number;
}

export interface LogStreamMessage {
  type: 'line' | 'error' | 'connected' | 'disconnected';
  data?: string;
  message?: string;
}
