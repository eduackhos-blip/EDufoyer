import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../contexts/SocketContext';
import {
  KIIT_ADMIN_AUTH_KEY,
} from '../config/kiitAdmin';
import { KiitAdminDashboardView } from './KiitAdminPanel';

const UniversityAdminDashboard = () => {
  const router = useRouter();
  const { socket: sharedSocket, connectSocket } = useSocket();
  const isAuthed = localStorage.getItem(KIIT_ADMIN_AUTH_KEY) === 'true';
  
  // State for doubt balance
  const [doubtBalance, setDoubtBalance] = useState({
    doubtBuckets: { small: 0, medium: 0, large: 0 },
    totalAvailable: 0
  });
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [kiitUsers, setKiitUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (!isAuthed) {
      router.replace('/university/admin/login');
    }
  }, [isAuthed, router]);

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
        setTotalUsers(users.length);
        console.log('✅ KIIT users fetched:', users.length, 'users');
      } else {
        console.warn('⚠️ API response not successful:', data);
        setKiitUsers([]);
        setTotalUsers(0);
      }
    } catch (err) {
      console.error('❌ Error fetching KIIT users:', err);
      setKiitUsers([]);
      setTotalUsers(0);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch doubt balance from backend
  const fetchDoubtBalance = useCallback(async () => {
    try {
      console.log('🔄 UniversityAdminDashboard - Fetching doubt balance...');
      setLoadingBalance(true);
      const response = await fetch(`/api/university/doubt-balance?university_email=admin@kiit.ac.in`, {
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
      console.log('📊 UniversityAdminDashboard - API response:', data);

      if (data.success && data.data) {
        const newBalance = {
          doubtBuckets: data.data.doubtBuckets || { small: 0, medium: 0, large: 0 },
          totalAvailable: data.data.totalAvailableDoubts || data.data.totalAvailable || 0
        };
        console.log('✅ UniversityAdminDashboard - Setting balance:', newBalance);
        setDoubtBalance(newBalance);
      }
    } catch (err) {
      console.error('❌ UniversityAdminDashboard - Error fetching balance:', err);
      setDoubtBalance({
        doubtBuckets: { small: 0, medium: 0, large: 0 },
        totalAvailable: 0
      });
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // Fetch balance and users when authenticated
  useEffect(() => {
    if (isAuthed) {
      fetchDoubtBalance();
      fetchKiitUsers();
      
      // Set up socket connection for real-time updates
      const socket = sharedSocket ?? connectSocket();
      if (socket) {
        const onConnect = () => {
          socket.emit('join:admin', { university_email: 'admin@kiit.ac.in' });
        };
        const onUniversityBalanceUpdated = (data) => {
          if (data.university_email === 'admin@kiit.ac.in') {
            setDoubtBalance({
              doubtBuckets: data.doubtBuckets || { small: 0, medium: 0, large: 0 },
              totalAvailable: data.totalAvailable || 0
            });
          }
        };
        
        const onUserRegistered = () => {
          fetchKiitUsers();
        };
        
        const onDoubtCreated = () => {
          fetchKiitUsers();
        };

        socket.on('connect', onConnect);
        socket.on('university:balance-updated', onUniversityBalanceUpdated);
        socket.on('user:registered', onUserRegistered);
        socket.on('doubt:created', onDoubtCreated);
        socket.emit('join:admin', { university_email: 'admin@kiit.ac.in' });
        
        const interval = setInterval(() => {
          fetchDoubtBalance();
          fetchKiitUsers();
        }, 30000);
        
        return () => {
          clearInterval(interval);
          socket.off('connect', onConnect);
          socket.off('university:balance-updated', onUniversityBalanceUpdated);
          socket.off('user:registered', onUserRegistered);
          socket.off('doubt:created', onDoubtCreated);
        };
      }
    }
  }, [isAuthed, fetchDoubtBalance, fetchKiitUsers, sharedSocket, connectSocket]);

  // Generate dynamic wallet history from actual data (last 7 days)
  const walletHistory = useMemo(() => {
    const history = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayUsers = kiitUsers.filter(user => {
        if (!user.registeredAt) return false;
        const userDate = new Date(user.registeredAt);
        return userDate.toDateString() === date.toDateString();
      });
      
      const dayDoubts = dayUsers.reduce((sum, user) => sum + (user.doubts || 0), 0);
      const walletUsed = dayDoubts * 110;
      
      history.push({
        date: dateStr,
        balance: walletUsed
      });
    }
    return history;
  }, [kiitUsers]);

  const summary = useMemo(() => {
    const totalDoubts = kiitUsers.reduce((sum, user) => sum + (user.doubts || 0), 0);
    const totalWallet = kiitUsers.reduce((sum, user) => sum + ((user.doubts || 0) * 110), 0);
    const averagePerUser = kiitUsers.length
      ? Math.round((totalDoubts / kiitUsers.length) * 10) / 10
      : 0;
    const availableDoubts = doubtBalance.totalAvailable || 0;
    const doubtBuckets = doubtBalance.doubtBuckets || { small: 0, medium: 0, large: 0 };

    return {
      totalUsers: kiitUsers.length,
      totalDoubts,
      averagePerUser,
      walletBalance: availableDoubts * 110,
      walletUsed: totalWallet,
      availableDoubts,
      doubtBuckets,
    };
  }, [kiitUsers, doubtBalance]);

  const handleLogout = () => {
    localStorage.removeItem(KIIT_ADMIN_AUTH_KEY);
    router.push('/university/admin/login');
  };

  if (!isAuthed) {
    return null;
  }

  console.log('🔍 UniversityAdminDashboard - Rendering with props:', {
    refreshDoubtBalance: typeof fetchDoubtBalance,
    onPurchaseSuccess: typeof fetchDoubtBalance,
    doubtBalance: doubtBalance,
    loadingBalance: loadingBalance
  });

  return (
    <KiitAdminDashboardView
      summary={summary}
      kiitUsers={kiitUsers}
      allUsers={kiitUsers}
      walletHistory={walletHistory}
      onLogout={handleLogout}
      onPurchaseSuccess={fetchDoubtBalance}
      refreshDoubtBalance={fetchDoubtBalance}
      doubtBalance={doubtBalance}
      loadingBalance={loadingBalance}
      loadingUsers={loadingUsers}
      totalUsers={totalUsers}
    />
  );
};

export default UniversityAdminDashboard;



