import React from 'react';
import { FaPlus, FaRedoAlt } from 'react-icons/fa';

interface CrudLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  form: React.ReactNode;
  onRefresh: () => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  disableAdd?: boolean;
}

export const CrudLayout: React.FC<CrudLayoutProps> = ({ 
  title,
  subtitle,
  children,
  form,
  onRefresh,
  showForm,
  setShowForm,
  searchValue,
  onSearchChange,
  disableAdd,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500 mb-6">{subtitle}</p>

      {/* Control Bar */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="search"
          placeholder={`Search ${title.toLowerCase()}...`}
          className="w-1/3 p-2 border border-gray-300 rounded-lg shadow-sm"
          value={searchValue ?? ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        <div className="flex space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <FaRedoAlt className="w-4 h-4 mr-2" /> Refresh
          </button>
          {!disableAdd && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center p-2 bg-primary text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FaPlus className="w-4 h-4 mr-2" /> Add New
            </button>
          )}
        </div>
      </div>

      {/* Main Content (Table) */}
      <div className="bg-white p-6 rounded-lg shadow-xl">
        {children}
      </div>

      {/* Modal / Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl max-w-lg w-full relative">
            <button 
              onClick={() => setShowForm(false)} 
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 text-xl"
            >&times;</button>
            {form}
          </div>
        </div>
      )}
    </div>
  );
};
