import { useState, useEffect } from 'react';
import client from '../api/client';
import { Shield, Plus, Trash2, Key, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await client.get('/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleCreateUser = async (username, password) => {
    try {
      setActionLoading(true);
      const response = await client.post('/users', { username, password });
      if (response.data.success) {
        showSuccess('User created successfully');
        setShowCreateModal(false);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (username, password) => {
    try {
      setActionLoading(true);
      const response = await client.put(`/users/${username}/password`, { password });
      if (response.data.success) {
        showSuccess('Password changed successfully');
        setShowPasswordModal(false);
        setSelectedUser(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (username) => {
    try {
      setActionLoading(true);
      const response = await client.delete(`/users/${username}`);
      if (response.data.success) {
        showSuccess('User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
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
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Manage admin panel users and permissions</p>
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
      <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-hover border-b border-dark-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Username</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
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
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
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
                    {!user.isCurrentUser && (
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
      {showPasswordModal && (
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
      {showDeleteModal && (
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
function CreateUserModal({ onClose, onCreate, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one digit';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = (e) => {
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Min 8 chars, uppercase, lowercase, digit, special char
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="flex-1 px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Password Modal Component
function PasswordModal({ username, onClose, onSubmit, loading }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one digit';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = (e) => {
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
          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new password"
            disabled={loading}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Min 8 chars, uppercase, lowercase, digit, special char
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="flex-1 px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Delete Confirmation Modal
function DeleteModal({ username, onClose, onConfirm, loading }) {
  return (
    <Modal title="Delete User" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium mb-2">Are you sure?</p>
              <p className="text-gray-400 text-sm">
                You are about to delete user <strong className="text-white">{username}</strong>. 
                This action cannot be undone and the user will immediately lose access to the admin panel.
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
            className="flex-1 px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Reusable Modal Component
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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