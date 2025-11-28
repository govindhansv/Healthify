'use client';

import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa';

// Separate component for content and auth check
const MainLayoutContent = ({ children }: { children: React.ReactNode }) => {
    const { isLoggedIn, loading, user, logout } = useAuth();
    const router = useRouter();

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading authentication...</div>;
    }

    if (!isLoggedIn) {
        // Redirect logic: If not logged in after check, push to login page
        router.push('/login');
        return null;
    }

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            
            <div className="flex-1 ml-64 p-8">
                {/* Header matching the mockup's style: Healthify Admin (hidden in sidebar now) + Logout */}
                <header className="flex justify-between items-center pb-6 mb-6">
                    <div className="flex items-center">
                        <h2 className="text-2xl font-bold text-primary mr-4">Healthify Admin</h2>
                        <span className="text-sm text-gray-500">Manage your application</span>
                    </div>

                    <button 
                        onClick={() => {
                            if (window.confirm('Are you sure you want to log out?')) {
                                logout();
                                router.push('/login'); // Ensure client-side navigation after logout
                            }
                        }}
                        className="flex items-center p-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-danger hover:text-white transition-colors"
                    >
                        <FaSignOutAlt className="mr-2" />
                        Logout
                    </button>
                </header>
                
                {/* Main Content Area */}
                <main>{children}</main>
            </div>
        </div>
    );
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <MainLayoutContent>{children}</MainLayoutContent>
        </AuthProvider>
    );
}
