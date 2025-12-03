import React, { ReactNode } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { Permission, PERMISSION_INFO } from '../constants/permissions';

interface PermissionTooltipProps {
  /** Required permission(s) to enable the feature */
  permission?: Permission;
  /** Alternative: require ANY of these permissions */
  anyPermission?: Permission[];
  /** Alternative: require ALL of these permissions */
  allPermissions?: Permission[];
  /** Children to render (will be wrapped in a disabled state if no permission) */
  children: ReactNode;
  /** Custom disabled message */
  disabledMessage?: string;
}

/**
 * Component that wraps UI elements and shows a tooltip when user lacks permission
 * The wrapped element will be disabled and show an explanatory tooltip
 * 
 * Usage:
 * <PermissionTooltip permission={Permission.BAN_PLAYERS}>
 *   <button>Ban Player</button>
 * </PermissionTooltip>
 */
export function PermissionTooltip({
  permission,
  anyPermission,
  allPermissions,
  children,
  disabledMessage,
}: PermissionTooltipProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;
  let requiredPermissions: Permission[] = [];

  if (permission) {
    hasAccess = hasPermission(permission);
    requiredPermissions = [permission];
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(...anyPermission);
    requiredPermissions = anyPermission;
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(...allPermissions);
    requiredPermissions = allPermissions;
  } else {
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Build tooltip message
  let tooltipMessage = disabledMessage;
  if (!tooltipMessage) {
    const permNames = requiredPermissions
      .map(p => PERMISSION_INFO[p]?.displayName || p)
      .join(', ');
    tooltipMessage = `Missing permission: ${permNames}`;
  }

  return (
    <div className="relative group inline-block">
      <div className="opacity-50 cursor-not-allowed pointer-events-none">
        {children}
      </div>
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-3 py-2
        bg-gray-900/95 dark:bg-gray-800/95
        backdrop-blur-xl
        text-white text-xs
        rounded-lg
        whitespace-nowrap
        opacity-0 group-hover:opacity-100
        transition-opacity
        pointer-events-none z-50
        shadow-[0_4px_20px_rgba(0,0,0,0.4)]
        border border-white/20
      ">
        {tooltipMessage}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900/95 dark:border-t-gray-800/95"></div>
        </div>
      </div>
    </div>
  );
}
