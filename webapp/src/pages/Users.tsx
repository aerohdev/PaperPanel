import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import client from '../api/client';
import { Shield, Plus, Trash2, Key, AlertCircle, CheckCircle, X } from 'lucide-react';
import type { UserInfo } from '../types/api';
import { useToast } from '../contexts/ToastContext';

export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await client.get<UserInfo[]>('/users');
      const usersArray = Array.isArray(response.data) ? response.data : [];
      setUsers(usersArray);
      // Check if current user is default admin
      const currentUser = usersArray.find(u => u.isCurrentUser);
      setIsCurrentUserAdmin(currentUser?.isDefaultAdmin || false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleCreateUser = async (username: string, password: string) => {
    try {
      setActionLoading(true);
      await client.post('/users', { username, password });
      toast.success('User created successfully');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (username: string, password: string) => {
    try {
      setActionLoading(true);
      await client.put(`/users/${username}/password`, { password });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    try {
      setActionLoading(true);
      await client.delete(`/users/${username}`);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-white mb-2">User Management</h1>
          <p className="text-light-text-muted dark:text-gray-400">Manage PaperPanel users and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create User
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-500">{successMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-light-card dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-light-surface dark:bg-dark-hover border-b border-light-border dark:border-dark-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-light-text-secondary dark:text-gray-300">Username</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-light-text-secondary dark:text-gray-300">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-light-text-secondary dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {users.map((user) => (
              <tr key={user.username} className="hover:bg-light-surface dark:hover:bg-dark-hover transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="text-light-text-primary dark:text-white font-medium">{user.username}</span>
                    {user.isCurrentUser && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        You
                      </span>
                    )}
                    {user.isDefaultAdmin && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {(isCurrentUserAdmin || user.isCurrentUser) ? (
                      <button
                        onClick={() => {
                          setSelectedUser(user.username);
                          setShowPasswordModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        Change Password
                      </button>
                    ) : (
                      <span 
                        className="flex items-center gap-2 px-3 py-2 text-gray-500 text-sm"
                        title="Only admin can change other users' passwords"
                      >
                        <Key className="w-4 h-4" />
                        No Access
                      </span>
                    )}
                    
                    {isCurrentUserAdmin && !user.isCurrentUser && !user.isDefaultAdmin && (
                      <button
                        onClick={() => {
                          setSelectedUser(user.username);
                          setShowDeleteModal(true);
                        }}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateUser}
          loading={actionLoading}
        />
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <PasswordModal
          username={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleChangePassword}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteModal
          username={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDeleteUser}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Create User Modal Component
interface CreateUserModalProps {
  onClose: () => void;
  onCreate: (username: string, password: string) => void;
  loading: boolean;
}

function CreateUserModal({ onClose, onCreate, loading }: CreateUserModalProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one digit';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setValidationError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    onCreate(username.trim(), password);
  };

  return (
    <Modal title="Create New User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500 text-sm">{validationError}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-light-surface dark:bg-dark-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-light-surface dark:bg-dark-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Min 8 chars, uppercase, lowercase, digit, special char
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-light-surface dark:bg-dark-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm password"
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-light-surface dark:bg-dark-hover hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Password Modal Component
interface PasswordModalProps {
  username: string;
  onClose: () => void;
  onSubmit: (username: string, password: string) => void;
  loading: boolean;
}

function PasswordModal({ username, onClose, onSubmit, loading }: PasswordModalProps) {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one digit';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    const pwdError = validatePassword(password);
    if (pwdError) {
      setValidationError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    onSubmit(username, password);
  };

  return (
    <Modal title={`Change Password for ${username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500 text-sm">{validationError}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-light-surface dark:bg-dark-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new password"
            disabled={loading}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Min 8 chars, uppercase, lowercase, digit, special char
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-light-surface dark:bg-dark-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm new password"
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-light-surface dark:bg-dark-hover hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Delete Confirmation Modal
interface DeleteModalProps {
  username: string;
  onClose: () => void;
  onConfirm: (username: string) => void;
  loading: boolean;
}

function DeleteModal({ username, onClose, onConfirm, loading }: DeleteModalProps) {
  return (
    <Modal title="Delete User" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium mb-2">Are you sure?</p>
              <p className="text-light-text-muted dark:text-gray-400 text-sm">
                You are about to delete user <strong className="text-light-text-primary dark:text-white">{username}</strong>. 
                This action cannot be undone and the user will immediately lose access to PaperPanel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => onConfirm(username)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-light-surface dark:bg-dark-hover hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Reusable Modal Component
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-light-card dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-light-text-muted dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
