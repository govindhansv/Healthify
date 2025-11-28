import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export type UserRole = 'user' | 'admin';

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
}

/**
 * Custom fetch utility for authenticated API calls to the backend.
 * Automatically handles JSON serialization and token inclusion.
 */
export async function apiFetch<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object
): Promise<T> {
    const token = Cookies.get('healthify-admin-token');
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    const url = `${API_BASE}${endpoint}`;
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error || response.statusText || 'Unknown API Error';
            throw new Error(errorMsg);
        }

        return data as T;
    } catch (error) {
        // Re-throw the error for the caller (e.g., AuthProvider) to handle
        console.error('API Fetch Error:', error);
        throw error;
    }
}
