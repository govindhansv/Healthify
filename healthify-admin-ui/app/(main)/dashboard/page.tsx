'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { FaUsers, FaDumbbell, FaLeaf, FaPills, FaQuestionCircle, FaChartPie, FaRunning, FaEnvelopeOpenText } from 'react-icons/fa';

// Define the summary data structure based on the backend API
interface SummaryData {
    users: number;
    categories: number;
    exercises: number;
    workouts: number;
    meditations: number;
    nutrition: number;
    medicines: number;
    faqs: number;
    generatedAt: string;
}

const SummaryCard = ({ title, value, icon: Icon }: { title: string, value: number, icon: React.ElementType }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <Icon className="w-8 h-8 text-primary opacity-50" />
        </div>
    </div>
);

export default function DashboardPage() {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await apiFetch<SummaryData>('/admin/summary');
                setSummary(response);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch summary data. Ensure your Node.js backend is running on port 4000.');
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const cards = summary ? [
        { title: 'Total Users', value: summary.users, icon: FaUsers },
        { title: 'Categories', value: summary.categories, icon: FaChartPie },
        { title: 'Exercises', value: summary.exercises, icon: FaDumbbell },
        { title: 'Workouts', value: summary.workouts, icon: FaRunning },
        { title: 'Meditations', value: summary.meditations, icon: FaEnvelopeOpenText },
        { title: 'Nutrition Items', value: summary.nutrition, icon: FaLeaf },
        { title: 'Medicine Catalog', value: summary.medicines, icon: FaPills },
        { title: 'Total FAQs', value: summary.faqs, icon: FaQuestionCircle },
    ] : [];

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Summary 📊</h2>
            
            {loading && <div className="text-center py-10 text-gray-500">Loading data from backend...</div>}
            {error && <div className="text-center py-10 text-danger border border-danger p-4 rounded-lg">Error: {error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <SummaryCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                    />
                ))}
            </div>

            {summary && (
                <p className="mt-8 text-sm text-gray-500">
                    Data last updated: {new Date(summary.generatedAt).toLocaleString()}
                </p>
            )}
        </div>
    );
}
