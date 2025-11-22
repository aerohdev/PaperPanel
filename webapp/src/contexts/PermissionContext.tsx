import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { Permission } from '../constants/permissions';

interface PermissionContextType {
  permissions: Set<Permission>;
  role: string | null;
  roleDisplayName: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (...permissions: Permission[]) => boolean;
  hasAllPermissions: (...permissions: Permission[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * Provider component that loads and manages user permissions
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [role, setRole] = useState<string | null>(null);
  const [roleDisplayName, setRoleDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Get current user from auth verification
      const authResponse = await apiClient.get('/api/v1/auth/verify');
      if (!authResponse.success || !authResponse.data) {
        setPermissions(new Set());
        setRole(null);
        setRoleDisplayName(null);
        setIsAdmin(false);
        return;
      }

      const username = authResponse.data.username;

      // Get user's permissions
      const permResponse = await apiClient.get(`/api/v1/users/${username}/permissions`);
      if (permResponse.success && permResponse.data) {
        const perms = new Set(permResponse.data.permissions || []);
        setPermissions(perms);
        setRole(permResponse.data.role);
        setRoleDisplayName(permResponse.data.roleDisplayName);
        
        // Check if user has SUPER_ADMIN permission (indicates ADMIN role)
        setIsAdmin(perms.has(Permission.SUPER_ADMIN));
      } else {
        // If we can't fetch permissions, assume minimal access
        setPermissions(new Set([Permission.VIEW_DASHBOARD]));
        setRole('viewer');
        setRoleDisplayName('Viewer');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions(new Set());
      setRole(null);
      setRoleDisplayName(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const hasPermission = (permission: Permission): boolean => {
    // Admin always has access to everything
    if (isAdmin) return true;
    return permissions.has(permission);
  };

  const hasAnyPermission = (...perms: Permission[]): boolean => {
    if (isAdmin) return true;
    return perms.some(p => permissions.has(p));
  };

  const hasAllPermissions = (...perms: Permission[]): boolean => {
    if (isAdmin) return true;
    return perms.every(p => permissions.has(p));
  };

  const refreshPermissions = async () => {
    await loadPermissions();
  };

  const value: PermissionContextType = {
    permissions,
    role,
    roleDisplayName,
    isAdmin,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context
 */
export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
