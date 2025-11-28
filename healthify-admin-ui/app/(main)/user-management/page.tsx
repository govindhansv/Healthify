'use client';
 
import { useState, useEffect, useCallback } from 'react';
import { apiFetch, UserRole } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { FaEdit, FaTrashAlt, FaSpinner, FaUserShield, FaUser } from 'react-icons/fa';

interface User {
  _id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface UserFormProps {
  onSuccess: () => void;
  initialData: User | null;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onSuccess, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    role: initialData?.role || 'user',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialData;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { password, confirmPassword, ...dataToSubmit } = formData;
    const payload: any = { ...dataToSubmit };

    if (password) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      payload.password = password;
    }

    try {
      const method: 'PUT' = 'PUT';
      const endpoint = `/admin/users/${initialData!._id}`;

      await apiFetch(endpoint, method, payload);

      alert('User updated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-xl font-semibold mb-4 text-primary">
        Edit User: {initialData?.email}
      </h3>

      {error && (
        <p className="text-danger mb-4 p-2 bg-red-100 rounded">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="block col-span-2">
          <span className="text-gray-700">Email *</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </label>

        <label className="block col-span-2">
          <span className="text-gray-700">Role *</span>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="col-span-2 text-sm pt-2 border-t mt-4">
          <p className="font-medium text-gray-700 mb-2">Password Reset (Optional)</p>
        </div>

        <label className="block">
          <span className="text-gray-700">New Password</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Leave blank to keep current password"
          />
        </label>
        <label className="block">
          <span className="text-gray-700">Confirm Password</span>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 bg-primary text-white rounded-md font-semibold hover:bg-green-600 disabled:bg-gray-400 transition-colors"
        >
          {loading ? (
            <FaSpinner className="animate-spin inline mr-2" />
          ) : (
            'Update User'
          )}
        </button>
      </div>
    </form>
  );
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const limit = 10;
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', String(limit));
      if (search.trim()) {
        query.set('q', search.trim());
      }

      const data = await apiFetch<{
        page: number;
        pages: number;
        data: User[];
      }>(`/admin/users?${query.toString()}`, 'GET');

      setUsers(data.data);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      setError(
        err.message || 'Failed to load users. Ensure backend is running and you are logged in as admin.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user: ${email}?`)) return;

    try {
      await apiFetch(`/admin/users/${id}`, 'DELETE');
      alert(`User ${email} deleted successfully!`);
      fetchUsers();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleCloseForm = () => {
    setEditingUser(null);
    setShowForm(false);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const tableContent = (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Created
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan={4} className="text-center py-4 text-gray-500">
              <FaSpinner className="animate-spin inline mr-2" /> Loading...
            </td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={4} className="text-center py-4 text-danger">{error}</td>
          </tr>
        ) : users.length === 0 ? (
          <tr>
            <td colSpan={4} className="text-center py-4 text-gray-500">No users found.</td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role === 'admin' ? (
                    <FaUserShield className="mr-1" />
                  ) : (
                    <FaUser className="mr-1" />
                  )}
                  {user.role.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  onClick={() => handleEdit(user)}
                  className="text-secondary hover:text-blue-800"
                >
                  <FaEdit className="inline" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id, user.email)}
                  className="text-danger hover:text-red-800"
                >
                  <FaTrashAlt className="inline" /> Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <CrudLayout
      title="User Management"
      subtitle="Manage and monitor all registered users in the system."
      onRefresh={fetchUsers}
      searchValue={search}
      onSearchChange={handleSearchChange}
      showForm={showForm}
      setShowForm={setShowForm}
      disableAdd={true}
      form={
        <UserForm
          onSuccess={fetchUsers}
          initialData={editingUser}
          onClose={handleCloseForm}
        />
      }
    >
      {tableContent}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <span>
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => (p >= totalPages ? p : p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </CrudLayout>
  );
}
