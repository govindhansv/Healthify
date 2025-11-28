'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { uploadImage } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner } from 'react-icons/fa';

// --- DATA TYPES ---
interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    createdAt: string;
}

// --- CATEGORY FORM COMPONENT ---
interface CategoryFormProps {
    onSuccess: () => void;
    initialData: Category | null;
    onClose: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSuccess, initialData, onClose }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        image: initialData?.image || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const isEdit = !!initialData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        try {
            const result = await uploadImage(file);
            setFormData(prev => ({ ...prev, image: result.url }));
        } catch (err: any) {
            setError(err.message || 'Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/categories/${initialData!._id}` : '/categories';
            
            await apiFetch(endpoint, method, formData);
            
            alert(`Category ${isEdit ? 'updated' : 'created'} successfully!`);
            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} category.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-4 text-primary">{isEdit ? 'Edit Category' : 'Create New Category'}</h3>
            
            {error && <p className="text-danger mb-4 p-2 bg-red-100 rounded">{error}</p>}
            
            <div className="space-y-4">
                <label className="block">
                    <span className="text-gray-700">Name *</span>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                </label>
                <label className="block">
                    <span className="text-gray-700">Description</span>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"></textarea>
                </label>
                <label className="block">
                    <span className="text-gray-700">Image URL</span>
                    <input type="url" name="image" value={formData.image} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                    <div className="mt-2 flex items-center gap-3 text-sm">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            disabled={uploading}
                            className="text-sm"
                        />
                        {uploading && (
                            <span className="text-gray-500 flex items-center">
                                <FaSpinner className="animate-spin inline mr-1" /> Uploading...
                            </span>
                        )}
                    </div>
                </label>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="py-2 px-4 bg-primary text-white rounded-md font-semibold hover:bg-green-600 disabled:bg-gray-400 transition-colors">
                    {loading ? <FaSpinner className="animate-spin inline mr-2" /> : (isEdit ? 'Update Category' : 'Create Category')}
                </button>
            </div>
        </form>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function ExerciseCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCategories = useCallback(async () => {
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

            const data = await apiFetch<{ page: number; pages: number; data: Category[] }>(`/categories?${query.toString()}`, 'GET');
            setCategories(data.data);
            setTotalPages(data.pages || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to load categories.');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? This cannot be undone.')) return;
        
        try {
            await apiFetch(`/categories/${id}`, 'DELETE');
            alert('Category deleted successfully!');
            fetchCategories(); // Refresh list
        } catch (err: any) {
            alert(`Deletion failed: ${err.message}`);
        }
    };

    const handleCloseForm = () => {
        setEditingCategory(null);
        setShowForm(false);
    };
    
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };
    
    // --- Render Table Content ---
    const tableContent = (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading...</td></tr>
                ) : error ? (
                    <tr><td colSpan={5} className="text-center py-4 text-danger">{error}</td></tr>
                ) : categories.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-500">No categories found. Click 'Add New' to create one.</td></tr>
                ) : (
                    categories.map((cat, index) => (
                        <tr key={cat._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cat.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.slug}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(cat.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => handleEdit(cat)} className="text-secondary hover:text-blue-800 mr-3">
                                    <FaEdit className="inline" />
                                </button>
                                <button onClick={() => handleDelete(cat._id)} className="text-danger hover:text-red-800">
                                    <FaTrashAlt className="inline" />
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
            title="Exercise Categories"
            subtitle="Manage exercise categories and their ordering."
            onRefresh={fetchCategories}
            searchValue={search}
            onSearchChange={handleSearchChange}
            showForm={showForm}
            setShowForm={setShowForm}
            form={
                <CategoryForm 
                    onSuccess={fetchCategories} 
                    initialData={editingCategory} 
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
                        onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
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
