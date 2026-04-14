import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { 
  ShoppingCart, 
  Building2, 
  Calendar,
  IndianRupee,
  Package,
  Loader2,
  TrendingUp,
  Mail
} from 'lucide-react';

const DoubtPackPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getDoubtPackPurchases(100);
      setPurchases(data || []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate total revenue
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-emerald-600 mt-1">{purchases.length} purchase{purchases.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="text-white" size={28} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-white/50">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Purchases Yet</h3>
          <p className="text-gray-500">Doubt pack purchases will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div
              key={purchase._id}
              className="bg-white rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <ShoppingCart className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{purchase.university_name}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {purchase.payment_status === 'completed' ? 'Paid' : purchase.payment_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{purchase.university_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(purchase.purchase_date || purchase.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Purchase Details */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-3 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2">Doubt Pack Details</p>
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                {purchase.doubt_pack_details?.totalDoubts || purchase.doubt_pack_id?.totalDoubts || 'N/A'} Doubts
                              </span>
                            </div>
                            {purchase.doubt_pack_details?.categories && purchase.doubt_pack_details.categories.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {purchase.doubt_pack_details.categories.map((cat, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                                  >
                                    {cat.name}: {cat.count}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2">Payment</p>
                            <div className="flex items-center gap-2">
                              <IndianRupee className="w-5 h-5 text-emerald-600" />
                              <span className="text-2xl font-bold text-emerald-700">
                                {formatCurrency(purchase.amount)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{purchase.currency || 'INR'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoubtPackPurchases;

