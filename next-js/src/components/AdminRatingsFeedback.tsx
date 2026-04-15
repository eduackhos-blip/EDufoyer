import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { 
  Star, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Mail,
  MessageSquare,
  Trash2,
  RefreshCw
} from 'lucide-react';

const AdminRatingsFeedback = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, approved, pending
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    averageRating: 0
  });
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRatings();
  }, [filter]);

  // Refresh ratings when component mounts or when tab becomes visible
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRatings();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [filter]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      if (filter === 'approved') {
        params.append('approved', 'true');
      } else if (filter === 'pending') {
        params.append('approved', 'false');
      }
      // For 'all', don't add any filter params
      
      console.log('📊 Fetching ratings with filter:', filter, 'params:', params.toString());
      
      const response = await adminService.makeAuthenticatedRequest(
        `/api/admin/ratings-feedback?${params.toString()}`,
        {
          method: 'GET',
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Ratings fetched:', data);
      
      if (data.success) {
        setRatings(data.data || []);
        setStats(data.stats || {
          total: 0,
          approved: 0,
          averageRating: 0
        });
      } else {
        console.error('Failed to fetch ratings:', data.message);
        setRatings([]);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      const response = await adminService.makeAuthenticatedRequest(`/api/admin/ratings-feedback/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        await fetchRatings();
      }
    } catch (error) {
      alert(error.message || 'Failed to approve rating');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) {
      return;
    }
    try {
      setProcessingId(id);
      const response = await adminService.makeAuthenticatedRequest(`/api/admin/ratings-feedback/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        await fetchRatings();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete rating');
    } finally {
      setProcessingId(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
          <p className="text-sm font-semibold text-blue-700 mb-1">Total Ratings</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
          <p className="text-sm font-semibold text-green-700 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
          <p className="text-sm font-semibold text-yellow-700 mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-900">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </p>
        </div>
      </div>

      {/* Filter Tabs and Refresh Button */}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 bg-white/80 backdrop-blur-lg rounded-xl p-1 shadow-lg border border-white/50 flex-1">
          {['all', 'pending', 'approved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
                filter === status
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={fetchRatings}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-white/50">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Ratings Found</h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'No pending ratings to review.'
              : `No ${filter} ratings found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div
              key={rating._id}
              className="bg-white rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Star className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{rating.user_name}</h3>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {!rating.is_approved && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold">
                            Pending
                          </span>
                        )}
                      </div>
                      {/* Email ID - Prominently Displayed */}
                      {rating.user_email && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 mb-3">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <span className="text-base font-semibold text-blue-900">{rating.user_email}</span>
                        </div>
                      )}
                      {!rating.user_email && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border-2 border-gray-200 mb-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500 italic">No email provided</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(rating.createdAt)}</span>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-700 leading-relaxed">{rating.feedback}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!rating.is_approved && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(rating._id)}
                      disabled={processingId === rating._id}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {processingId === rating._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(rating._id)}
                      disabled={processingId === rating._id}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {processingId === rating._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                )}
                {rating.is_approved && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleDelete(rating._id)}
                      disabled={processingId === rating._id}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {processingId === rating._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRatingsFeedback;

