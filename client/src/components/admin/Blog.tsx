import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { showToast } from '../../utils/toast';
import { useConfirm } from '../../utils/confirm';
import ConfirmDialog from '../common/ConfirmDialog';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  shortDesc?: string;
  content: string;
  thumbnail?: string;
  authorName?: string;
  categoryId?: string;
  isPublished: boolean;
  publishAt?: string;
  tags: string[];
  views: number;
  createdAt: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    shortDesc: '',
    content: '',
    thumbnail: '',
    authorName: '',
    categoryId: '',
    isPublished: false,
    publishAt: '',
    tags: '',
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3B82F6' });

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await adminApi.getAllBlogPosts();
      if (response.success && response.data) {
        const data = response.data as any;
        setPosts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await adminApi.getBlogCategories();
      if (response.success && response.data) {
        const data = response.data as any;
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      shortDesc: '',
      content: '',
      thumbnail: '',
      authorName: '',
      categoryId: '',
      isPublished: false,
      publishAt: '',
      tags: '',
    });
    setShowModal(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      shortDesc: post.shortDesc || '',
      content: post.content,
      thumbnail: post.thumbnail || '',
      authorName: post.authorName || '',
      categoryId: post.categoryId || '',
      isPublished: post.isPublished,
      publishAt: post.publishAt || '',
      tags: post.tags.join(', '),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        shortDesc: formData.shortDesc || undefined,
        content: formData.content,
        thumbnail: formData.thumbnail || undefined,
        authorName: formData.authorName || undefined,
        categoryId: formData.categoryId || undefined,
        isPublished: formData.isPublished,
        publishAt: formData.publishAt || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      let response;
      if (editingPost) {
        response = await adminApi.updateBlogPost(editingPost.id, payload);
      } else {
        response = await adminApi.createBlogPost(payload);
      }

      if (response.success) {
        showToast.success(editingPost ? 'Post updated successfully' : 'Post created successfully');
        setShowModal(false);
        loadPosts();
      } else {
        showToast.error(response.error || 'Failed to save post');
      }
    } catch (error) {
      showToast.error('Failed to save post');
    }
  };

  const handleDelete = async (id: string) => {
    confirm(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      async () => {
        try {
          const response = await adminApi.deleteBlogPost(id);
          if (response.success) {
            showToast.success('Post deleted successfully');
            loadPosts();
          } else {
            showToast.error(response.error || 'Failed to delete post');
          }
        } catch (error) {
          showToast.error('Failed to delete post');
        }
      },
      'danger'
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adminApi.createBlogCategory(categoryForm);
      if (response.success) {
        showToast.success('Category created successfully');
        setShowCategoryModal(false);
        setCategoryForm({ name: '', color: '#3B82F6' });
        loadCategories();
      } else {
        showToast.error(response.error || 'Failed to create category');
      }
    } catch (error) {
      showToast.error('Failed to create category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Blog Management</h1>
          <p className="text-gray-600 mt-1">Create and manage blog posts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            + Category
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No posts found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {post.thumbnail && (
                <img src={post.thumbnail} alt={post.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      post.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-sm text-gray-500">{post.views} views</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                {post.shortDesc && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.shortDesc}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  value={formData.shortDesc}
                  onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Published</span>
                </label>
                {formData.isPublished && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                    <input
                      type="datetime-local"
                      value={formData.publishAt}
                      onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPost ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        title={config?.title || 'Confirm Action'}
        message={config?.message || ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type={config?.type || 'warning'}
      />
    </div>
  );
};

export default Blog;
