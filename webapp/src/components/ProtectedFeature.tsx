import React, { ReactNode } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { Permission } from '../constants/permissions';

interface ProtectedFeatureProps {
  /** Required permission(s) to show the feature */
  permission?: Permission;
  /** Alternative: require ANY of these permissions */
  anyPermission?: Permission[];
  /** Alternative: require ALL of these permissions */
  allPermissions?: Permission[];
  /** Content to show when permission is denied (optional) */
  fallback?: ReactNode;
  /** Children to render if permission check passes */
  children: ReactNode;
}

/**
 * Component that conditionally renders content based on user permissions
 * 
 * Usage examples:
 * - Single permission: <ProtectedFeature permission={Permission.BAN_PLAYERS}>...</ProtectedFeature>
 * - Any of several: <ProtectedFeature anyPermission={[Permission.VIEW_PLAYERS, Permission.KICK_PLAYERS]}>...</ProtectedFeature>
 * - All required: <ProtectedFeature allPermissions={[Permission.VIEW_CONSOLE, Permission.EXECUTE_COMMANDS]}>...</ProtectedFeature>
 * - With fallback: <ProtectedFeature permission={Permission.MANAGE_USERS} fallback={<div>Access Denied</div>}>...</ProtectedFeature>
 */
export function ProtectedFeature({
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  children,
}: ProtectedFeatureProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(...anyPermission);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(...allPermissions);
  } else {
    // If no permission is specified, allow access by default
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of ProtectedFeature
 * Wraps a component and only renders it if user has the required permission
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedFeature permission={permission}>
        <Component {...props} />
      </ProtectedFeature>
    );
  };
}
