import React, { useState } from 'react';
import { X, Wallet, CreditCard, AlertCircle } from 'lucide-react';
import walletService from '../services/walletService';

const WithdrawModal = ({ isOpen, onClose, currentBalance, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'bank'
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [bankName, setBankName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate amount
      const withdrawAmount = parseFloat(amount);
      if (!amount || withdrawAmount <= 0) {
        setError('Please enter a valid amount');
        setIsSubmitting(false);
        return;
      }

      if (withdrawAmount > currentBalance) {
        setError(`Insufficient balance. Available: ₹${currentBalance}`);
        setIsSubmitting(false);
        return;
      }

      if (!accountHolderName.trim()) {
        setError('Account holder name is required');
        setIsSubmitting(false);
        return;
      }

      // Validate payment method specific fields
      if (paymentMethod === 'upi') {
        if (!upiId.trim()) {
          setError('UPI ID is required');
          setIsSubmitting(false);
          return;
        }
      } else {
        if (!bankAccountNumber.trim() || !bankIFSC.trim() || !bankName.trim()) {
          setError('Please fill all bank account details');
          setIsSubmitting(false);
          return;
        }
      }

      // Submit withdrawal request
      const response = await walletService.createWithdrawalRequest({
        amount: withdrawAmount,
        upi_id: paymentMethod === 'upi' ? upiId : null,
        bank_account_number: paymentMethod === 'bank' ? bankAccountNumber : null,
        bank_ifsc: paymentMethod === 'bank' ? bankIFSC : null,
        bank_name: paymentMethod === 'bank' ? bankName : null,
        account_holder_name: accountHolderName
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit withdrawal request');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setUpiId('');
      setAccountHolderName('');
      setBankAccountNumber('');
      setBankIFSC('');
      setBankName('');
      setPaymentMethod('upi');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-3 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300 transition-colors">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center transition-colors">
                <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 transition-colors">Withdraw Rupees</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors">Available: <span className="text-green-600 dark:text-green-400 font-semibold">₹{currentBalance}</span></p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                <AlertCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Request Submitted!</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                Your withdrawal request has been submitted and is pending admin approval.
              </p>
            </div>
          ) : (
            <>
              {/* Amount Input */}
              <div className="mb-4">
                <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  Withdrawal Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold text-sm">₹</span>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    max={currentBalance}
                    step="1"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter amount"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Maximum: <span className="text-green-600 dark:text-green-400 font-semibold">₹{currentBalance}</span>
                </p>
              </div>

              {/* Account Holder Name */}
              <div className="mb-4">
                <label htmlFor="accountHolderName" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountHolderName"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter account holder name"
                />
              </div>

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-lg border-2 transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 mx-auto mb-1 ${paymentMethod === 'upi' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-xs sm:text-sm font-medium ${paymentMethod === 'upi' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      UPI
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-2.5 rounded-lg border-2 transition-all ${
                      paymentMethod === 'bank'
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <Wallet className={`w-4 h-4 mx-auto mb-1 ${paymentMethod === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-xs sm:text-sm font-medium ${paymentMethod === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      Bank Account
                    </span>
                  </button>
                </div>
              </div>

              {/* UPI Fields */}
              {paymentMethod === 'upi' && (
                <div className="mb-4">
                  <label htmlFor="upiId" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    UPI ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="upiId"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="yourname@paytm"
                  />
                </div>
              )}

              {/* Bank Account Fields */}
              {paymentMethod === 'bank' && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label htmlFor="bankAccountNumber" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="bankAccountNumber"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankIFSC" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="bankIFSC"
                      value={bankIFSC}
                      onChange={(e) => setBankIFSC(e.target.value.toUpperCase())}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="ABCD0123456"
                      maxLength="11"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankName" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter bank name"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 transition-colors">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 px-3 text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                  className="flex-1 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 px-3 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;





