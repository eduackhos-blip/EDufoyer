import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { Plus, Minus, CheckCircle, X, Loader2, Package, ArrowLeft } from 'lucide-react';

const DEFAULT_DOUBT_CATEGORIES = [
  { id: 'small', name: 'Small', count: '' },
  { id: 'medium', name: 'Medium', count: '' },
  { id: 'large', name: 'Large', count: '' }
];

const DoubtsPackBuilder = ({ className = '', defaultOpen = false, onDoubtPackCreated }) => {
  const [showDoubtPackForm, setShowDoubtPackForm] = useState(defaultOpen);
  const [doubtPackStep, setDoubtPackStep] = useState(defaultOpen ? 1 : 0);
  const [doubtPackData, setDoubtPackData] = useState({
    totalDoubts: '',
    categories: []
  });
  const [doubtPackError, setDoubtPackError] = useState('');
  const [doubtPackSuccess, setDoubtPackSuccess] = useState('');
  const [doubtPacks, setDoubtPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(true);

  const loadDoubtPacks = async () => {
    try {
      setLoadingPacks(true);
      const packs = await adminService.getDoubtPacks(true);
      // Format packs for display
      const formattedPacks = packs.map(pack => ({
        id: pack._id,
        totalDoubts: pack.totalDoubts,
        categories: pack.categories,
        createdAt: new Date(pack.createdAt).toLocaleString()
      }));
      setDoubtPacks(formattedPacks);
    } catch (error) {
      console.error('Error loading doubt packs:', error);
      // If API fails, try localStorage as fallback
      const savedPacks = localStorage.getItem('admin_doubt_packs');
      if (savedPacks) {
        try {
          const parsed = JSON.parse(savedPacks);
          setDoubtPacks(parsed);
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
      }
    } finally {
      setLoadingPacks(false);
    }
  };

  // Load doubt packs from API on mount
  useEffect(() => {
    loadDoubtPacks();
  }, []);

  const startDoubtPackFlow = () => {
    setShowDoubtPackForm(prev => {
      const nextState = !prev;
      setDoubtPackStep(nextState ? 1 : 0);
      setDoubtPackData({
        totalDoubts: '',
        categories: []
      });
      setDoubtPackError('');
      setDoubtPackSuccess('');
      return nextState;
    });
  };

  const handleTotalDoubtsChange = (value) => {
    if (Number(value) < 0) return;
    setDoubtPackData(prev => ({
      ...prev,
      totalDoubts: value
    }));
  };

  const goToCategoryStep = () => {
    const total = parseInt(doubtPackData.totalDoubts, 10);
    if (!total || total <= 0) {
      setDoubtPackError('Please enter total doubts greater than zero');
      return;
    }

    setDoubtPackError('');
    setDoubtPackData(prev => ({
      ...prev,
      categories: prev.categories.length ? prev.categories : DEFAULT_DOUBT_CATEGORIES
    }));
    setDoubtPackStep(2);
  };

  const handleCategoryChange = (index, field, value) => {
    setDoubtPackData(prev => {
      const categories = prev.categories.map((cat, idx) =>
        idx === index ? { ...cat, [field]: value } : cat
      );
      return { ...prev, categories };
    });
  };

  const addCategoryRow = () => {
    setDoubtPackData(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        { id: `${Date.now()}-${Math.random()}`, name: '', count: '' }
      ]
    }));
  };

  const removeCategoryRow = (index) => {
    setDoubtPackData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, idx) => idx !== index)
    }));
  };

  const handleAddDoubtPack = async () => {
    setDoubtPackError('');
    setDoubtPackSuccess('');
    setLoading(true);

    const total = parseInt(doubtPackData.totalDoubts, 10);
    if (!total || total <= 0) {
      setDoubtPackError('Total doubts must be greater than zero');
      setDoubtPackStep(1);
      setLoading(false);
      return;
    }

    const sanitizedCategories = (doubtPackData.categories || [])
      .map((category) => ({
        name: category.name?.trim() || '',
        count: Number(category.count) || 0
      }))
      .filter(category => category.name && category.count > 0);

    if (!sanitizedCategories.length) {
      setDoubtPackError('Please add at least one category with a valid count');
      setLoading(false);
      return;
    }

    const categoryTotal = sanitizedCategories.reduce((sum, cat) => sum + cat.count, 0);

    if (categoryTotal !== total) {
      setDoubtPackError('Category counts must add up to the total number of doubts');
      setLoading(false);
      return;
    }

    try {
      // Save to database via API
      const savedPack = await adminService.createDoubtPack({
        totalDoubts: total,
        categories: sanitizedCategories
      });

      // Format the saved pack for display
      const formattedPack = {
        id: savedPack._id,
        totalDoubts: savedPack.totalDoubts,
        categories: savedPack.categories,
        createdAt: new Date(savedPack.createdAt).toLocaleString()
      };

      // Update local state
      const updatedPacks = [formattedPack, ...doubtPacks];
      setDoubtPacks(updatedPacks);

      // Also save to localStorage as backup
      try {
        localStorage.setItem('admin_doubt_packs', JSON.stringify(updatedPacks));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }

      setDoubtPackSuccess('Doubts pack added successfully!');
      setDoubtPackData({
        totalDoubts: '',
        categories: []
      });
      setDoubtPackStep(1);
      if (onDoubtPackCreated) {
        onDoubtPackCreated(); // Call the callback to refresh stats
      }
    } catch (error) {
      console.error('Error saving doubt pack:', error);
      setDoubtPackError(error.message || 'Failed to save doubt pack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoubtPack = async (packId) => {
    if (!window.confirm('Are you sure you want to delete this doubt pack?')) {
      return;
    }
    setLoading(true);
    try {
      await adminService.deleteDoubtPack(packId);
      setDoubtPacks(prev => prev.filter(pack => pack.id !== packId));
      setDoubtPackSuccess('Doubt pack deleted successfully!');
      setTimeout(() => setDoubtPackSuccess(''), 3000);
      if (onDoubtPackCreated) {
        onDoubtPackCreated(); // Call the callback to refresh stats
      }
    } catch (error) {
      console.error('Error deleting doubt pack:', error);
      setDoubtPackError(error.message || 'Failed to delete doubt pack.');
      setTimeout(() => setDoubtPackError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!showDoubtPackForm) {
    return (
      <button
        onClick={startDoubtPackFlow}
        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
      >
        <Package className="w-5 h-5" />
        Create New Doubt Pack
      </button>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Success/Error Messages */}
      {doubtPackSuccess && (
        <div className="p-4 rounded-xl bg-green-50 text-green-700 border-2 border-green-200 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{doubtPackSuccess}</span>
        </div>
      )}
      {doubtPackError && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border-2 border-red-200 flex items-center gap-2">
          <X className="w-5 h-5" />
          <span>{doubtPackError}</span>
        </div>
      )}

      {/* Step 1: Total Doubts */}
      {doubtPackStep === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Number of Doubts *
            </label>
            <input
              type="number"
              value={doubtPackData.totalDoubts}
              onChange={(e) => handleTotalDoubtsChange(e.target.value)}
              className="w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Enter total number of doubts"
              min="1"
              required
            />
          </div>
          <button
            onClick={goToCategoryStep}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            Next: Add Categories
          </button>
        </div>
      )}

      {/* Step 2: Categories */}
      {doubtPackStep === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Categories (Total: {doubtPackData.totalDoubts})
            </h3>
            <button
              onClick={addCategoryRow}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="space-y-3">
            {doubtPackData.categories.map((category, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                  className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="Category name (e.g., Small, Medium, Large)"
                />
                <input
                  type="number"
                  value={category.count}
                  onChange={(e) => handleCategoryChange(index, 'count', e.target.value)}
                  className="w-32 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="Count"
                  min="0"
                />
                {doubtPackData.categories.length > 1 && (
                  <button
                    onClick={() => removeCategoryRow(index)}
                    className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDoubtPackStep(1)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleAddDoubtPack}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Pack
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Existing Packs List */}
      {doubtPacks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Doubt Packs</h3>
          {loadingPacks ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {doubtPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      Total: {pack.totalDoubts} doubts
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pack.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                        >
                          {cat.name}: {cat.count}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Created: {pack.createdAt}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteDoubtPack(pack.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoubtsPackBuilder;
