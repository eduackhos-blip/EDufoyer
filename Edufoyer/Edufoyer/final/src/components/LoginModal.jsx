import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X, FileText, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import EmailVerification from './EmailVerification';
import DarkModeToggle from './DarkModeToggle';

const LoginModal = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const navigate = useNavigate();
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); // 'email', 'otp', 'reset'
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  
  // DPDP Act compliance states
  const [acceptDPDP, setAcceptDPDP] = useState(false);
  const [showDPDPModal, setShowDPDPModal] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const isCacheVerified = localStorage.getItem('cacheVerified') === 'true';
      navigate(isCacheVerified ? '/dashboard/profile' : '/verify-cache');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await authService.login(email, password);
      if (result.success) {
        localStorage.removeItem('cacheVerified');
        navigate('/verify-cache');
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Check if terms are accepted
    if (!acceptDPDP) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await authService.register(name, email, password);
      if (result.success) {
        // Check if email verification is required
        if (result.verificationRequired) {
          setPendingEmail(email);
          setShowEmailVerification(true);
        } else {
          localStorage.removeItem('cacheVerified');
          navigate('/verify-cache');
        }
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (isRegisterMode) {
      handleRegister(e);
    } else {
      handleLogin(e);
    }
  };

  const handleVerificationSuccess = (data) => {
    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('cacheVerified');
    navigate('/verify-cache');
  };

  const handleResendVerification = () => {
    // This will be handled by the EmailVerification component
  };

  // Forgot password handlers
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const result = await authService.forgotPassword(resetEmail);
      if (result.success) {
        setForgotPasswordStep('otp');
      }
    } catch (error) {
      setForgotPasswordError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const result = await authService.verifyResetOTP(resetEmail, otp);
      if (result.success) {
        setForgotPasswordStep('reset');
      }
    } catch (error) {
      setForgotPasswordError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    if (newPassword !== confirmPassword) {
      setForgotPasswordError('Passwords do not match');
      setForgotPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setForgotPasswordError('Password must be at least 6 characters long');
      setForgotPasswordLoading(false);
      return;
    }

    try {
      const result = await authService.resetPassword(resetEmail, otp, newPassword);
      if (result.success) {
        // Reset all states and close modal
        setShowForgotPassword(false);
        setForgotPasswordStep('email');
        setResetEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotPasswordError('');
        setSuccessMessage('Password reset successfully! Please login with your new password.');
        setError('');
      }
    } catch (error) {
      setForgotPasswordError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setResetEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotPasswordError('');
  };

  // Show email verification if needed
  if (showEmailVerification) {
    return (
      <EmailVerification
        email={pendingEmail}
        onVerificationSuccess={handleVerificationSuccess}
        onResendVerification={handleResendVerification}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Notebook background overlay (ruled paper) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(31,41,55,0.06) 0px, rgba(31,41,55,0.06) 1px, transparent 1px, transparent 28px), linear-gradient(to right, rgba(31,41,55,0.10) 0px, rgba(31,41,55,0.10) 3px, transparent 3px)',
          backgroundSize: '100% 100%',
        }}
      />
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none z-0" />

      {/* Blurred sticky notes layer - slight blur, large notes with full sentences */}
      <div aria-hidden className="absolute inset-0 z-[1] pointer-events-none overflow-hidden blur-sm md:blur">
        {/* Row 1 */}
        <div className="absolute left-[4%] top-[6%] rotate-[-12deg] w-48 md:w-64 max-w-[200px] md:max-w-[260px]">
          <div className="bg-[#FFF7CC] rounded-[16px] px-4 py-3.5 border border-[#F3E29A] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">OS scheduling algorithms determine the order of process execution in the CPU.</p>
          </div>
        </div>
        <div className="absolute left-[22%] top-[4%] rotate-[6deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px]">
          <div className="bg-[#E0F9FF] rounded-[16px] px-4 py-3.5 border border-[#B9E6F2] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">DBMS normalization reduces data redundancy and improves integrity.</p>
          </div>
        </div>
        <div className="absolute right-[6%] top-[10%] rotate-[10deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px]">
          <div className="bg-[#F8E9FF] rounded-[16px] px-4 py-3.5 border border-[#E1C0FF] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">The pumping lemma for CFLs helps prove a language is not context-free.</p>
          </div>
        </div>
        <div className="absolute right-[26%] top-[4%] rotate-[-5deg] w-48 md:w-60 max-w-[200px] md:max-w-[240px]">
          <div className="bg-[#FFE5F2] rounded-[16px] px-4 py-3.5 border border-[#FFC4E0] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Distance vector routing can suffer from the count-to-infinity problem.</p>
          </div>
        </div>
        {/* Row 2 */}
        <div className="absolute left-[2%] top-[26%] rotate-[8deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px]">
          <div className="bg-[#E7F7EE] rounded-[16px] px-4 py-3.5 border border-[#A7F3D0] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">DSA revision: BFS and DFS differ in how they explore graph vertices.</p>
          </div>
        </div>
        <div className="absolute left-[16%] top-[32%] rotate-[-8deg] w-48 md:w-60 max-w-[200px] md:max-w-[240px]">
          <div className="bg-[#E0E7FF] rounded-[16px] px-4 py-3.5 border border-[#C7D2FE] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Two-phase locking prevents cascading rollbacks in transaction management.</p>
          </div>
        </div>
        <div className="absolute right-[4%] top-[28%] rotate-[-10deg] w-48 md:w-60 max-w-[200px] md:max-w-[240px]">
          <div className="bg-[#FEF3C7] rounded-[16px] px-4 py-3.5 border border-[#FDE68A] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Priority inversion occurs when a lower priority task blocks a higher one.</p>
          </div>
        </div>
        <div className="absolute right-[20%] top-[35%] rotate-[4deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px]">
          <div className="bg-[#F3E8FF] rounded-[16px] px-4 py-3.5 border border-[#E9D5FF] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">B+ tree indexing is better for range queries than B-tree structures.</p>
          </div>
        </div>
        {/* Row 3 - center area (around login box) */}
        <div className="absolute left-[6%] top-[50%] rotate-[6deg] w-40 md:w-52 max-w-[160px] md:max-w-[210px]">
          <div className="bg-[#DBEAFE] rounded-[16px] px-4 py-3.5 border border-[#93C5FD] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Join the community to ask doubts and get answers from peers.</p>
          </div>
        </div>
        <div className="absolute left-[28%] top-[56%] rotate-[-7deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px]">
          <div className="bg-[#FECDD3] rounded-[16px] px-4 py-3.5 border border-[#FDA4AF] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Ask your doubts and receive help from authorized peer solvers.</p>
          </div>
        </div>
        <div className="absolute right-[6%] top-[52%] rotate-[-6deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px]">
          <div className="bg-[#CCFBF1] rounded-[16px] px-4 py-3.5 border border-[#5EEAD4] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Solve doubts for others and earn while helping the community.</p>
          </div>
        </div>
        <div className="absolute right-[26%] top-[60%] rotate-[9deg] w-40 md:w-52 max-w-[160px] md:max-w-[210px]">
          <div className="bg-[#FCE7F3] rounded-[16px] px-4 py-3.5 border border-[#F9A8D4] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Learn together and grow with students from across KIIT.</p>
          </div>
        </div>
        {/* Row 4 */}
        <div className="absolute left-[10%] top-[76%] rotate-[-4deg] w-48 md:w-60 max-w-[200px] md:max-w-[240px]">
          <div className="bg-[#FFF7CC] rounded-[16px] px-4 py-3.5 border border-[#F3E29A] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Use your official KIIT email address to register and sign in.</p>
          </div>
        </div>
        <div className="absolute left-[38%] top-[80%] rotate-[7deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px]">
          <div className="bg-[#E0F9FF] rounded-[16px] px-4 py-3.5 border border-[#B9E6F2] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Peer-to-peer learning makes concepts stick faster than solo study.</p>
          </div>
        </div>
        <div className="absolute right-[12%] top-[78%] rotate-[-9deg] w-48 md:w-60 max-w-[200px] md:max-w-[240px]">
          <div className="bg-[#F8E9FF] rounded-[16px] px-4 py-3.5 border border-[#E1C0FF] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Earn together by solving doubts and helping fellow students.</p>
          </div>
        </div>
        <div className="absolute right-[40%] top-[73%] rotate-[3deg] w-40 md:w-52 max-w-[160px] md:max-w-[210px]">
          <div className="bg-[#E7F7EE] rounded-[16px] px-4 py-3.5 border border-[#A7F3D0] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">Study tips: practice problems beat rereading the same notes.</p>
          </div>
        </div>
        {/* Extra notes for denser fill */}
        <div className="absolute left-[52%] top-[16%] rotate-[11deg] w-40 md:w-52 max-w-[160px] md:max-w-[210px] hidden md:block">
          <div className="bg-[#FEF3C7] rounded-[16px] px-4 py-3.5 border border-[#FDE68A] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">CASCADE in foreign keys deletes related rows when parent is removed.</p>
          </div>
        </div>
        <div className="absolute left-[68%] top-[42%] rotate-[-6deg] w-44 md:w-56 max-w-[180px] md:max-w-[220px] hidden md:block">
          <div className="bg-[#DBEAFE] rounded-[16px] px-4 py-3.5 border border-[#93C5FD] shadow-lg" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.14)' }}>
            <p className="text-xs md:text-sm font-semibold text-gray-700 leading-snug">The TCP four-way handshake ensures graceful connection termination.</p>
          </div>
        </div>
      </div>

      {/* Navbar - matches landing page */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between p-4 md:p-6">
          <Link to="/" className="flex items-center group">
            <h1 className="font-display text-2xl md:text-3xl font-bold italic transition-colors duration-300 group-hover:opacity-90">
              <span className="hero-heading-gradient">EDU</span>
              <span className="relative inline-block mx-1">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg transform rotate-3" />
                <span className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg px-1 py-0.5 text-white font-bold text-xl md:text-2xl">F</span>
              </span>
              <span className="hero-heading-gradient">OYER</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <nav className="hidden md:flex items-center gap-4">
              <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                Contact Us
              </Link>
            </nav>
            <div className="md:hidden flex items-center gap-2">
              <Link to="/about" className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium px-2">About</Link>
              <Link to="/contact" className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium px-2">Contact</Link>
            </div>
            <DarkModeToggle className="p-2 md:p-3" />
          </div>
        </div>
      </header>

      {/* Main Content - sharp, in front of blurred notes */}
      <main className="flex-1 flex items-center justify-center p-4 pt-24 md:pt-28 pb-8 relative z-20">
        <div className="w-full max-w-md mx-auto relative">
          {/* Auth Card - tilted, glossy, in focus */}
          <div
            className="transform rotate-[1deg] bg-white dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 w-full relative border border-gray-200/80 dark:border-gray-700/80 card-hover overflow-hidden"
            style={{
              boxShadow: '0 18px 55px rgba(15,23,42,0.14), 0 1px 0 rgba(255,255,255,0.9) inset',
            }}
          >
            {/* Close button - navigate to landing page */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Close and go to home"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold">
                <span className="hero-heading-gradient">Get Started</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {isRegisterMode ? 'Create your account to join the community' : 'Welcome back! Sign in to continue'}
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-green-600 dark:text-green-400 text-sm">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                  Mail ID <span className="text-xs text-gray-500">(Only @kiit.ac.in)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="your roll no@kiit.ac.in"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use your official KIIT email</p>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setShowForgotPassword(true); setForgotPasswordStep('email'); setForgotPasswordError(''); }}
                    className="text-sm hero-heading-gradient font-medium hover:opacity-80 inline-block"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {isRegisterMode && (
                <div className="mt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptDPDP}
                      onChange={(e) => setAcceptDPDP(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      I accept the{' '}
                      <button type="button" onClick={(e) => { e.preventDefault(); setShowDPDPModal(true); }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        Terms & Privacy Policy
                      </button>
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isLoading || (isRegisterMode && !acceptDPDP)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Loading...' : (isRegisterMode ? <> <UserPlus size={18} /> Sign Up</> : <> <LogIn size={18} /> Login</>)}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); setSuccessMessage(''); setEmail(''); setPassword(''); setName(''); setAcceptDPDP(false); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-700/50 text-blue-600 dark:text-blue-400 py-3 rounded-xl font-semibold border-2 border-blue-500 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all"
                >
                  {isRegisterMode ? <LogIn size={18} /> : <UserPlus size={18} />} {isRegisterMode ? 'Login' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md relative border border-gray-200 dark:border-gray-700 shadow-2xl"
            style={{ boxShadow: '0 25px 60px rgba(15,23,42,0.2)' }}
          >
            {/* Close button */}
            <button
              onClick={handleCloseForgotPassword}
              className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold hero-heading-gradient">
                Reset Password
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors duration-300">
                {forgotPasswordStep === 'email' && 'Enter your email to receive OTP'}
                {forgotPasswordStep === 'otp' && 'Enter the OTP sent to your email'}
                {forgotPasswordStep === 'reset' && 'Enter your new password'}
              </p>
            </div>

            {/* Error Message */}
            {forgotPasswordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-300">
                <p className="text-red-600 dark:text-red-400 text-sm">{forgotPasswordError}</p>
              </div>
            )}

            {/* Step 1: Email */}
            {forgotPasswordStep === 'email' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your university email"
                    required
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseForgotPassword}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {forgotPasswordStep === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">
                    OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Enter the 6-digit OTP sent to {resetEmail}
                  </p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep('email');
                      setOtp('');
                      setForgotPasswordError('');
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || otp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {forgotPasswordStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep('otp');
                      setNewPassword('');
                      setConfirmPassword('');
                      setForgotPasswordError('');
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DPDP Act Terms & Privacy Policy Modal */}
      {showDPDPModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] relative flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl"
            style={{ boxShadow: '0 25px 60px rgba(15,23,42,0.2)' }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowDPDPModal(false)}
              className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="mb-6 pr-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-display text-2xl font-bold hero-heading-gradient">
                  DPDP Act Terms & Privacy Policy
                </h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
                Digital Personal Data Protection Act, 2023
              </p>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto pr-2 mb-6">
              <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    1. Introduction
                  </h3>
                  <p className="leading-relaxed">
                    This Privacy Policy applies to the use of the EduFoyer platform (the "Service"). Eduackhos Pvt Ltd ("we", "us", "our") collects, stores, and processes your personal data in accordance with the Digital Personal Data Protection Act, 2023.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    2. Data Collection and Processing
                  </h3>
                  <p className="leading-relaxed mb-2">
                    By signing up for EduFoyer, you consent to the collection, storage, and processing of your personal data, including but not limited to your:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>University affiliation</li>
                    <li>Academic information</li>
                    <li>Usage and activity data</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    This data is collected to provide educational services, facilitate doubt-solving sessions, manage your account, and improve the platform.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    3. Purpose of Data Processing
                  </h3>
                  <p className="leading-relaxed mb-2">
                    Your personal data will be processed for the following purposes:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Creating and managing your account</li>
                    <li>Providing educational services and doubt-solving sessions</li>
                    <li>Matching students with appropriate peer solvers</li>
                    <li>Processing payments and wallet transactions</li>
                    <li>Sending important updates and notifications</li>
                    <li>Enhancing user experience and improving our services</li>
                    <li>Complying with legal and regulatory obligations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    4. Data Sharing and Disclosure
                  </h3>
                  <p className="leading-relaxed mb-2">
                    We may share your personal data with:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Authorized peer solvers and educators for service delivery</li>
                    <li>Payment processors for transaction-related activities</li>
                    <li>Third-party service providers who support platform operations</li>
                    <li>Legal or regulatory authorities when required by law</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    We do not sell your personal data to any third party.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    5. Data Security
                  </h3>
                  <p className="leading-relaxed">
                    We implement appropriate technical and organizational measures to safeguard your personal data from unauthorized access, alteration, disclosure, or destruction. However, no method of data transmission over the internet is completely secure, and we cannot guarantee absolute security.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    6. Your Rights Under the DPDP Act
                  </h3>
                  <p className="leading-relaxed mb-2">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate or incomplete data</li>
                    <li>Request deletion of your personal data</li>
                    <li>Withdraw consent for data processing</li>
                    <li>File a complaint with the Data Protection Board of India</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    7. Data Retention
                  </h3>
                  <p className="leading-relaxed mb-2">
                    We retain your personal data for only as long as necessary to:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Fulfill the purposes outlined in this policy</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes</li>
                    <li>Enforce our terms and agreements</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    You may request deletion of your data at any time.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    8. Cookies and Tracking
                  </h3>
                  <p className="leading-relaxed mb-2">
                    We use cookies and similar technologies to:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Enhance platform functionality</li>
                    <li>Analyze usage behavior</li>
                    <li>Improve user experience</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    You may manage or disable cookies through your browser settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    9. Contact Information
                  </h3>
                  <p className="leading-relaxed mb-2">
                    For questions, concerns, or requests related to your personal data, please contact:
                  </p>
                  <p className="leading-relaxed mt-2">
                    <strong>Email:</strong> edufoyer2025@gmail.com<br />
                    <strong>Address:</strong> Jacobpura, Sector 52, Gurugram, Haryana, India
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    10. Acceptance of Policy
                  </h3>
                  <p className="leading-relaxed">
                    By checking the acceptance box or continuing to use the EduFoyer platform, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree, please refrain from using the Service.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowDPDPModal(false);
                  setAcceptDPDP(true);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
              >
                Accept & Continue
              </button>
              <button
                onClick={() => setShowDPDPModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginModal;
