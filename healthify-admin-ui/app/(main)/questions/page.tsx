'use client';
 
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { FaEdit, FaTrashAlt, FaSpinner } from 'react-icons/fa';

interface Faq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  createdAt: string;
}

interface FaqFormProps {
  onSuccess: () => void;
  initialData: Faq | null;
  onClose: () => void;
}

const FaqForm: React.FC<FaqFormProps> = ({ onSuccess, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    question: initialData?.question || '',
    answer: initialData?.answer || '',
    category: initialData?.category || '',
    order: initialData?.order?.toString() || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialData;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        question: formData.question.trim(),
        answer: formData.answer,
        category: formData.category,
        order: Number(formData.order) || 0,
      };

      const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
      const endpoint = isEdit ? `/faqs/${initialData!._id}` : '/faqs';

      await apiFetch(endpoint, method, payload);

      alert(`FAQ ${isEdit ? 'updated' : 'created'} successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} FAQ.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-xl font-semibold mb-4 text-primary">
        {isEdit ? 'Edit FAQ' : 'Create New FAQ'}
      </h3>

      {error && (
        <p className="text-danger mb-4 p-2 bg-red-100 rounded">{error}</p>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-gray-700">Question *</span>
          <input
            type="text"
            name="question"
            value={formData.question}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Answer</span>
          <textarea
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Category</span>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g. Account, App, General"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Order</span>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </label>
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
          {loading ? (
            <FaSpinner className="animate-spin inline mr-2" />
          ) : (
            isEdit ? 'Update FAQ' : 'Create FAQ'
          )}
        </button>
      </div>
    </form>
  );
};

export default function QuestionsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (categoryFilter.trim()) {
        query.set('category', categoryFilter.trim());
      }

      const url = query.toString() ? `/faqs?${query.toString()}` : '/faqs';
      const data = await apiFetch<Faq[]>(url, 'GET');
      setFaqs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ? This cannot be undone.')) return;

    try {
      await apiFetch(`/faqs/${id}`, 'DELETE');
      alert('FAQ deleted successfully!');
      fetchFaqs();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleCloseForm = () => {
    setEditingFaq(null);
    setShowForm(false);
  };

  const handleSearchChange = (value: string) => {
    setCategoryFilter(value);
  };

  const tableContent = (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan={5} className="text-center py-4 text-gray-500">
              <FaSpinner className="animate-spin inline mr-2" /> Loading...
            </td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={5} className="text-center py-4 text-danger">{error}</td>
          </tr>
        ) : faqs.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-4 text-gray-500">
              No FAQs found. Click 'Add New' to create one.
            </td>
          </tr>
        ) : (
          faqs.map((faq, index) => (
            <tr key={faq._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xl truncate">
                {faq.question}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{faq.category}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{faq.order}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleEdit(faq)}
                  className="text-secondary hover:text-blue-800 mr-3"
                >
                  <FaEdit className="inline" />
                </button>
                <button
                  onClick={() => handleDelete(faq._id)}
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
  );

  return (
    <CrudLayout
      title="Questions / FAQs"
      subtitle="Manage frequently asked questions displayed to users."
      onRefresh={fetchFaqs}
      searchValue={categoryFilter}
      onSearchChange={handleSearchChange}
      showForm={showForm}
      setShowForm={setShowForm}
      form={
        <FaqForm
          onSuccess={fetchFaqs}
          initialData={editingFaq}
          onClose={handleCloseForm}
        />
      }
    >
      {tableContent}
    </CrudLayout>
  );
}
