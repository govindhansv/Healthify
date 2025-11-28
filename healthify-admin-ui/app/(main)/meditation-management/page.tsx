'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { useFetchSelectData } from '@/components/hooks/useFetchSelectData';
import { uploadImage } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner, FaPlayCircle } from 'react-icons/fa';

interface CategoryOption {
    value: string; // Category ID
    label: string; // Category Name
}

interface MeditationCategoryRef {
    _id: string;
    name: string;
}

interface Meditation {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    duration: number; // seconds
    category: MeditationCategoryRef;
    audioUrl: string;
    thumbnail?: string;
    createdAt: string;
}

interface MeditationFormProps {
    onSuccess: () => void;
    initialData: Meditation | null;
    onClose: () => void;
}

const MeditationForm: React.FC<MeditationFormProps> = ({ onSuccess, initialData, onClose }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        duration: initialData?.duration || 120,
        category: initialData?.category?._id || '', // Expects category ID
        audioUrl: initialData?.audioUrl || '',
        thumbnail: initialData?.thumbnail || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const { data: categoryOptions, loading: categoriesLoading, error: categoriesError } = useFetchSelectData('/categories', 'name');

    const isEdit = !!initialData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'duration' ? Number(value) : value,
        }));
    };

    const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        try {
            const result = await uploadImage(file);
            setFormData(prev => ({ ...prev, thumbnail: result.url }));
        } catch (err: any) {
            setError(err.message || 'Thumbnail upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.category) {
                throw new Error('Please select a category.');
            }

            const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/meditations/${initialData!._id}` : '/meditations';

            await apiFetch(endpoint, method, formData);

            alert(`Meditation session ${isEdit ? 'updated' : 'created'} successfully!`);
            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} session.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-4 text-primary">{isEdit ? 'Edit Meditation Session' : 'Create New Meditation Session'}</h3>

            {error && <p className="text-danger mb-4 p-2 bg-red-100 rounded">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
                <label className="block col-span-2">
                    <span className="text-gray-700">Title *</span>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    />
                </label>
                <label className="block">
                    <span className="text-gray-700">Category *</span>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                        disabled={categoriesLoading}
                    >
                        <option value="">{categoriesLoading ? 'Loading...' : 'Select Category'}</option>
                        {categoriesError && <option disabled>Error loading categories</option>}
                        {categoryOptions.map((option: CategoryOption) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-gray-700">Duration (Seconds) *</span>
                    <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        min={10}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    />
                </label>
                <label className="block col-span-2">
                    <span className="text-gray-700">Audio URL *</span>
                    <input
                        type="url"
                        name="audioUrl"
                        value={formData.audioUrl}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    />
                </label>
                <label className="block col-span-2">
                    <span className="text-gray-700">Description</span>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    ></textarea>
                </label>
                <label className="block col-span-2">
                    <span className="text-gray-700">Thumbnail URL</span>
                    <input
                        type="url"
                        name="thumbnail"
                        value={formData.thumbnail}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <div className="mt-2 flex items-center gap-3 text-sm">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailFileChange}
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
                    {loading ? <FaSpinner className="animate-spin inline mr-2" /> : (isEdit ? 'Update Session' : 'Create Session')}
                </button>
            </div>
        </form>
    );
};

export default function MeditationManagementPage() {
    const [meditations, setMeditations] = useState<Meditation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingMeditation, setEditingMeditation] = useState<Meditation | null>(null);

    const fetchMeditations = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch<{ data: Meditation[] }>(
                '/meditations?limit=100',
                'GET',
            );
            setMeditations(data.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load meditation sessions. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeditations();
    }, []);

    const handleAdd = () => {
        setEditingMeditation(null);
        setShowForm(true);
    };

    const handleEdit = (meditation: Meditation) => {
        setEditingMeditation(meditation);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this meditation session?')) return;

        try {
            await apiFetch(`/meditations/${id}`, 'DELETE');
            alert('Session deleted successfully!');
            fetchMeditations();
        } catch (err: any) {
            alert(`Deletion failed: ${err.message}`);
        }
    };

    const handleCloseForm = () => {
        setEditingMeditation(null);
        setShowForm(false);
    };

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m${remainingSeconds ? ` ${remainingSeconds}s` : ''}`;
    };

    const tableContent = (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-gray-500">
                            <FaSpinner className="animate-spin inline mr-2" /> Loading...
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-danger">{error}</td>
                    </tr>
                ) : meditations.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-gray-500">No meditation sessions found. Click 'Add New' to create one.</td>
                    </tr>
                ) : (
                    meditations.map((session) => (
                        <tr key={session._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-medium">{session.category?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(session.duration)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                                <a
                                    href={session.audioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    <FaPlayCircle className="inline mr-1" /> Play Audio
                                </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleEdit(session)}
                                    className="text-secondary hover:text-blue-800 mr-3"
                                >
                                    <FaEdit className="inline" />
                                </button>
                                <button
                                    onClick={() => handleDelete(session._id)}
                                    className="text-danger hover:text-red-800"
                                >
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
            title="Meditation Management"
            subtitle="Manage guided meditation sessions with categories and audio URLs."
            onRefresh={fetchMeditations}
            showForm={showForm}
            setShowForm={setShowForm}
            form={
                <MeditationForm
                    onSuccess={fetchMeditations}
                    initialData={editingMeditation}
                    onClose={handleCloseForm}
                />
            }
        >
            {tableContent}
        </CrudLayout>
    );
}

