import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, History, ArrowDownCircle } from 'lucide-react';
import walletService from '../services/walletService';
import WithdrawModal from './WithdrawModal';

const WalletDisplay = () => {
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await walletService.getWallet();
      setWallet(data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError(err.message || 'Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6 transition-colors duration-300">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchWallet}
          className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors duration-300">
          <IndianRupee className="w-5 h-5 text-green-600 dark:text-green-400" />
          Wallet
        </h3>
        <button
          onClick={fetchWallet}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Balance */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">Current Balance</p>
          <p className="text-3xl font-bold transition-colors duration-300">
            <span className="text-green-600 dark:text-green-400">₹{wallet?.balance || 0}</span>
          </p>
        </div>

        {/* Total Earned */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
          <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" />
          <span>Total Earned: <span className="text-green-600 dark:text-green-400 font-semibold">₹{wallet?.total_earned || 0}</span></span>
        </div>

        {/* Withdrawal Eligibility Message */}
        {wallet?.withdrawalEligibility && !wallet.withdrawalEligibility.isEligible && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
              Withdrawal Locked
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {wallet.withdrawalEligibility.message}
            </p>
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 space-y-1">
              <p>• Completed: {wallet.withdrawalEligibility.completedDoubts}/{wallet.withdrawalEligibility.minDoubtsRequired} doubts</p>
              <p>• Average Rating: {wallet.withdrawalEligibility.averageRating.toFixed(1)}/{wallet.withdrawalEligibility.minRatingRequired} ⭐</p>
            </div>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!wallet || wallet.balance <= 0 || (wallet?.withdrawalEligibility && !wallet.withdrawalEligibility.isEligible)}
          className={`w-full flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg transition-colors duration-300 ${
            wallet && wallet.balance > 0 && wallet?.withdrawalEligibility?.isEligible !== false
              ? 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Withdraw</span>
        </button>

        {/* Recent Transactions */}
        {wallet?.transactions && wallet.transactions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">Recent Transactions</h4>
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {[...wallet.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((tx, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-300"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors duration-300">
                      {tx.doubt_id?.subject || 'Doubt solved'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      {tx.doubt_type} • Rating: {tx.rating}/5 • Avg: {tx.average_rating?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 transition-colors duration-300">+₹{tx.amount}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 transition-colors duration-300">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        currentBalance={wallet?.balance || 0}
        onSuccess={() => {
          fetchWallet();
        }}
      />
    </div>
  );
};

export default WalletDisplay;

