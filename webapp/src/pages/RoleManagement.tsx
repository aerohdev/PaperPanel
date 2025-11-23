import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Permission, PERMISSION_INFO, PERMISSION_CATEGORIES, getPermissionsByCategory } from '../constants/permissions';

interface User {
  username: string;
  role: string;
  roleDisplayName: string;
}

interface Role {
  key: string;
  displayName: string;
  permissions: string[];
}

interface UserPermissionsData {
  username: string;
  role: string;
  roleDisplayName: string;
  permissions: string[];
}

export function RoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<string>('viewer');
  const [userPermissions, setUserPermissions] = useState<UserPermissionsData | null>(null);
  const [customPermissions, setCustomPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usersRes, rolesRes, permsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/roles'),
        apiClient.get('/permissions'),
      ]);

      console.log('Users response:', usersRes.data);
      console.log('Roles response:', rolesRes.data);
      console.log('Permissions response:', permsRes.data);

      if (usersRes.data) {
        setUsers(usersRes.data);
      }

      if (rolesRes.data) {
        setRoles(rolesRes.data);
      }

      if (permsRes.data) {
        setPermissions(permsRes.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPermissions = async (username: string) => {
    try {
      setError(null);
      const res = await apiClient.get(`/users/${username}/permissions`);
      
      console.log('User permissions response:', res.data);
      
      if (res.data) {
        setUserPermissions(res.data);
        setCustomPermissions(new Set(res.data.permissions || []));
      }
    } catch (err) {
      setError('Failed to load user permissions');
      console.error('Load user permissions error:', err);
    }
  };

  const handleUserSelect = (username: string) => {
    setSelectedUser(username);
    setSuccess(null);
    setError(null);
    loadUserPermissions(username);
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await apiClient.put(`/users/${selectedUser}/role`, { role: newRole });

      setSuccess(`Role updated to ${newRole}`);
      await loadData();
      await loadUserPermissions(selectedUser);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    const newPerms = new Set(customPermissions);
    if (newPerms.has(permission)) {
      newPerms.delete(permission);
    } else {
      newPerms.add(permission);
    }
    setCustomPermissions(newPerms);
  };

  const handleSaveCustomPermissions = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await apiClient.put(`/users/${selectedUser}/permissions`, {
        permissions: Array.from(customPermissions),
      });

      setSuccess('Custom permissions saved');
      await loadData();
      await loadUserPermissions(selectedUser);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserSelection = (username: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(username)) {
      newSelection.delete(username);
    } else {
      newSelection.add(username);
    }
    setSelectedUsers(newSelection);
  };

  const handleBulkRoleAssignment = async () => {
    if (selectedUsers.size === 0) {
      setError('No users selected for bulk assignment');
      return;
    }

    if (!confirm(`Assign role "${bulkRole}" to ${selectedUsers.size} selected user(s)?`)) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const promises = Array.from(selectedUsers).map(username =>
        apiClient.put(`/users/${username}/role`, { role: bulkRole })
      );

      await Promise.all(promises);

      setSuccess(`Successfully assigned ${bulkRole} role to ${selectedUsers.size} user(s)`);
      setSelectedUsers(new Set());
      await loadData();
      if (selectedUser) {
        await loadUserPermissions(selectedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign roles');
    } finally {
      setIsSaving(false);
    }
  };

  const permissionsByCategory = getPermissionsByCategory();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading role management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-600 mt-2">Manage user roles and permissions for PaperPanel access</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            {selectedUsers.size > 0 && (
              <p className="text-sm text-gray-600 mt-1">{selectedUsers.size} selected</p>
            )}
          </div>
          <div className="p-4">
            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    {roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.displayName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkRoleAssignment}
                    disabled={isSaving}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
            )}

            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.username}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedUser === user.username
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.username)}
                    onChange={() => handleUserSelection(user.username)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <button
                    onClick={() => handleUserSelect(user.username)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-gray-900">{user.username}</div>
                    <div className="text-sm text-gray-600">{user.roleDisplayName}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role & Permission Editor */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          {selectedUser && userPermissions ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Permissions: {selectedUser}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Current Role: <span className="font-medium">{userPermissions.roleDisplayName}</span>
                </p>
              </div>

              <div className="p-6">
                {/* Role Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Role
                  </label>
                  <select
                    value={userPermissions.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a predefined role, or select "Custom" to manually configure permissions
                  </p>
                </div>

                {/* Custom Permissions (only show if role is custom) */}
                {userPermissions.role === 'custom' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-semibold text-gray-900">Custom Permissions</h3>
                      <button
                        onClick={handleSaveCustomPermissions}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Permissions'}
                      </button>
                    </div>

                    <div className="space-y-6">
                      {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, categoryName]) => {
                        const categoryPerms = permissionsByCategory[categoryKey] || [];
                        if (categoryPerms.length === 0) return null;

                        // Skip system category (SUPER_ADMIN)
                        if (categoryKey === 'system') return null;

                        return (
                          <div key={categoryKey} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">{categoryName}</h4>
                            <div className="space-y-2">
                              {categoryPerms.map((perm) => {
                                const info = PERMISSION_INFO[perm as Permission];
                                if (!info) return null;

                                return (
                                  <label
                                    key={perm}
                                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={customPermissions.has(perm)}
                                      onChange={() => handlePermissionToggle(perm)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{info.displayName}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Show current permissions for non-custom roles */}
                {userPermissions.role !== 'custom' && (
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-900">Included Permissions</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {userPermissions.permissions
                          .filter((p) => p !== Permission.SUPER_ADMIN)
                          .map((perm) => {
                            const info = PERMISSION_INFO[perm as Permission];
                            return (
                              <div key={perm} className="flex items-center space-x-2">
                                <svg
                                  className="w-4 h-4 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span className="text-sm text-gray-700">
                                  {info?.displayName || perm}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p>Select a user to manage their role and permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Role Descriptions</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Admin:</strong> Full access to all features including user management</p>
          <p><strong>Moderator:</strong> Can manage players, whitelist, ops, and send broadcasts</p>
          <p><strong>Support:</strong> Can view and message players, access logs</p>
          <p><strong>Viewer:</strong> Read-only access to dashboard, players, and worlds</p>
          <p><strong>Custom:</strong> Manually configure specific permissions</p>
        </div>
      </div>
    </div>
  );
}
