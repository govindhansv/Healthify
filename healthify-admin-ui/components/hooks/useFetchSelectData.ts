import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface SelectOption {
    value: string; // The ID
    label: string; // The Name
}

/**
 * Custom hook to fetch non-paginated data suitable for dropdown select inputs.
 * @param endpoint The API endpoint (e.g., /categories, /exercises)
 * @param labelKey The field to use as the label (e.g., 'name', 'title')
 * @returns {data, loading, error}
 */
export const useFetchSelectData = (endpoint: string, labelKey: string) => {
    const [data, setData] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch a large limit; backend list endpoints support ?limit
                const response = await apiFetch<{ data: any[] }>(`${endpoint}?limit=500`, 'GET');

                const options = (response.data || []).map(item => ({
                    value: item._id,
                    label: item[labelKey] || item.name || item.title || 'Unknown',
                }));

                setData(options);
            } catch (err: any) {
                setError(`Failed to load data for ${endpoint}: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [endpoint, labelKey]);

    return { data, loading, error };
};
