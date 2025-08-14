import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit, Trash2, Package, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: ''
  });
  const [newSubcategory, setNewSubcategory] = useState({
    category_id: '',
    name: '',
    description: '',
    icon: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*, categories(name)')
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabaseAdmin
        .from('categories')
        .insert([newCategory]);

      if (error) throw error;

      setNewCategory({ name: '', description: '', icon: '' });
      setShowAddModal(false);
      fetchCategories();
      showGlobalSuccess('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      showGlobalError('Error adding category');
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabaseAdmin
        .from('subcategories')
        .insert([newSubcategory]);

      if (error) throw error;

      setNewSubcategory({ category_id: '', name: '', description: '', icon: '' });
      setShowAddSubModal(false);
      setSelectedCategoryForSub('');
      fetchSubcategories();
      showGlobalSuccess('Subcategory added successfully!');
    } catch (error) {
      console.error('Error adding subcategory:', error);
      showGlobalError('Error adding subcategory');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const { error } = await supabaseAdmin
        .from('categories')
        .update({
          name: editingCategory.name,
          description: editingCategory.description,
          icon: editingCategory.icon
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      setEditingCategory(null);
      fetchCategories();
      showGlobalSuccess('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      showGlobalError('Error updating category');
    }
  };

  const handleUpdateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory) return;

    try {
      const { error } = await supabaseAdmin
        .from('subcategories')
        .update({
          name: editingSubcategory.name,
          description: editingSubcategory.description,
          icon: editingSubcategory.icon,
          category_id: editingSubcategory.category_id
        })
        .eq('id', editingSubcategory.id);

      if (error) throw error;

      setEditingSubcategory(null);
      fetchSubcategories();
      showGlobalSuccess('Subcategory updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      showGlobalError('Error updating category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all subcategories and affect all products in this category.')) return;

    try {
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
      fetchSubcategories();
      showGlobalSuccess('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      showGlobalError('Error deleting category');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? This will affect all products in this subcategory.')) return;

    try {
      const { error } = await supabaseAdmin
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSubcategories();
      showGlobalSuccess('Subcategory deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      showGlobalError('Error deleting category');
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tags className="w-6 h-6" />
            Categories Management
          </h1>
          <p className="text-gray-400">Manage product categories</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddSubModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Subcategory
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categorySubcategories = subcategories.filter(sub => sub.category_id === category.id);
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id} className="bg-gray-900 border border-green-500 rounded-lg">
              {/* Category Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-1 hover:bg-gray-800 rounded"
                    >
                      {categorySubcategories.length > 0 && (
                        isExpanded ? 
                          <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="text-3xl">{category.icon || '📦'}</div>
                    <div>
                      <h3 className="text-lg font-bold text-green-400">{category.name}</h3>
                      <p className="text-gray-400 text-sm">{category.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Created: {new Date(category.created_at).toLocaleDateString()}
                        </span>
                        <span>{categorySubcategories.length} subcategories</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategoryForSub(category.id);
                        setNewSubcategory({ ...newSubcategory, category_id: category.id });
                        setShowAddSubModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
                    >
                      Add Sub
                    </button>
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Subcategories */}
              {isExpanded && categorySubcategories.length > 0 && (
                <div className="p-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorySubcategories.map((subcategory) => (
                      <div key={subcategory.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-2xl">{subcategory.icon || '📦'}</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingSubcategory(subcategory)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-bold text-blue-400 mb-1">{subcategory.name}</h4>
                        <p className="text-gray-400 text-xs">{subcategory.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Tags className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No categories found</p>
          <p className="text-gray-500">Create your first category to get started</p>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm mb-2">Name:</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="Category name..."
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Description:</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="Category description..."
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Icon (Emoji):</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="📦"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showAddSubModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Add New Subcategory</h3>
            <form onSubmit={handleAddSubcategory} className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm mb-2">Parent Category:</label>
                <select
                  value={newSubcategory.category_id}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, category_id: e.target.value })}
                  required
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select parent category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Name:</label>
                <input
                  type="text"
                  value={newSubcategory.name}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                  required
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="Subcategory name..."
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Description:</label>
                <textarea
                  value={newSubcategory.description}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="Subcategory description..."
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Icon (Emoji):</label>
                <input
                  type="text"
                  value={newSubcategory.icon}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, icon: e.target.value })}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="📦"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  Add Subcategory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubModal(false);
                    setNewSubcategory({ category_id: '', name: '', description: '', icon: '' });
                    setSelectedCategoryForSub('');
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Edit Category</h3>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm mb-2">Name:</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Description:</label>
                <textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Icon (Emoji):</label>
                <input
                  type="text"
                  value={editingCategory.icon || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  Update Category
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {editingSubcategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Edit Subcategory</h3>
            <form onSubmit={handleUpdateSubcategory} className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm mb-2">Parent Category:</label>
                <select
                  value={editingSubcategory.category_id}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, category_id: e.target.value })}
                  required
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select parent category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Name:</label>
                <input
                  type="text"
                  value={editingSubcategory.name}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                  required
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Description:</label>
                <textarea
                  value={editingSubcategory.description}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-green-400 text-sm mb-2">Icon (Emoji):</label>
                <input
                  type="text"
                  value={editingSubcategory.icon || ''}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, icon: e.target.value })}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  Update Subcategory
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSubcategory(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}