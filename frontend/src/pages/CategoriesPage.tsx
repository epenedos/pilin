import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/categories.api';
import { Category } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366F1');
  const [newIsIncome, setNewIsIncome] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const data = await categoriesApi.list();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await categoriesApi.create({ name: newName, color: newColor, isIncome: newIsIncome });
    setShowForm(false);
    setNewName('');
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await categoriesApi.remove(deleteId);
      setDeleteId(null);
      load();
    } catch (err: any) {
      setDeleteId(null);
      alert(err.response?.data?.error || 'Cannot delete category (has entries)');
    }
  };

  const expenseCats = categories.filter((c) => !c.isIncome);
  const incomeCats = categories.filter((c) => c.isIncome);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Categories</h2>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Add Category
        </button>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Category">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newIsIncome}
              onChange={(e) => setNewIsIncome(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <label className="text-sm text-gray-700">Income category</label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={!newName}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Expense Categories</h3>
            <div className="space-y-2">
              {expenseCats.map((c) => (
                <div key={c.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <button onClick={() => setDeleteId(c.id)} className="text-gray-400 hover:text-red-600 text-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Income Categories</h3>
            <div className="space-y-2">
              {incomeCats.map((c) => (
                <div key={c.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <button onClick={() => setDeleteId(c.id)} className="text-gray-400 hover:text-red-600 text-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
