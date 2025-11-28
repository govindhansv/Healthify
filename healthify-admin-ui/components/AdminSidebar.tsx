'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUserShield, FaChartBar, FaRunning, FaDumbbell, FaEnvelopeOpenText, FaLeaf, FaPills, FaClock, FaQuestionCircle, FaList } from 'react-icons/fa';
import { useAuth } from './AuthProvider'; // Use the local AuthProvider

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: FaChartBar },
  { name: 'User Management', href: '/user-management', icon: FaUserShield },
  { name: 'Exercise Categories', href: '/exercise-categories', icon: FaDumbbell },
  { name: 'Exercise Management', href: '/exercise-management', icon: FaRunning },
  { name: 'Workouts Bundle', href: '/workouts-bundle', icon: FaList },
  { name: 'Meditation Management', href: '/meditation-management', icon: FaEnvelopeOpenText },
  { name: 'Nutrition Management', href: '/nutrition-management', icon: FaLeaf },
  { name: 'Medicines Catalog', href: '/medicines-catalog', icon: FaPills },
  // { name: 'Medicine Reminders', href: '/medicine-reminders', icon: FaClock }, // Keeping this link simple for now
  { name: 'Questions', href: '/questions', icon: FaQuestionCircle },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed top-0 left-0 pt-6 flex flex-col">
      <div className="px-6 pb-4 border-b">
        <h1 className="text-2xl font-bold text-primary">Healthify Admin</h1>
      </div>
      <nav className="mt-4 px-3 flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-1">
              <Link
                href={item.href}
                className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors 
                  ${pathname === item.href 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Logout link at the bottom, mirroring the mockup style (top right) is handled in the main layout */}
    </div>
  );
};
