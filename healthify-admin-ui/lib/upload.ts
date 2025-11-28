import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface UploadResult {
    url: string;
    public_id: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
    if (!API_BASE) {
        throw new Error('API base URL is not configured');
    }

    const token = Cookies.get('healthify-admin-token');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Image upload failed');
    }

    return data as UploadResult;
}
