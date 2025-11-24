import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Shield, Plus, Trash2, Key, AlertCircle, CheckCircle, X, Users as UsersIcon, UserCog, Save } from 'lucide-react';
import { Permission, PERMISSION_INFO, PERMISSION_CATEGORIES, getPermissionsByCategory } from '../constants/permissions';

interface User {
  username: string;
  role: string;
  roleDisplayName: string;
  isCurrentUser?: boolean;
  isDefaultAdmin?: boolean;
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

type TabType = 'users' | 'roles';

export default function UserRoleManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  
  // Role management state
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<string>('viewer');
  const [userPermissions, setUserPermissions] = useState<UserPermissionsData | null>(null);
  const [customPermissions, setCustomPermissions] = useState<Set<string>>(new Set());
  
  // Common state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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

      if (usersRes.data) {
        const usersArray = Array.isArray(usersRes.data) ? usersRes.data : [];
        setUsers(usersArray);
        const currentUser = usersArray.find((u: User) => u.isCurrentUser);
        setIsCurrentUserAdmin(currentUser?.isDefaultAdmin || false);
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

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  // User Management Functions
  const handleCreateUser = async (username: string, password: string) => {
    try {
      setActionLoading(true);
      await apiClient.post('/users', { username, password });
      showSuccess('User created successfully');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (username: string, password: string) => {
    try {
      setActionLoading(true);
      await apiClient.put(`/users/${username}/password`, { password });
      showSuccess('Password changed successfully');
      setShowPasswordModal(false);
      setSelectedUserForAction(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    try {
      setActionLoading(true);
      await apiClient.delete(`/users/${username}`);
      showSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUserForAction(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Role Management Functions
  const loadUserPermissions = async (username: string) => {
    try {
      setError(null);
      const res = await apiClient.get(`/users/${username}/permissions`);
      
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
      
      await apiClient.put(`/users/${selectedUser}/role`, { role: newRole });
      
      setSuccess('Role updated successfully');
      await loadData();
      await loadUserPermissions(selectedUser);
    } catch (err) {
      setError('Failed to update role');
      console.error('Update role error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    const newPermissions = new Set(customPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setCustomPermissions(newPermissions);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      setError(null);

      await apiClient.put(`/users/${selectedUser}/permissions`, {
        permissions: Array.from(customPermissions),
      });

      setSuccess('Permissions updated successfully');
      await loadData();
    } catch (err) {
      setError('Failed to update permissions');
      console.error('Update permissions error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkRoleAssignment = async () => {
    if (selectedUsers.size === 0) {
      setError('Please select at least one user');
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
    } catch (err) {
      setError('Failed to assign roles');
      console.error('Bulk role assignment error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserSelection = (username: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(username)) {
      newSelection.delete(username);
    } else {
      newSelection.add(username);
    }
    setSelectedUsers(newSelection);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">User & Role Management</h1>
        <p className="text-gray-400">Manage users, roles, and permissions</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-500">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-border">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <UsersIcon className="w-5 h-5" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'roles'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <UserCog className="w-5 h-5" />
          Roles & Permissions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' ? (
        <UsersTab
          users={users}
          isCurrentUserAdmin={isCurrentUserAdmin}
          onCreateUser={() => setShowCreateModal(true)}
          onChangePassword={(username) => {
            setSelectedUserForAction(username);
            setShowPasswordModal(true);
          }}
          onDeleteUser={(username) => {
            setSelectedUserForAction(username);
            setShowDeleteModal(true);
          }}
        />
      ) : (
        <RolesTab
          users={users}
          roles={roles}
          permissions={permissions}
          selectedUser={selectedUser}
          selectedUsers={selectedUsers}
          bulkRole={bulkRole}
          userPermissions={userPermissions}
          customPermissions={customPermissions}
          isSaving={isSaving}
          onUserSelect={handleUserSelect}
          onRoleChange={handleRoleChange}
          onPermissionToggle={handlePermissionToggle}
          onSavePermissions={handleSavePermissions}
          onBulkRoleChange={setBulkRole}
          onBulkRoleAssignment={handleBulkRoleAssignment}
          onToggleUserSelection={toggleUserSelection}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateUser}
          isLoading={actionLoading}
        />
      )}

      {showPasswordModal && selectedUserForAction && (
        <PasswordModal
          username={selectedUserForAction}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUserForAction(null);
          }}
          onChangePassword={handleChangePassword}
          isLoading={actionLoading}
        />
      )}

      {showDeleteModal && selectedUserForAction && (
        <DeleteUserModal
          username={selectedUserForAction}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUserForAction(null);
          }}
          onDelete={handleDeleteUser}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}

// Users Tab Component
function UsersTab({
  users,
  isCurrentUserAdmin,
  onCreateUser,
  onChangePassword,
  onDeleteUser,
}: {
  users: User[];
  isCurrentUserAdmin: boolean;
  onCreateUser: () => void;
  onChangePassword: (username: string) => void;
  onDeleteUser: (username: string) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={onCreateUser}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create User
        </button>
      </div>

      <div className="bg-light-card dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-light-surface dark:bg-dark-hover border-b border-light-border dark:border-dark-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-light-text-secondary dark:text-gray-300">Username</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-light-text-secondary dark:text-gray-300">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-light-text-secondary dark:text-gray-300">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-light-text-secondary dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {users.map((user) => (
              <tr key={user.username} className="hover:bg-dark-hover transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="text-white font-medium">{user.username}</span>
                    {user.isCurrentUser && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' :
                    user.role === 'moderator' ? 'bg-purple-500/20 text-purple-400' :
                    user.role === 'support' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.roleDisplayName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {(isCurrentUserAdmin || user.isCurrentUser) && (
                      <button
                        onClick={() => onChangePassword(user.username)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        Change Password
                      </button>
                    )}
                    
                    {isCurrentUserAdmin && !user.isCurrentUser && !user.isDefaultAdmin && (
                      <button
                        onClick={() => onDeleteUser(user.username)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Roles Tab Component
function RolesTab({
  users,
  roles,
  permissions,
  selectedUser,
  selectedUsers,
  bulkRole,
  userPermissions,
  customPermissions,
  isSaving,
  onUserSelect,
  onRoleChange,
  onPermissionToggle,
  onSavePermissions,
  onBulkRoleChange,
  onBulkRoleAssignment,
  onToggleUserSelection,
}: {
  users: User[];
  roles: Role[];
  permissions: string[];
  selectedUser: string | null;
  selectedUsers: Set<string>;
  bulkRole: string;
  userPermissions: UserPermissionsData | null;
  customPermissions: Set<string>;
  isSaving: boolean;
  onUserSelect: (username: string) => void;
  onRoleChange: (role: string) => void;
  onPermissionToggle: (permission: string) => void;
  onSavePermissions: () => void;
  onBulkRoleChange: (role: string) => void;
  onBulkRoleAssignment: () => void;
  onToggleUserSelection: (username: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User List */}
      <div className="lg:col-span-1">
        <div className="bg-light-card dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-4">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-white mb-4">Select User</h3>
          
          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
              <div className="text-sm text-blue-400 mb-2">{selectedUsers.size} user(s) selected</div>
              <div className="flex gap-2">
                <select
                  value={bulkRole}
                  onChange={(e) => onBulkRoleChange(e.target.value)}
                  className="flex-1 px-3 py-2 bg-dark-hover border border-dark-border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onBulkRoleAssignment}
                  disabled={isSaving}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Assign'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.username}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.username)}
                  onChange={() => onToggleUserSelection(user.username)}
                  className="w-4 h-4"
                />
                <button
                  onClick={() => onUserSelect(user.username)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedUser === user.username
                      ? 'bg-blue-600 text-white'
                      : 'bg-dark-hover text-gray-300 hover:bg-dark-border'
                  }`}
                >
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs opacity-70">{user.roleDisplayName}</div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="lg:col-span-2">
        {selectedUser && userPermissions ? (
          <div className="space-y-6">
            {/* Role Selection */}
            <div className="bg-light-card dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-6">
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-white mb-4">User Role</h3>
              <div className="flex items-center gap-4">
                <select
                  value={userPermissions.role}
                  onChange={(e) => onRoleChange(e.target.value)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-dark-hover border border-dark-border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Permissions */}
            <div className="bg-light-card dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-white">Custom Permissions</h3>
                <button
                  onClick={onSavePermissions}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, label]) => {
                  const categoryPerms = getPermissionsByCategory(category);
                  const availablePerms = categoryPerms.filter(p => permissions.includes(p));
                  
                  if (availablePerms.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">{label}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availablePerms.map((permission) => {
                          const info = PERMISSION_INFO[permission];
                          if (!info) return null;

                          return (
                            <label
                              key={permission}
                              className="flex items-start gap-3 p-3 bg-dark-hover rounded-lg cursor-pointer hover:bg-dark-border transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={customPermissions.has(permission)}
                                onChange={() => onPermissionToggle(permission)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="text-white font-medium text-sm">{info.name}</div>
                                <div className="text-gray-400 text-xs">{info.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-light-card dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-12 text-center">
            <UserCog className="w-16 h-16 text-light-text-muted dark:text-gray-600 mx-auto mb-4" />
            <p className="text-light-text-muted dark:text-gray-400">Select a user to manage their role and permissions</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Create User Modal
function CreateUserModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (username: string, password: string) => void;
  isLoading: boolean;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onCreate(username, password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-light-card dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-white mb-4">Create New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-light-text-secondary dark:text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-light-surface dark:bg-dark-hover border border-light-border dark:border-dark-border text-light-text-primary dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-dark-hover border border-dark-border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Password Modal
function PasswordModal({
  username,
  onClose,
  onChangePassword,
  isLoading,
}: {
  username: string;
  onClose: () => void;
  onChangePassword: (username: string, password: string) => void;
  isLoading: boolean;
}) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onChangePassword(username, password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-light-card dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-white mb-4">Change Password</h2>
        <p className="text-light-text-muted dark:text-gray-400 mb-4">Changing password for: <span className="text-light-text-primary dark:text-white font-medium">{username}</span></p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-light-text-secondary dark:text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-light-surface dark:bg-dark-hover border border-light-border dark:border-dark-border text-light-text-primary dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete User Modal
function DeleteUserModal({
  username,
  onClose,
  onDelete,
  isLoading,
}: {
  username: string;
  onClose: () => void;
  onDelete: (username: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-light-card dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-white mb-4">Delete User</h2>
        <p className="text-light-text-muted dark:text-gray-400 mb-4">
          Are you sure you want to delete <span className="text-light-text-primary dark:text-white font-medium">{username}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-light-surface dark:bg-dark-hover hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(username)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
