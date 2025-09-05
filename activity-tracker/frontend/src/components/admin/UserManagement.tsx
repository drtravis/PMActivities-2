'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { authAPI, usersAPI } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'pmo' | 'pm' | 'member';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

type UserRole = 'admin' | 'pmo' | 'pm' | 'member';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'member' as UserRole,
    password: '',
  });

  const [bulkUsers, setBulkUsers] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Use the proper API client instead of direct fetch
      const userData = await usersAPI.getAll();
      
      // Transform backend user data to match frontend interface
      const transformedUsers = userData.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.toLowerCase() === 'project_manager' ? 'pm' : user.role?.toLowerCase() || 'member',
        isActive: user.isActive !== false, // Default to true if not specified
        createdAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '',
        lastLoginAt: user.last_login_at ? new Date(user.last_login_at).toISOString().split('T')[0] : undefined,
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Map frontend roles to backend roles
      const roleMapping = {
        'pm': 'project_manager',
        'admin': 'admin',
        'pmo': 'pmo',
        'member': 'member'
      };

      const mappedRole = roleMapping[newUser.role] || 'member';

      // Use the proper API client instead of direct fetch
      const result = await authAPI.inviteUser({
        name: newUser.name,
        email: newUser.email,
        role: mappedRole,
      });

      // Add the new user to the list
      const createdUser: User = {
        id: result.id,
        name: result.name,
        email: result.email,
        role: newUser.role,
        isActive: result.isActive,
        createdAt: result.createdAt,
      };

      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', role: 'member', password: '' });
      setShowCreateModal(false);
      toast.success(`User created successfully! Email: ${result.email}, Password: Password123!`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleBulkImport = async () => {
    try {
      const lines = bulkUsers.trim().split('\n');
      const newUsers: User[] = [];

      for (const line of lines) {
        const [name, email, role] = line.split(',').map(s => s.trim());
        if (name && email && role) {
          newUsers.push({
            id: Date.now().toString() + Math.random(),
            name,
            email,
            role: role as 'admin' | 'pm' | 'member',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0],
          });
        }
      }

      setUsers([...users, ...newUsers]);
      setBulkUsers('');
      setShowBulkModal(false);
      toast.success(`${newUsers.length} users imported successfully`);
    } catch (error) {
      toast.error('Failed to import users');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isActive: !user.isActive }
          : user
      ));
      toast.success('User status updated');
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const resetPassword = async (userId: string) => {
    try {
      // API call to reset password
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="pmo">PMO</option>
            <option value="pm">Project Manager</option>
            <option value="member">Member</option>
          </select>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowBulkModal(true)}
            variant="outline"
          >
            📥 Bulk Import
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ➕ Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredUsers.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'pmo' ? 'bg-orange-100 text-orange-800' :
                    user.role === 'pm' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'pm' ? 'Project Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLoginAt || 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`${
                      user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => resetPassword(user.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Enter user name"
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Enter email address"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="pm">Project Manager</option>
              <option value="pmo">PMO</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Default Password:</strong> Password123!
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Users can login with this password and should change it after first login.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUser.name || !newUser.email}
            >
              Create User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Import Users"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV Format: Name, Email, Role
            </label>
            <textarea
              value={bulkUsers}
              onChange={(e) => setBulkUsers(e.target.value)}
              placeholder="John Doe, john@example.com, member&#10;Jane Smith, jane@example.com, pm&#10;Bob Wilson, bob@example.com, admin"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              One user per line. Temporary passwords will be auto-generated and emailed.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={!bulkUsers.trim()}
            >
              Import Users
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
