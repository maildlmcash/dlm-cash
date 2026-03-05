import { useState } from 'react';
import { showToast } from '../../utils/toast';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  order: number;
}

const CMS = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    isActive: true,
  });

  const defaultPages = [
    { title: 'About Us', slug: 'about' },
    { title: 'Terms & Conditions', slug: 'terms' },
    { title: 'Privacy Policy', slug: 'privacy' },
    { title: 'Contact Us', slug: 'contact' },
  ];

  const handleCreate = () => {
    setEditingPage(null);
    setFormData({ title: '', slug: '', content: '', isActive: true });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">CMS (Content Management)</h1>
          <p className="text-gray-600 mt-1">Manage website pages and content</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Page
        </button>
      </div>

      {/* Default Pages */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Default Pages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {defaultPages.map((page) => (
            <div key={page.slug} className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer">
              <h3 className="font-medium mb-2">{page.title}</h3>
              <p className="text-sm text-gray-600 mb-2">/{page.slug}</p>
              <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Pages */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Custom Pages</h2>
        </div>
        {pages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No custom pages created</div>
        ) : (
          <div className="divide-y">
            {pages.map((page) => (
              <div key={page.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h3 className="font-medium">{page.title}</h3>
                  <p className="text-sm text-gray-600">/{page.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    page.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {page.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button className="text-red-600 hover:text-red-800">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPage ? 'Edit Page' : 'Create New Page'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="about-us"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  rows={15}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Page is visible</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!formData.title || !formData.slug || !formData.content) {
                      showToast.warning('Please fill all required fields');
                      return;
                    }
                    try {
                      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                      const url = editingPage
                        ? `${API_BASE_URL}/admin/cms/pages/${editingPage.id}`
                        : `${API_BASE_URL}/admin/cms/pages`;
                      const response = await fetch(url, {
                        method: editingPage ? 'PUT' : 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify({
                          title: formData.title,
                          slug: formData.slug,
                          content: formData.content,
                          isActive: formData.isActive,
                        }),
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                        showToast.success(editingPage ? 'Page updated successfully' : 'Page created successfully');
                        setShowModal(false);
                        if (!editingPage) {
                          setPages([...pages, data.data]);
                        } else {
                          setPages(pages.map(p => p.id === editingPage.id ? { ...p, ...formData } : p));
                        }
                        setFormData({ title: '', slug: '', content: '', isActive: true });
                      } else {
                        showToast.error(data.message || 'Failed to save page');
                      }
                    } catch (error) {
                      showToast.error('Failed to save page');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPage ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMS;
