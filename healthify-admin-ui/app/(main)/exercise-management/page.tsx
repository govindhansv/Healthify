'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CrudLayout } from '@/components/CrudLayout';
import { apiFetch } from '@/lib/api';
import { uploadImage, uploadVideo } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner, FaCloudUploadAlt, FaVideo, FaImage } from 'react-icons/fa';

interface CategoryOption {
    _id: string;
    name: string;
}

interface ExerciseCategoryRef {
    _id: string;
    name: string;
    slug: string;
}

interface Exercise {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    equipment: string[];
    image?: string;
    video?: string;
    createdAt: string;
    category?: ExerciseCategoryRef | null;
}

interface ExerciseFormProps {
    onSuccess: () => void;
    initialData: Exercise | null;
    categories: CategoryOption[];
    onClose: () => void;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ onSuccess, initialData, categories, onClose }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        difficulty: initialData?.difficulty || 'beginner',
        duration: initialData ? String(initialData.duration ?? '') : '',
        equipment: initialData?.equipment?.join(', ') || '',
        image: initialData?.image || '',
        video: initialData?.video || '',
        category: initialData?.category?._id || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const isEdit = !!initialData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');

        try {
            if (type === 'image') {
                setUploadingImage(true);
                const result = await uploadImage(file);
                setFormData(prev => ({ ...prev, image: result.url }));
            } else if (type === 'video') {
                setUploadingVideo(true);
                const result = await uploadVideo(file);
                setFormData(prev => ({ ...prev, video: result.url }));
            }
        } catch (err: any) {
            setError(err.message || `${type} upload failed`);
        } finally {
            if (type === 'image') setUploadingImage(false);
            if (type === 'video') setUploadingVideo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/exercises/${initialData!._id}` : '/exercises';

            const payload = {
                title: formData.title,
                description: formData.description,
                difficulty: formData.difficulty as Exercise['difficulty'],
                duration: formData.duration ? Number(formData.duration) : undefined,
                image: formData.image || undefined,
                video: formData.video || undefined,
                category: formData.category || undefined,
                equipment: formData.equipment
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean),
            };

            await apiFetch(endpoint, method, payload);

            alert(`Exercise ${isEdit ? 'updated' : 'created'} successfully!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} exercise.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full" style={{ maxHeight: '80vh' }}>
            <div className="flex-shrink-0 mb-5 border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {isEdit ? <FaEdit className="text-indigo-500" /> : <FaCloudUploadAlt className="text-green-500" />}
                    {isEdit ? 'Edit Exercise' : 'Create New Exercise'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                    {isEdit ? 'Update details of your exercise below.' : 'Add a new exercise to your library.'}
                </p>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 pb-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-gray-50 focus:bg-white transition-colors"
                                placeholder="e.g. Push Ups"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-white"
                            >
                                <option value="">Select Category...</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Difficulty</label>
                                <select
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleChange}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-white"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (min)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    min={0}
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-gray-50 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Equipment</label>
                            <input
                                type="text"
                                name="equipment"
                                value={formData.equipment}
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-gray-50 focus:bg-white"
                                placeholder="e.g. dumbbells, mat"
                            />
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list of items.</p>
                        </div>
                    </div>

                    {/* Right Column: Media */}
                    <div className="space-y-4">
                        {/* Image Upload */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FaImage className="text-blue-500" /> Cover Image
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="url"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    className="flex-1 text-sm border-gray-300 rounded-md py-1 px-2"
                                    placeholder="Image URL..."
                                />
                                {formData.image && <a href={formData.image} target="_blank" className="text-blue-500 text-xs flex items-center hover:underline">View</a>}
                            </div>
                            <label className="cursor-pointer flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition text-sm">
                                {uploadingImage ? <FaSpinner className="animate-spin mr-2" /> : <FaCloudUploadAlt className="mr-2" />}
                                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                            </label>
                        </div>

                        {/* Video Upload */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FaVideo className="text-red-500" /> Demo Video
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="url"
                                    name="video"
                                    value={formData.video}
                                    onChange={handleChange}
                                    className="flex-1 text-sm border-gray-300 rounded-md py-1 px-2"
                                    placeholder="Video URL..."
                                />
                            </div>
                            <label className="cursor-pointer flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition text-sm">
                                {uploadingVideo ? <FaSpinner className="animate-spin mr-2" /> : <FaCloudUploadAlt className="mr-2" />}
                                {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                            </label>
                        </div>
                        {formData.video && (
                            <div className="mt-2">
                                <video src={formData.video} controls className="w-full h-auto max-h-48 bg-black rounded" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 bg-gray-50 focus:bg-white transition-colors"
                        placeholder="Detailed description of the exercise..."
                    ></textarea>
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-gray-200 mt-2 flex justify-end space-x-3 bg-white">
                <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || uploadingImage || uploadingVideo}
                    className="py-2.5 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center"
                >
                    {loading ? <FaSpinner className="animate-spin mr-2" /> : (isEdit ? 'Save Changes' : 'Create Exercise')}
                </button>
            </div>
        </form>
    );
};

export default function ExerciseManagementPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');

    const fetchCategories = useCallback(async () => {
        try {
            const res = await apiFetch<{ data: CategoryOption[] }>('/categories?limit=1000', 'GET');
            setCategories(res.data || []);
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    }, []);

    const fetchExercises = useCallback(async () => {
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
            if (filterCategory) {
                query.set('category', filterCategory);
            }
            if (filterDifficulty) {
                query.set('difficulty', filterDifficulty);
            }

            const data = await apiFetch<{ page: number; pages: number; data: Exercise[] }>(`/exercises?${query.toString()}`, 'GET');
            setExercises(data.data);
            setTotalPages(data.pages || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to load exercises.');
        } finally {
            setLoading(false);
        }
    }, [page, search, filterCategory, filterDifficulty]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises]);

    const handleAdd = () => {
        setEditingExercise(null);
        setShowForm(true);
    };

    const handleEdit = (exercise: Exercise) => {
        setEditingExercise(exercise);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this exercise? This cannot be undone.')) return;

        try {
            await apiFetch(`/exercises/${id}`, 'DELETE');
            alert('Exercise deleted successfully!');
            fetchExercises();
        } catch (err: any) {
            alert(`Deletion failed: ${err.message}`);
        }
    };

    const handleCloseForm = () => {
        setEditingExercise(null);
        setShowForm(false);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleFilterCategoryChange = (value: string) => {
        setFilterCategory(value);
        setPage(1);
    };

    const handleFilterDifficultyChange = (value: string) => {
        setFilterDifficulty(value);
        setPage(1);
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return '-';
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    const tableContent = (
        <>
            <div className="mb-4 flex flex-wrap gap-4 items-center text-sm text-gray-700">
                <div>
                    <label className="mr-2">Category:</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => handleFilterCategoryChange(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 bg-white"
                    >
                        <option value="">All</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mr-2">Difficulty:</label>
                    <select
                        value={filterDifficulty}
                        onChange={(e) => handleFilterDifficultyChange(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 bg-white"
                    >
                        <option value="">All</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="text-center py-4 text-gray-500">
                                <FaSpinner className="animate-spin inline mr-2" /> Loading...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={7} className="text-center py-4 text-danger">{error}</td>
                        </tr>
                    ) : exercises.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-4 text-gray-500">No exercises found. Click 'Add New' to create one.</td>
                        </tr>
                    ) : (
                        exercises.map((ex, index) => (
                            <tr key={ex._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">{(page - 1) * 10 + index + 1}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-full flex-shrink-0">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{ex.title}</p>
                                            {ex.description && (
                                                <p className="text-sm text-gray-500 truncate max-w-[200px]">{ex.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ex.category?.name
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        {ex.category?.name || 'Unassigned'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                                        </svg>
                                        {formatDuration(ex.duration)}
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {ex.image ? (
                                        <img
                                            src={ex.image}
                                            alt={ex.title}
                                            className="w-10 h-10 rounded-lg object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <FaImage className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {ex.video ? (
                                        <div className="flex items-center gap-1 text-green-600">
                                            <FaVideo className="w-4 h-4" />
                                            <span className="text-sm">Available</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400">No video</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(ex)}
                                        className="text-secondary hover:text-blue-800 mr-3"
                                    >
                                        <FaEdit className="inline" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ex._id)}
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
        </>
    );

    return (
        <CrudLayout
            title="Exercise Management"
            subtitle="Manage individual exercises, their difficulty, and category assignments."
            onRefresh={fetchExercises}
            showForm={showForm}
            setShowForm={(show) => {
                if (show) {
                    // If opening for a new exercise explicitly via Add New button
                    setEditingExercise(editingExercise);
                }
                setShowForm(show);
            }}
            searchValue={search}
            onSearchChange={handleSearchChange}
            form={
                <ExerciseForm
                    onSuccess={fetchExercises}
                    initialData={editingExercise}
                    categories={categories}
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
