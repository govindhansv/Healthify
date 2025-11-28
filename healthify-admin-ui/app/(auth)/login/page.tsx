'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('admin@healthify.com');
    const [password, setPassword] = useState('Admin@1234');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isLoggedIn } = useAuth();
    const router = useRouter();

    if (isLoggedIn) {
      router.push('/dashboard');
      return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed. Check server status.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl">
                <h1 className="text-3xl font-bold text-center text-primary">Admin Panel</h1>
                <p className="text-center text-gray-600">Sign in to manage Healthify content</p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        />
                    </div>
                    {error && <p className="text-sm font-medium text-danger">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-white bg-primary rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
