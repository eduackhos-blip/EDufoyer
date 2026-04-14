import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, IndianRupee, Loader2, CheckCircle } from 'lucide-react';
import adminService from '../services/adminService';

const DOUBT_PACKS_STORAGE_KEY = 'admin_doubt_packs';

const RechargeWalletModal = ({ isOpen, onClose, universityInfo, onPurchaseSuccess }) => {
  const [doubtPacks, setDoubtPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  
  // Pricing: ₹110 per doubt
  const calculatePrice = (totalDoubts) => {
    return totalDoubts * 110;
  };

  useEffect(() => {
    if (isOpen) {
      const loadDoubtPacks = async () => {
        setLoading(true);
        try {
          // Try to fetch from API first
          const packs = await adminService.getDoubtPacks(true);
          // Format packs for display
          const formattedPacks = packs.map(pack => ({
            id: pack._id || pack.id,
            totalDoubts: pack.totalDoubts,
            categories: pack.categories,
            createdAt: pack.createdAt ? new Date(pack.createdAt).toLocaleString() : pack.createdAt
          }));
          setDoubtPacks(formattedPacks);
        } catch (error) {
          console.error('Error loading doubt packs from API:', error);
          // Fallback to localStorage
          const savedPacks = localStorage.getItem(DOUBT_PACKS_STORAGE_KEY);
          if (savedPacks) {
            try {
              const parsed = JSON.parse(savedPacks);
              setDoubtPacks(parsed);
            } catch (e) {
              console.error('Error loading from localStorage:', e);
              setDoubtPacks([]);
            }
          } else {
            setDoubtPacks([]);
          }
        } finally {
          setLoading(false);
        }
      };

      loadDoubtPacks();
    }
  }, [isOpen]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePurchase = async (pack) => {
    if (!universityInfo) {
      alert('University information not available');
      return;
    }

    if (!window.Razorpay) {
      alert('Payment gateway is loading. Please wait a moment and try again.');
      return;
    }

    const amount = calculatePrice(pack.totalDoubts);

    try {
      setPurchasing(pack.id);
      setPurchaseSuccess(null);

      // Step 1: Create Razorpay order
      // Ensure doubt_pack_id is a valid MongoDB ObjectId string
      const doubtPackId = pack.id || pack._id;
      
      if (!doubtPackId) {
        throw new Error('Invalid doubt pack ID');
      }

      console.log('💳 Creating order for pack:', { packId: doubtPackId, totalDoubts: pack.totalDoubts, amount });

      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          doubt_pack_id: doubtPackId,
          university_name: universityInfo.name || 'KIIT University',
          university_email: universityInfo.email || 'admin@kiit.ac.in',
          university_id: universityInfo.id || universityInfo._id
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Order creation failed:', errorData);
        throw new Error(errorData.message || errorData.error || `Failed to create payment order (${orderResponse.status})`);
      }

      const orderData = await orderResponse.json();
      console.log('✅ Order created successfully:', orderData);

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Step 2: Initialize Razorpay checkout with UPI, PhonePe, and Google Pay
      console.log('💳 Initializing Razorpay checkout with UPI, PhonePe, and Google Pay...');
      
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'EduFoyer',
        description: `Doubt Pack - ${pack.totalDoubts} doubts`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await fetch('/api/payment/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  doubt_pack_id: doubtPackId, // Use the same validated ID
                  university_name: universityInfo.name || 'KIIT University',
                  university_email: universityInfo.email || 'admin@kiit.ac.in',
                  university_id: universityInfo.id || universityInfo._id,
                  amount: amount
                }
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setPurchasing(null);
              setPurchaseSuccess(pack.id);
              setTimeout(() => {
                setPurchaseSuccess(null);
              }, 5000);
              
              // Show success message
              alert('Payment successful! Purchase recorded. Available doubts updated.');
              
              // Notify parent component to refresh doubt balance
              // Call multiple times with delays to ensure backend has processed
              if (onPurchaseSuccess) {
                console.log('🔄 Calling onPurchaseSuccess to refresh doubt balance...');
                
                // Immediate refresh
                onPurchaseSuccess();
                
                // Refresh after 1 second (backend processing time)
                setTimeout(() => {
                  console.log('🔄 Refreshing doubt balance after 1s...');
                  onPurchaseSuccess();
                }, 1000);
                
                // Refresh after 2 seconds (ensure update is complete)
                setTimeout(() => {
                  console.log('🔄 Refreshing doubt balance after 2s...');
                  onPurchaseSuccess();
                }, 2000);
              }
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed: ' + (error.message || 'Unknown error'));
            setPurchasing(null);
          }
        },
        prefill: {
          name: universityInfo.name || 'University Admin',
          email: universityInfo.email || 'admin@kiit.ac.in',
          contact: '', // Will be filled by user
        },
        // Enhanced modal configuration
        modal: {
          ondismiss: function() {
            setPurchasing(null);
          },
          escape: true,
          animation: true,
          backdropclose: true
        },
        // Image configuration for better branding
        image: '', // You can add EduFoyer logo URL here if needed
        // Notes for better UX
        notes: {
          payment_methods: "upi,phonepe,googlepay",
          description: `Purchase ${pack.totalDoubts} doubts for ${universityInfo.name || 'your university'}`
        },
        theme: {
          color: '#10b981', // Emerald green matching EduFoyer brand
          backdrop_color: '#000000cc', // Dark backdrop with transparency
          hide: false
        },
        // Payment methods - Enable UPI, Cards, Netbanking, Wallet
        // Disable Pay Later
        method: {
          upi: true, // UPI enabled (includes PhonePe, Google Pay, Paytm)
          card: true,
          netbanking: true,
          wallet: true,
          paylater: false // Remove Pay Later option
        },
        // Enhanced display configuration
        display: {
          blocks: {
            banks: {
              name: "Payment Methods",
              instruments: [
                {
                  method: "upi",
                  title: "UPI Payment",
                  description: "Pay using UPI apps"
                },
                {
                  method: "card",
                  title: "Debit/Credit Cards",
                  description: "Visa, Mastercard, RuPay & more"
                },
                {
                  method: "netbanking",
                  title: "Net Banking",
                  description: "All major banks"
                },
                {
                  method: "wallet",
                  title: "Wallets",
                  description: "Paytm, PhonePe & more"
                }
              ]
            }
          },
          sequence: ["block.banks"],
          preferences: {
            show_default_blocks: true
          }
        },
        // Enhanced UPI configuration with specific apps and QR scanner
        config: {
          // UPI apps configuration - Enable Paytm, PhonePe, Google Pay with QR scanner
          upi: {
            flow: "collect", // Enable UPI collect flow (includes QR scanner)
            apps: {
              paytm: true,
              phonepe: true, // PhonePe enabled
              googlepay: true, // Google Pay enabled
              bhim: true,
              whatsapp: false,
              amazonpay: false
            },
            // Show UPI apps prominently
            display: {
              order: ["phonepe", "googlepay", "paytm", "bhim"]
            }
          },
          // Card configuration
          card: {
            display: {
              order: ["visa", "mastercard", "rupay", "maestro"]
            }
          },
          // Netbanking configuration
          netbanking: {
            display: {
              order: ["sbi", "hdfc", "icici", "axis", "kotak"]
            }
          },
          // Wallet configuration
          wallet: {
            display: {
              order: ["paytm", "phonepe", "airtelmoney", "mobikwik"]
            }
          }
        }
      };

      console.log('💳 Razorpay options:', JSON.stringify(options, null, 2));
      console.log('💳 UPI Configuration:', {
        upiEnabled: options.method?.upi,
        phonepeEnabled: options.config?.upi?.apps?.phonepe,
        googlepayEnabled: options.config?.upi?.apps?.googlepay,
        paytmEnabled: options.config?.upi?.apps?.paytm
      });
      
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        alert('Payment failed: ' + (response.error.description || 'Unknown error'));
        setPurchasing(null);
      });

      console.log('💳 Opening Razorpay checkout...');
      razorpay.open();
    } catch (error) {
      console.error('Purchase error:', error);
      alert(error.message || 'Failed to initiate payment. Please try again.');
      setPurchasing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden transform transition-all">
        {/* Header with gradient */}
        <div className="relative flex items-center justify-between p-8 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10">
          <div className="flex-1">
            <h2 className="text-5xl font-heading bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent tracking-tight leading-tight drop-shadow-lg">
              Recharge Wallet
            </h2>
            <p className="text-lg text-slate-200 mt-3 font-elegant tracking-normal font-semibold">
              View doubts added from Admin Dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all transform hover:rotate-90 duration-300"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)] bg-gradient-to-b from-slate-900/50 to-slate-900">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-14 h-14 animate-spin text-emerald-400 mx-auto mb-6 drop-shadow-lg" />
              <p className="text-slate-200 text-2xl font-heading tracking-tight">Loading doubt packs...</p>
            </div>
          ) : doubtPacks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 flex items-center justify-center shadow-xl">
                <ShoppingCart className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-slate-200 text-3xl font-heading mb-3 tracking-tight">No doubt packs found</p>
              <p className="text-slate-300 text-lg font-elegant">
                Add doubt packs from the Admin Dashboard to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-heading text-white tracking-tight mb-2">
                    Available Doubt Packs
                  </p>
                  <p className="text-base text-slate-300 mt-2 font-elegant">
                    Total <span className="text-gradient-primary font-bold text-lg">{doubtPacks.length}</span> doubt pack{doubtPacks.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              {doubtPacks.map((pack, index) => (
                <div
                  key={pack.id}
                  className="group relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 p-6 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-emerald-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
                  
                  <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Icon with gradient */}
                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg">
                          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                            {pack.totalDoubts}
                          </span>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-3xl font-heading text-white mb-2 tracking-tight leading-tight">
                            {pack.totalDoubts} Doubts Pack
                          </h3>
                          <p className="text-sm text-slate-300 font-elegant flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                            <span className="font-semibold">Added on</span>
                            <span className="text-slate-200 font-bold">{pack.createdAt}</span>
                          </p>
                        </div>
                        
                        {/* Price with gradient */}
                        <div className="text-right">
                          <div className="flex items-baseline gap-1.5">
                            <IndianRupee className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
                            <p className="text-4xl font-heading bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent tracking-tight text-shadow-glow">
                              {calculatePrice(pack.totalDoubts).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <p className="text-xs text-slate-300 font-elegant mt-2 uppercase tracking-widest font-bold">Total Price</p>
                        </div>
                      </div>
                      
                      {/* Categories with better styling */}
                      <div className="mt-5 flex flex-wrap gap-3">
                        {pack.categories.map((category, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2.5 rounded-xl border border-slate-600/50 bg-gradient-to-r from-slate-700/50 to-slate-800/50 px-5 py-2.5 text-sm font-elegant text-slate-200 hover:border-emerald-500/50 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-blue-500/10 transition-all duration-200 shadow-md hover:shadow-emerald-500/20"
                          >
                            <span className="font-bold text-white text-base tracking-wide">{category.name}:</span>
                            <span className="text-emerald-400 font-heading text-lg font-extrabold">{category.count}</span>
                          </span>
                        ))}
                      </div>
                      
                      {/* Success message */}
                      {purchaseSuccess === pack.id && (
                        <div className="mt-5 p-5 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-3 animate-fade-in shadow-lg shadow-emerald-500/20">
                          <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 drop-shadow-lg" />
                          <span className="text-base font-elegant font-bold text-emerald-300 tracking-wide">Purchase successful! Your doubts have been added.</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Purchase button with enhanced styling */}
                    <div className="flex-shrink-0 lg:ml-6">
                      <button
                        onClick={() => handlePurchase(pack)}
                        disabled={purchasing === pack.id}
                        className="relative px-10 py-5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white rounded-xl font-heading text-lg shadow-xl hover:shadow-2xl hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center gap-3 overflow-hidden group tracking-wide"
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        
                        {purchasing === pack.id ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                            <span className="relative z-10 font-bold">Processing...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-6 h-6 relative z-10" />
                            <span className="relative z-10 font-bold">Purchase Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
          <div className="flex items-center gap-2.5 text-sm text-slate-300">
            <span className="font-elegant font-semibold tracking-wide">Secured by</span>
            <span className="text-gradient-primary font-heading font-bold text-base">Razorpay</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-600/50 px-10 py-3.5 text-base font-heading font-bold text-slate-200 hover:bg-slate-700/50 hover:border-slate-600 hover:text-white transition-all duration-200 transform hover:scale-105 tracking-wide"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RechargeWalletModal;


