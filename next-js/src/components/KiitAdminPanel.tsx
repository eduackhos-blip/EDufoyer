import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ShieldCheck,
  Wallet2,
  Users,
  MailCheck,
  TrendingUp,
  LogOut,
  Download,
  ChevronDown,
} from 'lucide-react';
import {
  KIIT_ADMIN_CREDENTIALS,
} from '../config/kiitAdmin';
import RechargeWalletModal from './RechargeWalletModal';

const KiitAdminPanel = () => {
  const { socket: sharedSocket, connectSocket } = useSocket();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Initialize with 0 to verify dynamic fetching works
  const [doubtBalance, setDoubtBalance] = useState({
    doubtBuckets: { small: 0, medium: 0, large: 0 },
    totalAvailable: 0 // Start with 0 to verify dynamic fetch
  });
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [kiitUsers, setKiitUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const socketRef = useRef(null);

  // Fetch KIIT users dynamically from backend
  const fetchKiitUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/university/kiit-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-cache',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const users = data.data.users || [];
        setKiitUsers(users);
        setTotalUsers(users.length); // Use actual users array length
        console.log('✅ KIIT users fetched:', users.length, 'users');
        console.log('✅ Users data:', users);
      } else {
        console.warn('⚠️ API response not successful:', data);
        setKiitUsers([]);
        setTotalUsers(0);
      }
    } catch (err) {
      console.error('❌ Error fetching KIIT users:', err);
      // No fallback - keep empty array to show that API failed
      setKiitUsers([]);
      setTotalUsers(0);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch doubt balance from backend
  // IMPORTANT: This function must be defined before it's used as a prop
  // Use useCallback to ensure function stability
  const fetchDoubtBalance = useCallback(async () => {
    try {
      console.log('🔄 ============================================');
      console.log('🔄 Fetching doubt balance from backend...');
      console.log('🔄 Function called at:', new Date().toISOString());
      console.log('🔄 Current window location:', window.location.href);
      
      setLoadingBalance(true);
      console.log('✅ setLoadingBalance(true) called');
      
      // Use full URL to ensure proper proxy
      const apiUrl = `/api/university/doubt-balance?university_email=admin@kiit.ac.in`;
      console.log('🌐 Making fetch request to:', apiUrl);
      console.log('🌐 Full URL would be:', window.location.origin + apiUrl);
      console.log('🌐 Fetch options:', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-cache',
        credentials: 'include'
      });
      
      // Add timestamp to track fetch timing
      const fetchStartTime = Date.now();
      console.log('⏱️ Fetch start time:', fetchStartTime);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-cache', // Prevent caching
        credentials: 'include' // Include credentials for CORS
      });
      
      const fetchEndTime = Date.now();
      console.log('⏱️ Fetch end time:', fetchEndTime);
      console.log('⏱️ Fetch duration:', fetchEndTime - fetchStartTime, 'ms');
      console.log('🌐 Fetch completed, response received');
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Full API response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        const newBalance = {
          doubtBuckets: data.data.doubtBuckets || { small: 0, medium: 0, large: 0 },
          totalAvailable: data.data.totalAvailableDoubts || data.data.totalAvailable || 0
        };
        
        console.log('✅ Parsed new balance:', newBalance);
        // Don't use doubtBalance in comparison - use functional update instead
        
        // Force state update by creating a completely new object with all properties
        // Use functional update to ensure React detects the change
        console.log('🔄 About to call setDoubtBalance...');
        console.log('🔄 New balance to set:', newBalance);
        
        setDoubtBalance((prevState) => {
          console.log('🔄 Previous state in callback:', prevState);
          const updated = {
            doubtBuckets: {
              small: Number(newBalance.doubtBuckets?.small) || 0,
              medium: Number(newBalance.doubtBuckets?.medium) || 0,
              large: Number(newBalance.doubtBuckets?.large) || 0
            },
            totalAvailable: Number(newBalance.totalAvailable) || 0
          };
          
          console.log('🔄 ========== setDoubtBalance CALLBACK ==========');
          console.log('🔄 Previous state:', prevState);
          console.log('🔄 Updated state:', updated);
          console.log('🔄 Values changed:', {
            totalAvailable: updated.totalAvailable !== prevState.totalAvailable,
            small: updated.doubtBuckets.small !== prevState.doubtBuckets?.small,
            medium: updated.doubtBuckets.medium !== prevState.doubtBuckets?.medium,
            large: updated.doubtBuckets.large !== prevState.doubtBuckets?.large
          });
          console.log('🔄 ============================================');
          
          return updated;
        });
        
        console.log('✅ setDoubtBalance called, waiting for React to update...');
        console.log('🔄 ============================================');
      } else {
        console.warn('⚠️ API response not successful:', data);
        console.log('🔄 ============================================');
      }
    } catch (err) {
      console.error('❌ ============================================');
      console.error('❌ Error fetching doubt balance:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      });
      console.error('❌ ============================================');
      // Keep at 0 if API fails - don't use static fallback
      // This ensures we can verify if dynamic fetch is working
      setDoubtBalance({
        doubtBuckets: { small: 0, medium: 0, large: 0 },
        totalAvailable: 0
      });
    } finally {
      setLoadingBalance(false);
    }
  }, []); // Empty dependencies - function doesn't depend on any state
  
  // Debug: Log fetchDoubtBalance function
  console.log('🔍 fetchDoubtBalance function defined:', {
    type: typeof fetchDoubtBalance,
    isFunction: typeof fetchDoubtBalance === 'function',
    functionName: fetchDoubtBalance?.name,
    functionLength: fetchDoubtBalance?.length
  });

  // Fetch balance and users when authenticated
  useEffect(() => {
    console.log('🔍 useEffect triggered - isAuthenticated:', isAuthenticated);
    console.log('🔍 fetchDoubtBalance in useEffect:', typeof fetchDoubtBalance);
    if (isAuthenticated) {
      console.log('✅ User authenticated, fetching data...');
      if (typeof fetchDoubtBalance === 'function') {
        fetchDoubtBalance();
      } else {
        console.error('❌ fetchDoubtBalance is not a function in useEffect!');
      }
      
      // Fetch KIIT users
      fetchKiitUsers();
      
      // Set up socket connection for real-time updates
      const socket = sharedSocket ?? connectSocket();
      if (socket) {
        let onConnect = null;
        let onDisconnect = null;
        let onConnectError = null;
        let onUniversityBalanceUpdated = null;
        let onDoubtBalanceUpdated = null;
        let onUserRegistered = null;
        let onDoubtCreated = null;

        // Store socket in ref for cleanup
        socketRef.current = socket;
        
        onConnect = () => {
          console.log('✅ Socket connected:', socket.id);
          // Join admin room for university updates
          socket.emit('join:admin', { university_email: 'admin@kiit.ac.in' });
        };
        socket.on('connect', onConnect);
        socket.emit('join:admin', { university_email: 'admin@kiit.ac.in' });
        
        onDisconnect = () => {
          console.log('❌ Socket disconnected');
        };
        socket.on('disconnect', onDisconnect);
        
        onConnectError = (error) => {
          console.error('Socket connection error:', error);
        };
        socket.on('connect_error', onConnectError);
        
        onUniversityBalanceUpdated = (data) => {
          console.log('📡 Received balance update from server:', data);
          if (data.university_email === 'admin@kiit.ac.in') {
            // Update balance immediately when server sends update
            setDoubtBalance({
              doubtBuckets: data.doubtBuckets || { small: 0, medium: 0, large: 0 },
              totalAvailable: data.totalAvailable || 0
            });
            console.log('✅ Balance updated from socket event');
          }
        };
        socket.on('university:balance-updated', onUniversityBalanceUpdated);
        
        // Listen for doubt balance updates (when doubt is created)
        onDoubtBalanceUpdated = (data) => {
        console.log('📡 Received doubt balance update from server:', data);
        if (data && (data.university_email === 'admin@kiit.ac.in' || !data.university_email)) {
          // Update balance immediately when a doubt is created
          const updatedBalance = {
            doubtBuckets: data.doubtBuckets || { small: 0, medium: 0, large: 0 },
            totalAvailable: data.totalAvailable || 0
          };
          console.log('🔄 Setting doubt balance state:', updatedBalance);
          setDoubtBalance(updatedBalance);
          console.log('✅ Balance updated from doubt creation event:', updatedBalance);
        } else {
          // If email doesn't match but it's a KIIT admin panel, still refresh
          console.log('🔄 Refreshing balance via API call (fallback)...');
          if (typeof fetchDoubtBalance === 'function') {
            setTimeout(() => fetchDoubtBalance(), 500);
          }
        }
      };
      socket.on('doubt:balance:updated', onDoubtBalanceUpdated);
      
      // Listen for new user registrations
        onUserRegistered = () => {
        console.log('📡 New user registered, refreshing KIIT users...');
        fetchKiitUsers();
      };
      socket.on('user:registered', onUserRegistered);
      
      // Listen for doubt created events - refresh both users and balance
        onDoubtCreated = (data) => {
        console.log('📡 New doubt created event received:', data);
        // Refresh KIIT users list immediately
        if (typeof fetchKiitUsers === 'function') {
          fetchKiitUsers();
        }
        // Refresh balance when doubt is created (always refresh, even if socket event had balance)
        // This ensures we get the latest data from the database
        if (typeof fetchDoubtBalance === 'function') {
          setTimeout(() => {
            console.log('🔄 Refreshing balance after doubt creation (API call)...');
            fetchDoubtBalance();
          }, 300); // Wait 300ms for backend to update balance
        }
      };
      socket.on('doubt:created', onDoubtCreated);
      
      // Refresh balance and users every 5 seconds as fallback (reduced from 30s for faster updates)
        const interval = setInterval(() => {
        console.log('⏰ Auto-refresh: Fetching data...');
        if (typeof fetchDoubtBalance === 'function') {
          fetchDoubtBalance();
        }
        if (typeof fetchKiitUsers === 'function') {
          fetchKiitUsers();
        }
      }, 5000); // Reduced to 5 seconds for faster balance updates
      
        return () => {
          console.log('🧹 Cleaning up interval and socket...');
          clearInterval(interval);
          if (socketRef.current) {
            if (onConnect) socketRef.current.off('connect', onConnect);
            if (onDisconnect) socketRef.current.off('disconnect', onDisconnect);
            if (onConnectError) socketRef.current.off('connect_error', onConnectError);
            if (onUniversityBalanceUpdated) socketRef.current.off('university:balance-updated', onUniversityBalanceUpdated);
            if (onDoubtBalanceUpdated) socketRef.current.off('doubt:balance:updated', onDoubtBalanceUpdated);
            if (onUserRegistered) socketRef.current.off('user:registered', onUserRegistered);
            if (onDoubtCreated) socketRef.current.off('doubt:created', onDoubtCreated);
            socketRef.current = null;
          }
        };
      }
    } else {
      console.log('❌ User not authenticated, skipping fetch');
    }
  }, [isAuthenticated, fetchDoubtBalance, fetchKiitUsers, sharedSocket, connectSocket]);

  const summary = useMemo(() => {
    // Calculate from dynamic kiitUsers data only
    const totalDoubts = kiitUsers.reduce((sum, user) => sum + (user.doubts || 0), 0);
    const totalWallet = kiitUsers.reduce((sum, user) => sum + ((user.doubts || 0) * 110), 0); // 110 per doubt
    const perUser = kiitUsers.length ? Math.round((totalDoubts / kiitUsers.length) * 10) / 10 : 0;
    
    // ALWAYS use doubtBalance from backend - never use static fallback
    // This ensures dynamic fetching works correctly
    const availableDoubts = doubtBalance.totalAvailable || 0; // Use 0 if not fetched yet
    const doubtBuckets = doubtBalance.doubtBuckets || { small: 0, medium: 0, large: 0 };
    
    console.log('📊 Summary recalculated (DYNAMIC):', {
      totalUsers: kiitUsers.length,
      totalDoubts,
      totalWallet,
      availableDoubts,
      doubtBuckets,
      'doubtBalance object': doubtBalance
    });
    
    return {
      totalUsers: kiitUsers.length,
      totalDoubts,
      averagePerUser: perUser,
      walletBalance: availableDoubts * 110, // Calculate from available doubts
      walletUsed: totalWallet,
      availableDoubts, // Always from backend
      doubtBuckets, // Always from backend
    };
  }, [kiitUsers, doubtBalance]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (email === KIIT_ADMIN_CREDENTIALS.email && password === KIIT_ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      setError('');
      return;
    }
    setError('Invalid KIIT admin credentials.');
  };

  const resetSession = () => {
    setEmail('');
    setPassword('');
    setIsAuthenticated(false);
    setError('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-blue-900/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">KIIT Admin Access</h1>
              <p className="text-slate-400 text-sm">
                Authenticate to enter the university control room
              </p>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="2105834@kiit.ac.in"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:shadow-cyan-900/40"
            >
              Grant Access
            </button>
          </form>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <p>Demo credentials</p>
            <p>Email: {KIIT_ADMIN_CREDENTIALS.email}</p>
            <p>Password: {KIIT_ADMIN_CREDENTIALS.password}</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure fetchDoubtBalance is defined before passing as prop
  console.log('🔍 ========== KiitAdminPanel RENDER ==========');
  console.log('🔍 About to render KiitAdminDashboardView');
  console.log('🔍 fetchDoubtBalance details:', {
    type: typeof fetchDoubtBalance,
    isFunction: typeof fetchDoubtBalance === 'function',
    value: fetchDoubtBalance,
    name: fetchDoubtBalance?.name,
    toString: fetchDoubtBalance?.toString?.()?.substring(0, 100)
  });
  console.log('🔍 doubtBalance:', doubtBalance);
  console.log('🔍 loadingBalance:', loadingBalance);
  console.log('🔍 summary:', summary);
  
  if (typeof fetchDoubtBalance !== 'function') {
    console.error('❌ ========== CRITICAL ERROR ==========');
    console.error('❌ fetchDoubtBalance is NOT a function!');
    console.error('❌ Type:', typeof fetchDoubtBalance);
    console.error('❌ Value:', fetchDoubtBalance);
    console.error('❌ ====================================');
  } else {
    console.log('✅ fetchDoubtBalance is a valid function');
  }
  
  // Create wrapper functions to ensure they're always functions
  // Use useCallback to memoize and ensure stability
  const handlePurchaseSuccess = useCallback(() => {
    console.log('🔄 handlePurchaseSuccess wrapper called');
    console.log('🔄 fetchDoubtBalance available:', typeof fetchDoubtBalance === 'function');
    if (typeof fetchDoubtBalance === 'function') {
      fetchDoubtBalance();
    } else {
      console.error('❌ fetchDoubtBalance is not a function in handlePurchaseSuccess');
    }
  }, [fetchDoubtBalance]);
  
  const handleRefreshDoubtBalance = useCallback(() => {
    console.log('🔄 handleRefreshDoubtBalance wrapper called');
    console.log('🔄 fetchDoubtBalance available:', typeof fetchDoubtBalance === 'function');
    if (typeof fetchDoubtBalance === 'function') {
      fetchDoubtBalance();
    } else {
      console.error('❌ fetchDoubtBalance is not a function in handleRefreshDoubtBalance');
    }
  }, [fetchDoubtBalance]);
  
  console.log('🔍 Wrapper functions created:', {
    handlePurchaseSuccess: typeof handlePurchaseSuccess,
    handleRefreshDoubtBalance: typeof handleRefreshDoubtBalance,
    'handlePurchaseSuccess is function': typeof handlePurchaseSuccess === 'function',
    'handleRefreshDoubtBalance is function': typeof handleRefreshDoubtBalance === 'function'
  });
  
  // Generate dynamic wallet history from actual data (last 7 days)
  const walletHistory = useMemo(() => {
    const history = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Calculate wallet used for this day based on user doubts
      // This is a simplified calculation - can be enhanced with actual transaction data
      const dayUsers = kiitUsers.filter(user => {
        if (!user.registeredAt) return false;
        const userDate = new Date(user.registeredAt);
        return userDate.toDateString() === date.toDateString();
      });
      
      const dayDoubts = dayUsers.reduce((sum, user) => sum + (user.doubts || 0), 0);
      const walletUsed = dayDoubts * 110; // 110 per doubt
      
      history.push({
        date: dateStr,
        balance: walletUsed
      });
    }
    return history;
  }, [kiitUsers]);

  // Verify props before passing
  const propsToPass = {
    summary,
    kiitUsers,
    allUsers: kiitUsers, // Use dynamic users instead of static data
    walletHistory: walletHistory, // Use dynamic wallet history
    onLogout: resetSession,
    onPurchaseSuccess: handlePurchaseSuccess,
    refreshDoubtBalance: handleRefreshDoubtBalance,
    doubtBalance,
    loadingBalance,
    loadingUsers,
    totalUsers
  };
  
  console.log('🔍 Props being passed to KiitAdminDashboardView:', {
    onPurchaseSuccess: typeof propsToPass.onPurchaseSuccess,
    refreshDoubtBalance: typeof propsToPass.refreshDoubtBalance,
    'onPurchaseSuccess is function': typeof propsToPass.onPurchaseSuccess === 'function',
    'refreshDoubtBalance is function': typeof propsToPass.refreshDoubtBalance === 'function',
    allKeys: Object.keys(propsToPass),
    'propsToPass object': propsToPass
  });
  console.log('🔍 ============================================');
  
  // CRITICAL: Verify all props exist before passing
  if (!propsToPass.onPurchaseSuccess || !propsToPass.refreshDoubtBalance) {
    console.error('❌ ========== CRITICAL: MISSING PROPS ==========');
    console.error('❌ onPurchaseSuccess:', propsToPass.onPurchaseSuccess);
    console.error('❌ refreshDoubtBalance:', propsToPass.refreshDoubtBalance);
    console.error('❌ handlePurchaseSuccess:', handlePurchaseSuccess);
    console.error('❌ handleRefreshDoubtBalance:', handleRefreshDoubtBalance);
    console.error('❌ fetchDoubtBalance:', fetchDoubtBalance);
    console.error('❌ ============================================');
  }
  
  // Explicitly pass all props to ensure they're received
  return (
    <KiitAdminDashboardView
      summary={propsToPass.summary}
      kiitUsers={kiitUsers}
      allUsers={kiitUsers}
      walletHistory={propsToPass.walletHistory}
      onLogout={propsToPass.onLogout}
      onPurchaseSuccess={propsToPass.onPurchaseSuccess || handlePurchaseSuccess}
      refreshDoubtBalance={propsToPass.refreshDoubtBalance || handleRefreshDoubtBalance}
      doubtBalance={propsToPass.doubtBalance}
      loadingBalance={propsToPass.loadingBalance}
      loadingUsers={loadingUsers}
      totalUsers={totalUsers}
    />
  );
};

export const KiitAdminDashboardView = (props) => {
  const { 
    summary, 
    kiitUsers = [], 
    allUsers = [], 
    walletHistory, 
    onLogout, 
    onPurchaseSuccess, 
    refreshDoubtBalance, 
    doubtBalance, 
    loadingBalance,
    loadingUsers = false,
    totalUsers = 0
  } = props;
  
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  
  // Debug: Log ALL props received - use useEffect to track changes
  useEffect(() => {
    console.log('🔍 ========== KiitAdminDashboardView PROPS (useEffect) ==========');
    console.log('🔍 All props object:', props);
    console.log('🔍 Props keys:', Object.keys(props || {}));
    console.log('🔍 Expected keys:', ['summary', 'kiitUsers', 'allUsers', 'walletHistory', 'onLogout', 'onPurchaseSuccess', 'refreshDoubtBalance', 'doubtBalance', 'loadingBalance']);
    console.log('🔍 Missing keys:', ['summary', 'kiitUsers', 'allUsers', 'walletHistory', 'onLogout', 'onPurchaseSuccess', 'refreshDoubtBalance', 'doubtBalance', 'loadingBalance'].filter(key => !(key in (props || {}))));
    console.log('🔍 Destructured props:', {
      refreshDoubtBalance: {
        type: typeof refreshDoubtBalance,
        value: refreshDoubtBalance,
        isFunction: typeof refreshDoubtBalance === 'function',
        name: refreshDoubtBalance?.name,
        'in props': 'refreshDoubtBalance' in (props || {})
      },
      onPurchaseSuccess: {
        type: typeof onPurchaseSuccess,
        value: onPurchaseSuccess,
        isFunction: typeof onPurchaseSuccess === 'function',
        name: onPurchaseSuccess?.name,
        'in props': 'onPurchaseSuccess' in (props || {})
      },
      doubtBalance: {
        value: doubtBalance,
        'in props': 'doubtBalance' in (props || {})
      },
      loadingBalance: {
        value: loadingBalance,
        'in props': 'loadingBalance' in (props || {})
      }
    });
    console.log('🔍 ================================================');
  }, [props, refreshDoubtBalance, onPurchaseSuccess, doubtBalance, loadingBalance]);
  
  // Also log on every render
  console.log('🔍 KiitAdminDashboardView render - props:', {
    hasProps: !!props,
    propsKeys: props ? Object.keys(props) : [],
    refreshDoubtBalance: typeof refreshDoubtBalance,
    onPurchaseSuccess: typeof onPurchaseSuccess,
    'refreshDoubtBalance in props': props && 'refreshDoubtBalance' in props,
    'onPurchaseSuccess in props': props && 'onPurchaseSuccess' in props,
    'doubtBalance in props': props && 'doubtBalance' in props,
    'loadingBalance in props': props && 'loadingBalance' in props
  });
  
  // Create a local refresh function that uses props
  const handleRefreshBalance = useCallback(() => {
    console.log('🔄 ========== handleRefreshBalance CALLED ==========');
    console.log('🔄 Current props:', {
      refreshDoubtBalance: {
        type: typeof refreshDoubtBalance,
        value: refreshDoubtBalance,
        isFunction: typeof refreshDoubtBalance === 'function',
        name: refreshDoubtBalance?.name
      },
      onPurchaseSuccess: {
        type: typeof onPurchaseSuccess,
        value: onPurchaseSuccess,
        isFunction: typeof onPurchaseSuccess === 'function',
        name: onPurchaseSuccess?.name
      }
    });
    
    // Try refreshDoubtBalance first
    if (refreshDoubtBalance && typeof refreshDoubtBalance === 'function') {
      console.log('✅ Using refreshDoubtBalance prop');
      try {
        refreshDoubtBalance();
      } catch (error) {
        console.error('❌ Error calling refreshDoubtBalance:', error);
      }
      return;
    }
    
    // Try onPurchaseSuccess as fallback
    if (onPurchaseSuccess && typeof onPurchaseSuccess === 'function') {
      console.log('✅ Using onPurchaseSuccess prop');
      try {
        onPurchaseSuccess();
      } catch (error) {
        console.error('❌ Error calling onPurchaseSuccess:', error);
      }
      return;
    }
    
    // If both are undefined, log detailed error
    console.error('❌ ========== NO REFRESH FUNCTION AVAILABLE ==========');
    console.error('❌ refreshDoubtBalance:', refreshDoubtBalance);
    console.error('❌ onPurchaseSuccess:', onPurchaseSuccess);
    console.error('❌ Full props object:', props);
    console.error('❌ This means fetchDoubtBalance was not properly passed from parent');
    console.error('❌ ================================================');
  }, [refreshDoubtBalance, onPurchaseSuccess, props]);
  
  // Debug: Log props when component receives them
  useEffect(() => {
    console.log('🔍 KiitAdminDashboardView - Props received:', {
      refreshDoubtBalance: typeof refreshDoubtBalance,
      onPurchaseSuccess: typeof onPurchaseSuccess,
      doubtBalance: doubtBalance,
      loadingBalance: loadingBalance,
      'refreshDoubtBalance is function': typeof refreshDoubtBalance === 'function',
      'onPurchaseSuccess is function': typeof onPurchaseSuccess === 'function',
      'refreshDoubtBalance value': refreshDoubtBalance,
      'onPurchaseSuccess value': onPurchaseSuccess
    });
  }, [refreshDoubtBalance, onPurchaseSuccess, doubtBalance, loadingBalance]);
  
  const doubtBarData = useMemo(
    () =>
      kiitUsers.map((user) => ({
        name: user.email.split('@')[0],
        doubts: user.doubts,
      })),
    [kiitUsers]
  );
  
  // ALWAYS use doubtBalance directly from state - never use summary fallback
  // This ensures we're using the latest fetched data from backend
  const currentDoubtBuckets = doubtBalance?.doubtBuckets || { small: 0, medium: 0, large: 0 };
  const currentAvailableDoubts = doubtBalance?.totalAvailable ?? 0;
  
  const { small = 0, medium = 0, large = 0 } = currentDoubtBuckets;
  
  // DEBUG: Log component render with full state
  console.log('🔍 ========== KiitAdminDashboardView RENDER ==========');
  console.log('🔍 Props received:', {
    doubtBalance,
    loadingBalance,
    'doubtBalance type': typeof doubtBalance,
    'doubtBalance is null': doubtBalance === null,
    'doubtBalance is undefined': doubtBalance === undefined
  });
  console.log('🔍 Calculated values:', {
    currentAvailableDoubts,
    currentDoubtBuckets,
    small,
    medium,
    large
  });
  console.log('🔍 Summary:', summary);
  console.log('🔍 ================================================');
  
  // Log whenever doubtBalance prop changes
  useEffect(() => {
    console.log('🔄 KiitAdminDashboardView - doubtBalance prop changed:', {
      oldValue: doubtBalance,
      'totalAvailable': doubtBalance?.totalAvailable,
      'doubtBuckets': doubtBalance?.doubtBuckets
    });
  }, [doubtBalance]);
  
  // Log whenever loadingBalance changes
  useEffect(() => {
    console.log('🔄 KiitAdminDashboardView - loadingBalance changed:', loadingBalance);
  }, [loadingBalance]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-900/40 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-400">KIIT Command</p>
            <h1 className="text-3xl font-semibold mt-1">University Admin Control Room</h1>
            <p className="text-slate-400 mt-2">
              Live view of KIIT wallet burn, authenticated askers, and their doubt traffic.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-red-400 hover:text-white"
          >
            <LogOut size={16} />
            End Secure Session
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            key={`doubt-balance-${currentAvailableDoubts}-${small}-${medium}-${large}`}
            icon={<Wallet2 className="text-emerald-400" size={26} width={26} height={26} />}
            label="Available Doubts"
            value={loadingBalance ? '...' : String(currentAvailableDoubts)}
            subLabel={loadingBalance ? 'Loading...' : `S:${small} M:${medium} L:${large}`}
            ctaLabel="Recharge Wallet"
            onCtaClick={() => {
              console.log('🔍 Recharge Wallet button clicked');
              setShowRechargeModal(true);
            }}
          />
          <StatCard
            icon={<Users className="text-blue-400" size={26} width={26} height={26} />}
            label="Active KIIT Users"
            value={summary.totalUsers}
            subLabel="Licensed askers on KIIT domain"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Wallet Growth</p>
                <h3 className="text-xl font-semibold mt-1">Quarterly top-ups</h3>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Live
              </span>
            </div>
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={walletHistory}>
                  <defs>
                    <linearGradient id="balance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1f2937',
                      color: '#f1f5f9',
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Balance']}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#balance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Doubt Load</p>
                <h3 className="text-xl font-semibold mt-1">Per-user KIIT distribution</h3>
              </div>
              <div className="text-right text-sm text-slate-400">
                <p>Last 30 days</p>
              </div>
            </div>
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doubtBarData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1f2937',
                      color: '#f1f5f9',
                    }}
                    formatter={(value) => [`${value} doubts`, 'Count']}
                  />
                  <Bar dataKey="doubts" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">Verified KIIT askers</p>
                <h3 className="text-xl font-semibold mt-1">Domain mails in session</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Show:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 pr-8 rounded-lg hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  Showing {loadingUsers ? '...' : Math.min(pageSize, kiitUsers.length)} of {loadingUsers ? '...' : (totalUsers || kiitUsers.length)} total askers
                </span>
                <button
                  onClick={() => {
                    // Export to CSV
                    const headers = ['Email', 'Total Small', 'Total Medium', 'Total Large', 'Total Doubts Asked', 'Last Active', 'Registered At'];
                    const csvContent = [
                      headers.join(','),
                      ...kiitUsers.map(user => {
                        const totalCounts = user.totalCategoryCounts || { small: 0, medium: 0, large: 0 };
                        return [
                          user.email || '',
                          totalCounts.small,
                          totalCounts.medium,
                          totalCounts.large,
                          user.doubts || 0,
                          user.lastActive || 'Never',
                          user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : ''
                        ].join(',');
                      })
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `kiit-users-${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  disabled={loadingUsers || kiitUsers.length === 0}
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800">
              <table className="w-full table-auto">
                <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Total Doubts</th>
                    <th className="px-4 py-3 font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : kiitUsers.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-400">
                        No KIIT users found
                      </td>
                    </tr>
                  ) : (
                    kiitUsers.slice(0, pageSize).map((user) => {
                      const totalCounts = user.totalCategoryCounts || { small: 0, medium: 0, large: 0 };
                      return (
                        <tr key={user.id || user.email} className="border-t border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 text-slate-100 font-medium">{user.email}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-emerald-300 font-semibold">
                                S: {totalCounts.small}, M: {totalCounts.medium}, L: {totalCounts.large}
                              </span>
                              <span className="text-xs text-emerald-400/80">
                                Total: {user.doubts || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-400">{user.lastActive || 'Never'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Wallet utilization</p>
                <h3 className="text-xl font-semibold mt-1">Session payouts</h3>
              </div>
              <span className="text-xs text-emerald-300">Auto reconciled</span>
            </div>
            <div className="space-y-4">
              {loadingUsers ? (
                <div className="text-center py-8 text-slate-400">Loading wallet data...</div>
              ) : kiitUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No users found</div>
              ) : (
                kiitUsers.slice(0, 5).map((user) => (
                  <div
                    key={`wallet-${user.id || user.email}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 hover:bg-slate-900/60 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{user.email}</p>
                      <p className="text-xs text-slate-400">{user.doubts || 0} doubts asked</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-300">
                        {user.doubts || 0}
                      </p>
                      <p className="text-xs text-slate-500">total doubts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
      
      <RechargeWalletModal 
        isOpen={showRechargeModal}
        onClose={() => {
          setShowRechargeModal(false);
          // Refresh doubt balance after closing modal (in case purchase was made)
          console.log('🔄 Modal closed, checking refreshDoubtBalance:', {
            refreshDoubtBalance: typeof refreshDoubtBalance,
            onPurchaseSuccess: typeof onPurchaseSuccess
          });
          
          if (refreshDoubtBalance && typeof refreshDoubtBalance === 'function') {
            console.log('🔄 Modal closed, refreshing doubt balance...');
            setTimeout(() => {
              refreshDoubtBalance();
            }, 1500);
          } else if (onPurchaseSuccess && typeof onPurchaseSuccess === 'function') {
            console.log('🔄 Modal closed, using onPurchaseSuccess...');
            setTimeout(() => {
              onPurchaseSuccess();
            }, 1500);
          } else {
            console.warn('⚠️ No refresh function available when modal closed');
          }
        }}
        universityInfo={{
          id: 'kiit-university-id',
          name: 'KIIT University',
          email: 'admin@kiit.ac.in'
        }}
        onPurchaseSuccess={() => {
          console.log('🔄 Purchase success callback called, checking functions...');
          console.log('🔄 refreshDoubtBalance:', typeof refreshDoubtBalance, refreshDoubtBalance);
          console.log('🔄 onPurchaseSuccess:', typeof onPurchaseSuccess, onPurchaseSuccess);
          
          if (refreshDoubtBalance && typeof refreshDoubtBalance === 'function') {
            console.log('✅ Calling refreshDoubtBalance...');
            refreshDoubtBalance();
          } else if (onPurchaseSuccess && typeof onPurchaseSuccess === 'function') {
            console.log('✅ Calling onPurchaseSuccess...');
            onPurchaseSuccess();
          } else {
            console.error('❌ No refresh function available in purchase success callback');
          }
        }}
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, subLabel, ctaLabel, onCtaClick }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div className="rounded-2xl bg-slate-800/80 p-3">
        {React.isValidElement(icon) ? React.cloneElement(icon, { width: 26, height: 26 }) : icon}
      </div>
      <span className="text-xs uppercase tracking-widest text-slate-500">Secure</span>
    </div>
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      <p className="text-xs text-slate-500 mt-2">{subLabel}</p>
    </div>
    {ctaLabel && (
      <button
        type="button"
        onClick={onCtaClick}
        className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20"
      >
        {ctaLabel}
      </button>
    )}
  </div>
);

export default KiitAdminPanel;


