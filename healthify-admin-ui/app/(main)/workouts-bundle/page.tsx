'use client';

import { useState, useEffect, useCallback } from 'react';
import { CrudLayout } from '@/components/CrudLayout';
import { apiFetch } from '@/lib/api';
import { useFetchSelectData } from '@/components/hooks/useFetchSelectData';
import { uploadImage } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner } from 'react-icons/fa';

interface ExerciseRef {
    _id: string;
    title: string;
    duration?: number;
    difficulty?: string;
}

interface Workout {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    exercises: ExerciseRef[];
    totalDuration: number;
    thumbnail?: string;
    createdAt: string;
}

interface WorkoutFormProps {
    onSuccess: () => void;
    initialData: Workout | null;
    exerciseOptions: { value: string; label: string }[];
    onClose: () => void;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ onSuccess, initialData, exerciseOptions, onClose }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        difficulty: initialData?.difficulty || 'beginner',
        thumbnail: initialData?.thumbnail || '',
        exercises: (initialData?.exercises || []).map(ex => ex._id),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const isEdit = !!initialData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleExerciseToggle = (id: string) => {
        setFormData(prev => {
            const exists = prev.exercises.includes(id);
            return {
                ...prev,
                exercises: exists
                    ? prev.exercises.filter(x => x !== id)
                    : [...prev.exercises, id],
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/workouts/${initialData!._id}` : '/workouts';

            const payload = {
                name: formData.name,
                description: formData.description,
                difficulty: formData.difficulty as Workout['difficulty'],
                thumbnail: formData.thumbnail || undefined,
                exercises: formData.exercises,
            };

            await apiFetch(endpoint, method, payload);

            alert(`Workout ${isEdit ? 'updated' : 'created'} successfully!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} workout.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-4 text-primary">{isEdit ? 'Edit Workout Bundle' : 'Create New Workout Bundle'}</h3>

            {error && <p className="text-danger mb-4 p-2 bg-red-100 rounded">{error}</p>}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <label className="block">
                    <span className="text-gray-700">Name *</span>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                    />
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

                <div className="block">
                    <span className="text-gray-700">Exercises (select one or more)</span>
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                        {exerciseOptions.length === 0 ? (
                            <p className="text-sm text-gray-500">No exercises available. Create exercises first.</p>
                        ) : (
                            exerciseOptions.map(opt => (
                                <label key={opt.value} className="flex items-center text-sm mb-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={formData.exercises.includes(opt.value)}
                                        onChange={() => handleExerciseToggle(opt.value)}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
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
                    {loading ? <FaSpinner className="animate-spin inline mr-2" /> : (isEdit ? 'Update Workout' : 'Create Workout')}
                </button>
            </div>
        </form>
    );
};

export default function WorkoutsBundlePage() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowFormState] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');

    const { data: exerciseOptions } = useFetchSelectData('/exercises', 'title');
    const { data: categoryOptions } = useFetchSelectData('/categories', 'name');

    const fetchWorkouts = useCallback(async () => {
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

            const data = await apiFetch<{ page: number; pages: number; data: Workout[] }>(`/workouts?${query.toString()}`, 'GET');
            setWorkouts(data.data);
            setTotalPages(data.pages || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to load workouts.');
        } finally {
            setLoading(false);
        }
    }, [page, search, filterCategory, filterDifficulty]);

    useEffect(() => {
        fetchWorkouts();
    }, [fetchWorkouts]);

    const handleEdit = (workout: Workout) => {
        setEditingWorkout(workout);
        setShowFormState(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workout bundle? This cannot be undone.')) return;

        try {
            await apiFetch(`/workouts/${id}`, 'DELETE');
            alert('Workout deleted successfully!');
            fetchWorkouts();
        } catch (err: any) {
            alert(`Deletion failed: ${err.message}`);
        }
    };

    const handleCloseForm = () => {
        setEditingWorkout(null);
        setShowFormState(false);
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
                    <label className="mr-2">Category (by exercises):</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => handleFilterCategoryChange(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 bg-white"
                    >
                        <option value="">All</option>
                        {categoryOptions.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercises</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
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
                    ) : workouts.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-4 text-gray-500">No workouts found. Click 'Add New' to create one.</td>
                        </tr>
                    ) : (
                        workouts.map((w, index) => (
                            <tr key={w._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{w.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.difficulty}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.exercises?.length || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.totalDuration ? `${w.totalDuration} min` : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(w)}
                                        className="text-secondary hover:text-blue-800 mr-3"
                                    >
                                        <FaEdit className="inline" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(w._id)}
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
        </ >
    );

    return (
        <CrudLayout
            title="Workouts Bundle"
            subtitle="Create and manage workout bundles composed of individual exercises."
            onRefresh={fetchWorkouts}
            showForm={showForm}
            setShowForm={(show) => {
                if (show && !editingWorkout) {
                    // Opening for a new workout via Add New
                    setEditingWorkout(null);
                }
                setShowFormState(show);
            }}
            searchValue={search}
            onSearchChange={handleSearchChange}
            form={
                <WorkoutForm
                    onSuccess={fetchWorkouts}
                    initialData={editingWorkout}
                    exerciseOptions={exerciseOptions}
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
