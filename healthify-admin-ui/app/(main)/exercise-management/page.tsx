'use client';
 
import { useState, useEffect, useCallback } from 'react';
import { CrudLayout } from '@/components/CrudLayout';
import { apiFetch } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner } from 'react-icons/fa';

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
        category: initialData?.category?._id || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const isEdit = !!initialData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            const endpoint = isEdit ? `/exercises/${initialData!._id}` : '/exercises';

            const payload = {
                title: formData.title,
                description: formData.description,
                difficulty: formData.difficulty as Exercise['difficulty'],
                duration: formData.duration ? Number(formData.duration) : undefined,
                image: formData.image || undefined,
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
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-4 text-primary">{isEdit ? 'Edit Exercise' : 'Create New Exercise'}</h3>

            {error && <p className="text-danger mb-4 p-2 bg-red-100 rounded">{error}</p>}

            <div className="space-y-4">
                <label className="block">
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
                    <span className="text-gray-700">Category</span>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                    >
                        <option value="">Unassigned</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </label>

                <label className="block">
                    <span className="text-gray-700">Difficulty</span>
                    <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </label>

                <label className="block">
                    <span className="text-gray-700">Duration (minutes)</span>
                    <input
                        type="number"
                        name="duration"
                        min={0}
                        value={formData.duration}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    />
                </label>

                <label className="block">
                    <span className="text-gray-700">Equipment (comma-separated)</span>
                    <input
                        type="text"
                        name="equipment"
                        value={formData.equipment}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="e.g. dumbbells, mat"
                    />
                </label>

                <label className="block">
                    <span className="text-gray-700">Description</span>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    ></textarea>
                </label>

                <label className="block">
                    <span className="text-gray-700">Image URL</span>
                    <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    />
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
                    {loading ? <FaSpinner className="animate-spin inline mr-2" /> : (isEdit ? 'Update Exercise' : 'Create Exercise')}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                            <tr key={ex._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ex.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.category?.name || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.difficulty}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.duration ? `${ex.duration} min` : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ex.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
