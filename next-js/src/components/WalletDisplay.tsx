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
      <div className="dash-panel-card p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-32 rounded bg-[var(--dash-card-mint)]" />
          <div className="h-12 w-24 rounded bg-[var(--dash-card-mint)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-panel-card border-red-200 p-6">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={fetchWallet} className="mt-2 text-sm font-semibold text-[var(--dash-forest)] underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dash-panel-card h-fit p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--dash-forest)]">
          <IndianRupee className="h-5 w-5 text-[var(--dash-forest)]" />
          Wallet
        </h3>
        <button
          onClick={fetchWallet}
          className="text-[var(--dash-text-muted)] transition-colors hover:text-[var(--dash-forest)]"
          type="button"
          aria-label="Refresh wallet"
        >
          <History className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Balance */}
        <div>
          <p className="mb-1 text-sm text-[var(--dash-text-muted)]">Current Balance</p>
          <p className="text-3xl font-bold">
            <span className="text-[var(--dash-forest)]">₹{wallet?.balance || 0}</span>
          </p>
        </div>

        {/* Total Earned */}
        <div className="flex items-center gap-2 text-sm text-[var(--dash-text-body)]">
          <TrendingUp className="h-4 w-4 text-[var(--dash-forest)]" />
          <span>
            Total Earned:{' '}
            <span className="font-semibold text-[var(--dash-forest)]">₹{wallet?.total_earned || 0}</span>
          </span>
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
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white shadow-[var(--dash-inner-shadow)] transition-opacity ${
            wallet && wallet.balance > 0 && wallet?.withdrawalEligibility?.isEligible !== false
              ? 'cursor-pointer bg-[#073E36] hover:opacity-90'
              : 'cursor-not-allowed bg-[var(--dash-text-muted)]/35 text-white/80'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Withdraw</span>
        </button>

        {/* Recent Transactions */}
        {wallet?.transactions && wallet.transactions.length > 0 && (
          <div className="mt-6 border-t border-[var(--dash-panel-border)] pt-6">
            <h4 className="mb-3 text-sm font-semibold text-[var(--dash-forest)]">Recent Transactions</h4>
            <div className="space-y-2">
              {[...wallet.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((tx, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-[var(--dash-panel-border)] bg-[var(--dash-card-mint)]/30 p-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--dash-text-body)]">
                      {tx.doubt_id?.subject || 'Doubt solved'}
                    </p>
                    <p className="text-xs text-[var(--dash-text-muted)]">
                      {tx.doubt_type} • Rating: {tx.rating}/5 • Avg: {tx.average_rating?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--dash-forest)]">+₹{tx.amount}</p>
                    <p className="text-xs text-[var(--dash-text-muted)]">
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

