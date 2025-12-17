'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { ViewModal, EditModal, DeleteModal } from '@/components/ui/modals';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { uploadImage, uploadVideo } from '@/lib/upload';
import { Dumbbell, FolderOpen, Clock, Image, Play } from 'lucide-react';

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

export default function ExerciseManagementPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filters
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    // Modals
    const [viewModal, setViewModal] = useState<{ isOpen: boolean; data: Exercise | null }>({ isOpen: false, data: null });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; data: Exercise | null }>({ isOpen: false, data: null });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; data: Exercise | null }>({ isOpen: false, data: null });
    const [modalLoading, setModalLoading] = useState(false);

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
        try {
            const query = new URLSearchParams();
            query.set('page', String(currentPage));
            query.set('limit', String(itemsPerPage));
            if (searchTerm.trim()) {
                query.set('q', searchTerm.trim());
            }
            if (activeFilters.category) {
                query.set('category', activeFilters.category);
            }
            if (activeFilters.difficulty) {
                query.set('difficulty', activeFilters.difficulty);
            }
            if (activeFilters.hasVideo === 'yes') {
                query.set('hasVideo', 'true');
            } else if (activeFilters.hasVideo === 'no') {
                query.set('hasVideo', 'false');
            }

            const data = await apiFetch<{ page: number; pages: number; total: number; data: Exercise[] }>(`/exercises?${query.toString()}`, 'GET');
            setExercises(data.data || []);
            setTotalPages(data.pages || 1);
            setTotalItems(data.total || data.data?.length || 0);
        } catch (err) {
            console.error('Failed to load exercises', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, activeFilters]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setActiveFilters({});
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return '-';
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    // Available filters configuration
    const availableFilters = [
        {
            key: 'category',
            label: 'Category',
            type: 'select' as const,
            options: categories.map(cat => ({ value: cat._id, label: cat.name })),
            placeholder: 'Filter by category'
        },
        {
            key: 'difficulty',
            label: 'Difficulty',
            type: 'select' as const,
            options: [
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' }
            ],
            placeholder: 'Filter by difficulty'
        },
        {
            key: 'hasVideo',
            label: 'Has Video',
            type: 'select' as const,
            options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
            ],
            placeholder: 'Filter by video'
        }
    ];

    // Table columns configuration
    const columns = [
        {
            key: 'title',
            label: 'Name',
            sortable: true,
            render: (value: string, item: Exercise) => (
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                        <Dumbbell className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <span className="font-medium">{value}</span>
                        {item.description && (
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                {item.description}
                            </p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            render: (_: any, item: Exercise) => (
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <FolderOpen className="w-3 h-3" />
                    {item.category?.name || 'Unassigned'}
                </Badge>
            )
        },
        {
            key: 'duration',
            label: 'Duration',
            sortable: true,
            render: (value: number) => (
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatDuration(value)}</span>
                </div>
            )
        },
        {
            key: 'image',
            label: 'Image',
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    {value ? (
                        <img
                            src={value}
                            alt="Exercise"
                            className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Image className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'video',
            label: 'Video',
            render: (value: string) => value ? (
                <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Available</span>
                </div>
            ) : (
                <span className="text-sm text-gray-400">No video</span>
            )
        }
    ];

    // View modal fields
    const viewFields = [
        { key: '_id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category', render: (_: any, item: Exercise) => item.category?.name || 'Unassigned' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'duration', label: 'Duration', render: (value: number) => formatDuration(value) },
        { key: 'equipment', label: 'Equipment', render: (value: string[]) => value?.join(', ') || 'None' },
        {
            key: 'image',
            label: 'Image',
            render: (value: string) => value ? (
                <img src={value} alt="Exercise" className="w-32 h-32 rounded-lg object-cover" />
            ) : 'No image'
        },
        { key: 'createdAt', label: 'Created', render: (value: string) => new Date(value).toLocaleDateString() }
    ];

    // Edit modal fields
    const editFields = [
        { key: 'title', label: 'Title', type: 'text' as const, placeholder: 'Enter exercise title', required: true },
        { key: 'description', label: 'Description', type: 'textarea' as const, placeholder: 'Enter description', required: false },
        {
            key: 'category',
            label: 'Category',
            type: 'select' as const,
            options: categories.map(cat => ({ value: cat._id, label: cat.name })),
            required: false
        },
        {
            key: 'difficulty',
            label: 'Difficulty',
            type: 'select' as const,
            options: [
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' }
            ],
            required: true
        },
        { key: 'duration', label: 'Duration (seconds)', type: 'number' as const, placeholder: 'Duration in seconds', min: 0, required: false },
        { key: 'equipment', label: 'Equipment', type: 'text' as const, placeholder: 'Comma-separated (e.g., dumbbells, mat)', required: false },
        { key: 'image', label: 'Image URL', type: 'text' as const, placeholder: 'Image URL', required: false },
        { key: 'video', label: 'Video URL', type: 'text' as const, placeholder: 'Video URL', required: false }
    ];

    const handleAdd = () => {
        setEditModal({ isOpen: true, data: null });
    };

    const handleView = (item: Exercise) => {
        setViewModal({ isOpen: true, data: item });
    };

    const handleEdit = (item: Exercise) => {
        // Prepare data for edit modal
        const editData = {
            ...item,
            category: item.category?._id || '',
            equipment: Array.isArray(item.equipment) ? item.equipment.join(', ') : ''
        };
        setEditModal({ isOpen: true, data: editData as any });
    };

    const handleDelete = (item: Exercise) => {
        setDeleteModal({ isOpen: true, data: item });
    };

    const handleSave = async (values: Record<string, any>) => {
        setModalLoading(true);
        try {
            const payload = {
                title: values.title,
                description: values.description || undefined,
                difficulty: values.difficulty,
                duration: values.duration ? Number(values.duration) : undefined,
                image: values.image || undefined,
                video: values.video || undefined,
                category: values.category || undefined,
                equipment: values.equipment
                    ? values.equipment.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : []
            };

            const isEdit = editModal.data && (editModal.data as any)._id;
            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/exercises/${(editModal.data as any)._id}` : '/exercises';

            await apiFetch(endpoint, method, payload);

            setEditModal({ isOpen: false, data: null });
            fetchExercises();
        } catch (err: any) {
            console.error('Save error:', err);
            alert(`Error saving: ${err.message}`);
        } finally {
            setModalLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.data) return;

        setModalLoading(true);
        try {
            await apiFetch(`/exercises/${deleteModal.data._id}`, 'DELETE');
            setDeleteModal({ isOpen: false, data: null });
            fetchExercises();
        } catch (err: any) {
            console.error('Delete error:', err);
            alert(`Error deleting: ${err.message}`);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <>
            <DataTable
                title={<><Dumbbell className="w-5 h-5" />Exercise Management</>}
                description="Manage exercises with categories, videos, and duration"
                data={exercises}
                columns={columns}
                searchPlaceholder="Search exercises..."
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                availableFilters={availableFilters}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onRefresh={fetchExercises}
                onAdd={handleAdd}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* View Modal */}
            <ViewModal
                isOpen={viewModal.isOpen}
                onClose={() => setViewModal({ isOpen: false, data: null })}
                title="Exercise Details"
                data={viewModal.data || {}}
                fields={viewFields}
            />

            {/* Edit Modal */}
            <EditModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, data: null })}
                title={editModal.data && (editModal.data as any)._id ? "Edit Exercise" : "Add Exercise"}
                data={editModal.data || {}}
                fields={editFields}
                onSave={handleSave}
                loading={modalLoading}
            />

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, data: null })}
                title="Delete Exercise"
                message={`Are you sure you want to delete "${deleteModal.data?.title}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                loading={modalLoading}
            />
        </>
    );
}
