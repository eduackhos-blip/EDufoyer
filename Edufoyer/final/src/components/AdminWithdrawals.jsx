import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, XCircle, Clock, User, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import adminService from '../services/adminService';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'disbursed', 'rejected'
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve', 'disburse', 'reject'
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      const status = filter === 'all' ? null : filter;
      const data = await adminService.getWithdrawals(status);
      setWithdrawals(data || []);
    } catch (err) {
      console.error('Fetch withdrawals error:', err);
      setError(err.message || 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (withdrawal, type) => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setAdminNotes('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedWithdrawal) return;

    try {
      setIsProcessing(true);
      let result;

      if (actionType === 'approve') {
        result = await adminService.approveWithdrawal(selectedWithdrawal._id, adminNotes);
      } else if (actionType === 'disburse') {
        result = await adminService.disburseWithdrawal(selectedWithdrawal._id, adminNotes);
      } else if (actionType === 'reject') {
        result = await adminService.rejectWithdrawal(selectedWithdrawal._id, adminNotes);
      }

      if (result.success) {
        setShowActionModal(false);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        setError(result.message || 'Action failed');
      }
    } catch (err) {
      console.error('Action error:', err);
      setError(err.message || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
      approved: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
      disbursed: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
      rejected: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
    };
    return badges[status] || badges.pending;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'disbursed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredWithdrawals = filter === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === filter);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Withdrawal Requests</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Manage user withdrawal requests</p>
          </div>
        </div>
        <button
          onClick={fetchWithdrawals}
          disabled={loading}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'approved', 'disbursed', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === status
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 transition-colors">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Withdrawals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No withdrawal requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal._id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusBadge(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      {withdrawal.status}
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ₹{withdrawal.amount}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{withdrawal.user_id?.name || 'Unknown User'}</span>
                      <span className="text-gray-400">({withdrawal.user_id?.email || 'N/A'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>{withdrawal.account_holder_name}</span>
                    </div>
                    {withdrawal.upi_id && (
                      <div className="text-gray-500 dark:text-gray-500">
                        UPI: {withdrawal.upi_id}
                      </div>
                    )}
                    {withdrawal.bank_account_number && (
                      <div className="text-gray-500 dark:text-gray-500">
                        Bank: {withdrawal.bank_name} • {withdrawal.bank_account_number.slice(-4)} • {withdrawal.bank_ifsc}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Requested: {new Date(withdrawal.createdAt).toLocaleString()}
                    </div>
                    {withdrawal.admin_notes && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        <strong>Admin Notes:</strong> {withdrawal.admin_notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {withdrawal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(withdrawal, 'approve')}
                        className="px-3 py-1.5 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(withdrawal, 'reject')}
                        className="px-3 py-1.5 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {withdrawal.status === 'approved' && (
                    <button
                      onClick={() => handleAction(withdrawal, 'disburse')}
                      className="px-3 py-1.5 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Disburse Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 capitalize">
              {actionType} Withdrawal Request
            </h3>
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Amount:</strong> <span className="text-green-600 dark:text-green-400 font-semibold">₹{selectedWithdrawal.amount}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>User:</strong> {selectedWithdrawal.user_id?.name || 'Unknown'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Add notes about this action..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedWithdrawal(null);
                  setAdminNotes('');
                }}
                disabled={isProcessing}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessing}
                className={`flex-1 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ${
                  actionType === 'reject'
                    ? 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700'
                    : actionType === 'disburse'
                    ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700'
                    : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Processing...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;





