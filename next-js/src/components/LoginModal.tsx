import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import authService from '../services/authService';
import EmailVerification from './EmailVerification';
import EduMarketingHeader from './EduMarketingHeader';

const SIGNUP_INPUT_CLASS =
  'w-full rounded-full border-[1.5px] border-[#073E36]/20 bg-white px-3.5 py-2.5 text-[13px] text-[#111827] shadow-[inset_0_1px_4px_rgba(7,62,54,0.06)] outline-none transition-[border-color,box-shadow] placeholder:text-[#9ca8a4] focus:border-[#073E36]/45 focus:shadow-[inset_0_1px_4px_rgba(7,62,54,0.08),0_0_0_3px_rgba(7,62,54,0.12)]';

function SignupLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block">
      <span className="relative inline-block pt-[8px] text-[13px] font-semibold text-[#1a2e2c]">
        <img
          src="/aboveMarks.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-[-17px] top-0 h-[20px] w-[27px] object-contain"
          decoding="async"
        />
        {children}
      </span>
    </label>
  );
}

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
  const router = useRouter();
  
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
      router.push(isCacheVerified ? '/dashboard' : '/verify-cache');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await authService.login(email, password);
      if (result.success) {
        localStorage.removeItem('cacheVerified');
        router.push('/verify-cache');
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
          router.push('/verify-cache');
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
    router.push('/verify-cache');
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white transition-colors duration-300">
      <div className="edu-hero-bg-grid" aria-hidden />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <EduMarketingHeader variant="fixed" />
        <main className="relative z-20 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-3 pb-4 pt-32 md:pt-36">
        {(
          <div className="relative mx-auto min-h-0 w-full max-w-[min(92vw,56rem)] max-h-[min(92dvh,860px)] overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(7,62,54,0.08),0_28px_72px_rgba(7,62,54,0.1),0_52px_120px_rgba(7,62,54,0.12),0_80px_160px_rgba(7,62,54,0.1)] md:max-h-[min(88dvh,820px)]">
            <div
              className="flex min-h-0 w-[200%] transition-[transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none will-change-transform"
              style={{ transform: isRegisterMode ? 'translateX(0)' : 'translateX(-50%)' }}
            >
              <div
                className="flex min-h-0 w-1/2 max-h-[min(92dvh,860px)] shrink-0 grow-0 flex-col overflow-hidden md:max-h-[min(88dvh,820px)] md:flex-row"
                inert={!isRegisterMode ? true : undefined}
              >
              <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-tl-[28px] rounded-bl-[28px] rounded-br-[40px] rounded-tr-[32px] bg-[#E6EDD7] px-5 pb-14 pt-11 dark:bg-[#E6EDD7] md:-mr-4 md:px-8 md:pb-16 md:pt-10 md:shadow-[4px_0_24px_rgba(7,62,54,0.08)]">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="absolute right-3 top-3 z-30 rounded-full p-1.5 text-[#073E36]/70 transition-colors hover:bg-white/90 hover:text-[#073E36] md:right-5 md:top-5"
                  aria-label="Close and go to home"
                >
                  <X size={22} strokeWidth={2.25} />
                </button>
                <span
                  className="pointer-events-none absolute left-4 top-14 text-base text-[#073E36]/40 md:left-[0.9rem] md:top-[0.6rem] md:text-[#073E36] md:-rotate-[22deg]"
                  aria-hidden
                >
                  ✦
                </span>
                <div
                  className="pointer-events-none absolute bottom-4 right-4 z-0 h-14 w-14 md:bottom-6 md:right-7"
                  aria-hidden
                >
                  <span className="absolute bottom-0 right-0 block origin-center text-[1.65rem] leading-none text-[#073E36] -rotate-[12deg]">
                    ✦
                  </span>
                  <span className="absolute bottom-[1.4rem] -right-0.5 block origin-center text-[0.68rem] leading-none text-[#073E36] rotate-[20deg] md:bottom-[1.55rem] md:-right-1">
                    ✦
                  </span>
                </div>

                {successMessage && (
                  <div className="mb-2 rounded-lg border border-[#073E36]/30 bg-white/95 p-2.5 shadow-sm">
                    <p className="text-sm font-medium text-[#073E36]">{successMessage}</p>
                  </div>
                )}
                {error && (
                  <div className="mb-2 rounded-lg border border-[#EF4444]/35 bg-white/95 p-2.5 shadow-sm">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}

                <div
                  className="relative mb-3 flex shrink-0 flex-col justify-center overflow-visible rounded-2xl border border-white/90 px-3 py-2 md:mb-4 md:px-3 md:py-2"
                  style={{
                    width: '18rem',
                    height: '4.5rem',
                    background: '#F8FFEC',
                    boxShadow:
                      '0 1px 2px rgba(0, 0, 0, 0.04), 1px 4px 14px rgba(0, 0, 0, 0.06), 2px 10px 28px rgba(0, 0, 0, 0.07), 3px 16px 40px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <span
                    className="pointer-events-none absolute right-2 top-2 text-sm leading-none text-[#073E36] md:right-[0.3rem] md:top-0 md:text-[0.7rem] md:leading-[1.5rem] md:rotate-45"
                    aria-hidden
                  >
                    ✦
                  </span>
                  <h1
                    className="font-display relative z-0 pr-7 text-lg font-bold leading-tight text-[#073E36] md:pr-8 md:text-[1.8rem] md:leading-[1.75rem]"
                    style={{
                      textShadow:
                        '0 1px 0 rgba(255,255,255,0.32), 0 2px 8px rgba(7, 62, 54, 0.32), 0 4px 16px rgba(7, 62, 54, 0.26), 0 8px 32px rgba(7, 62, 54, 0.2)',
                    }}
                  >
                    Create account
                  </h1>
                  <p
                    className="relative z-0 mt-0.5 pr-7 text-[11px] leading-snug text-[#1a2e2c] md:pr-8 md:text-xs"
                    style={{
                      textShadow:
                        '0 1px 0 rgba(255,255,255,0.28), 0 2px 6px rgba(7, 62, 54, 0.22), 0 4px 14px rgba(7, 62, 54, 0.18)',
                    }}
                  >
                    Create your new account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 flex min-h-0 flex-1 flex-col space-y-2.5 md:space-y-3">
                  <div>
                    <SignupLabel htmlFor="signup-name">Full name</SignupLabel>
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={SIGNUP_INPUT_CLASS}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <SignupLabel htmlFor="signup-email">Mail ID (only university id)</SignupLabel>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={SIGNUP_INPUT_CLASS}
                      placeholder="email"
                      required
                    />
                    <p className="mt-1 pl-1 text-[11px] leading-snug text-[#9ca8a4] md:text-xs">
                      Please use your official university email address to register
                    </p>
                  </div>

                  <div>
                    <SignupLabel htmlFor="signup-password">Password</SignupLabel>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${SIGNUP_INPUT_CLASS} pr-12`}
                        placeholder="Enter your password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca8a4] transition-colors hover:text-[#073E36]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-0">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={acceptDPDP}
                        onChange={(e) => setAcceptDPDP(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#073E36]/40 text-[#073E36] accent-[#073E36] focus:ring-[#073E36]/30"
                        required
                      />
                      <span className="text-xs leading-snug text-[#1a2e2c] md:text-sm">
                        I accept the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowDPDPModal(true);
                          }}
                          className="font-bold text-[#073E36] underline-offset-2 hover:underline"
                        >
                          Terms & Privacy Policy
                        </button>
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-row gap-2 pt-1 md:gap-3">
                    <button
                      type="submit"
                      disabled={isLoading || !acceptDPDP}
                      className="min-w-0 flex-1 rounded-full bg-[#073E36] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(7,62,54,0.25)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 md:py-3 md:text-sm"
                    >
                      {isLoading ? 'Loading...' : 'Sign up'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(false);
                        setError('');
                        setSuccessMessage('');
                        setEmail('');
                        setPassword('');
                        setName('');
                        setAcceptDPDP(false);
                      }}
                      className="min-w-0 flex-1 rounded-full bg-[#1a2e2c] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(26,46,44,0.22)] transition-opacity hover:opacity-95 md:py-3 md:text-sm"
                    >
                      Log in
                    </button>
                  </div>
                </form>
              </div>

              <div className="relative z-0 hidden min-h-0 w-full md:-ml-8 md:flex md:min-h-0 md:w-[44%] md:min-w-0 md:flex-shrink-0 md:flex-col md:self-stretch md:overflow-hidden md:rounded-r-[28px] md:bg-[#E6EDD7]">
                <div className="relative flex min-h-0 w-full flex-1 flex-col items-stretch justify-center overflow-hidden md:min-h-0 md:rounded-xl">
                  <div className="relative h-[99%] w-full min-h-0 shrink-0 overflow-hidden md:rounded-xl">
                    <img
                      src="/centralimage.jpg"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      decoding="async"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-black/[0.14]"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
              </div>
              <div
                className="flex min-h-0 w-1/2 max-h-[min(92dvh,860px)] shrink-0 grow-0 flex-col overflow-hidden md:max-h-[min(88dvh,820px)] md:flex-row"
                inert={isRegisterMode ? true : undefined}
              >
              <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-tl-[28px] rounded-bl-[28px] rounded-br-[40px] rounded-tr-[32px] bg-[#E6EDD7] px-5 pb-14 pt-11 dark:bg-[#E6EDD7] md:-mr-4 md:px-8 md:pb-16 md:pt-10 md:shadow-[4px_0_24px_rgba(7,62,54,0.08)]">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="absolute right-3 top-3 z-30 rounded-full p-1.5 text-[#073E36]/70 transition-colors hover:bg-white/90 hover:text-[#073E36] md:right-5 md:top-5"
                  aria-label="Close and go to home"
                >
                  <X size={22} strokeWidth={2.25} />
                </button>
                <span
                  className="pointer-events-none absolute left-4 top-14 text-base text-[#073E36]/40 md:left-[0.9rem] md:top-[0.6rem] md:text-[#073E36] md:-rotate-[22deg]"
                  aria-hidden
                >
                  ✦
                </span>
                <div
                  className="pointer-events-none absolute bottom-4 right-4 z-0 h-14 w-14 md:bottom-6 md:right-7"
                  aria-hidden
                >
                  <span className="absolute bottom-0 right-0 block origin-center text-[1.65rem] leading-none text-[#073E36] -rotate-[12deg]">
                    ✦
                  </span>
                  <span className="absolute bottom-[1.4rem] -right-0.5 block origin-center text-[0.68rem] leading-none text-[#073E36] rotate-[20deg] md:bottom-[1.55rem] md:-right-1">
                    ✦
                  </span>
                </div>

                {successMessage && (
                  <div className="mb-2 rounded-lg border border-[#073E36]/30 bg-white/95 p-2.5 shadow-sm">
                    <p className="text-sm font-medium text-[#073E36]">{successMessage}</p>
                  </div>
                )}
                {error && (
                  <div className="mb-2 rounded-lg border border-[#EF4444]/35 bg-white/95 p-2.5 shadow-sm">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}

                <div
                  className="relative mb-3 flex shrink-0 flex-col justify-center overflow-visible rounded-2xl border border-white/90 px-3 py-2 md:mb-4 md:px-3 md:py-2"
                  style={{
                    width: '18rem',
                    height: '4.5rem',
                    background: '#F8FFEC',
                    boxShadow:
                      '0 1px 2px rgba(0, 0, 0, 0.04), 1px 4px 14px rgba(0, 0, 0, 0.06), 2px 10px 28px rgba(0, 0, 0, 0.07), 3px 16px 40px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <span
                    className="pointer-events-none absolute right-2 top-2 text-sm leading-none text-[#073E36] md:right-[0.3rem] md:top-0 md:text-[0.7rem] md:leading-[1.5rem] md:rotate-45"
                    aria-hidden
                  >
                    ✦
                  </span>
                  <h1
                    className="font-display relative z-0 pr-7 text-lg font-bold leading-tight text-[#073E36] md:pr-8 md:text-[1.8rem] md:leading-[1.75rem]"
                    style={{
                      textShadow:
                        '0 1px 0 rgba(255,255,255,0.32), 0 2px 8px rgba(7, 62, 54, 0.32), 0 4px 16px rgba(7, 62, 54, 0.26), 0 8px 32px rgba(7, 62, 54, 0.2)',
                    }}
                  >
                    Get started !
                  </h1>
                  <p
                    className="relative z-0 mt-0.5 pr-7 text-[11px] leading-snug text-[#1a2e2c] md:pr-8 md:text-xs"
                    style={{
                      textShadow:
                        '0 1px 0 rgba(255,255,255,0.28), 0 2px 6px rgba(7, 62, 54, 0.22), 0 4px 14px rgba(7, 62, 54, 0.18)',
                    }}
                  >
                    Sign in to your account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 flex min-h-0 flex-1 flex-col space-y-2.5 md:space-y-3">
                  <div>
                    <SignupLabel htmlFor="login-email">Mail ID (only university id)</SignupLabel>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={SIGNUP_INPUT_CLASS}
                      placeholder="email"
                      required
                    />
                    <p className="mt-1 pl-1 text-[11px] leading-snug text-[#9ca8a4] md:text-xs">
                      Please use your official university email address to register
                    </p>
                  </div>

                  <div>
                    <SignupLabel htmlFor="login-password">Password</SignupLabel>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${SIGNUP_INPUT_CLASS} pr-12`}
                        placeholder="Enter your password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca8a4] transition-colors hover:text-[#073E36]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="mt-1 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setShowForgotPassword(true);
                          setForgotPasswordStep('email');
                          setForgotPasswordError('');
                        }}
                        className="text-xs font-semibold text-[#073E36] underline-offset-2 hover:underline md:text-sm"
                      >
                        Forgot password ?
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 pt-1 md:gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="min-w-0 flex-1 rounded-full bg-[#073E36] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(7,62,54,0.25)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 md:py-3 md:text-sm"
                    >
                      {isLoading ? 'Loading...' : 'Log in'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        setError('');
                        setSuccessMessage('');
                        setEmail('');
                        setPassword('');
                        setName('');
                        setAcceptDPDP(false);
                      }}
                      className="min-w-0 flex-1 rounded-full bg-[#1a2e2c] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(26,46,44,0.22)] transition-opacity hover:opacity-95 md:py-3 md:text-sm"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </div>

              <div className="relative z-0 hidden min-h-0 w-full md:-ml-8 md:flex md:min-h-0 md:w-[44%] md:min-w-0 md:flex-shrink-0 md:flex-col md:self-stretch md:overflow-hidden md:rounded-r-[28px] md:bg-[#E6EDD7]">
                <div className="relative flex min-h-0 w-full flex-1 flex-col items-stretch justify-center overflow-hidden md:min-h-0 md:rounded-xl">
                  <div className="relative h-[99%] w-full min-h-0 shrink-0 overflow-hidden md:rounded-xl">
                    <img
                      src="/centralimage.jpg"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      decoding="async"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-black/[0.14]"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[#073E36]/18 bg-[#E6EDD7] p-6 pb-7 pt-9 shadow-[0_12px_40px_rgba(7,62,54,0.1),0_28px_72px_rgba(7,62,54,0.14),0_52px_100px_rgba(7,62,54,0.1)]">
            <button
              type="button"
              onClick={handleCloseForgotPassword}
              className="absolute right-3 top-3 rounded-full p-1.5 text-[#073E36]/70 transition-colors hover:bg-white/90 hover:text-[#073E36]"
              aria-label="Close"
            >
              <X size={22} strokeWidth={2.25} />
            </button>

            <div className="mb-5 pr-10">
              <h2
                className="font-display text-2xl font-bold leading-tight text-[#073E36] md:text-[1.65rem]"
                style={{
                  textShadow:
                    '0 1px 0 rgba(255,255,255,0.32), 0 2px 8px rgba(7, 62, 54, 0.22), 0 4px 14px rgba(7, 62, 54, 0.14)',
                }}
              >
                Reset Password
              </h2>
              <p className="mt-1.5 text-sm leading-snug text-[#1a2e2c]/90">
                {forgotPasswordStep === 'email' && 'Enter your email to receive OTP'}
                {forgotPasswordStep === 'otp' && 'Enter the OTP sent to your email'}
                {forgotPasswordStep === 'reset' && 'Enter your new password'}
              </p>
            </div>

            {forgotPasswordError && (
              <div className="mb-4 rounded-lg border border-[#EF4444]/35 bg-white/95 p-3 shadow-sm">
                <p className="text-sm text-[#EF4444]">{forgotPasswordError}</p>
              </div>
            )}

            {/* Step 1: Email */}
            {forgotPasswordStep === 'email' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-reset-email"
                    className="mb-1 block text-[13px] font-semibold text-[#1a2e2c]"
                  >
                    Email
                  </label>
                  <input
                    id="forgot-reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={SIGNUP_INPUT_CLASS}
                    placeholder="Enter your university email"
                    required
                  />
                </div>
                <div className="flex flex-row gap-2 pt-2 md:gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForgotPassword}
                    className="min-w-0 flex-1 rounded-full bg-[#1a2e2c] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(26,46,44,0.22)] transition-opacity hover:opacity-95 md:py-3 md:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="min-w-0 flex-1 rounded-full bg-[#073E36] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(7,62,54,0.25)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 md:py-3 md:text-sm"
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
                  <label htmlFor="forgot-otp" className="mb-1 block text-[13px] font-semibold text-[#1a2e2c]">
                    OTP
                  </label>
                  <input
                    id="forgot-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`${SIGNUP_INPUT_CLASS} text-center text-xl tracking-[0.35em] md:text-2xl`}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="mt-2 text-center text-[11px] leading-snug text-[#073E36]/75 md:text-xs">
                    Enter the 6-digit OTP sent to {resetEmail}
                  </p>
                </div>
                <div className="flex flex-row gap-2 pt-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep('email');
                      setOtp('');
                      setForgotPasswordError('');
                    }}
                    className="min-w-0 flex-1 rounded-full bg-[#1a2e2c] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(26,46,44,0.22)] transition-opacity hover:opacity-95 md:py-3 md:text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || otp.length !== 6}
                    className="min-w-0 flex-1 rounded-full bg-[#073E36] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(7,62,54,0.25)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 md:py-3 md:text-sm"
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
                  <label htmlFor="forgot-new-password" className="mb-1 block text-[13px] font-semibold text-[#1a2e2c]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${SIGNUP_INPUT_CLASS} pr-12`}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca8a4] transition-colors hover:text-[#073E36]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="forgot-confirm-password" className="mb-1 block text-[13px] font-semibold text-[#1a2e2c]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${SIGNUP_INPUT_CLASS} pr-12`}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca8a4] transition-colors hover:text-[#073E36]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-row gap-2 pt-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep('otp');
                      setNewPassword('');
                      setConfirmPassword('');
                      setForgotPasswordError('');
                    }}
                    className="min-w-0 flex-1 rounded-full bg-[#1a2e2c] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(26,46,44,0.22)] transition-opacity hover:opacity-95 md:py-3 md:text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="min-w-0 flex-1 rounded-full bg-[#073E36] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(7,62,54,0.25)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 md:py-3 md:text-sm"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-[24px] border border-[#073E36]/18 bg-[#E6EDD7] p-6 pb-7 pt-9 shadow-[0_12px_40px_rgba(7,62,54,0.1),0_28px_72px_rgba(7,62,54,0.14),0_52px_100px_rgba(7,62,54,0.1)]"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowDPDPModal(false)}
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-[#073E36]/70 transition-colors hover:bg-white/90 hover:text-[#073E36]"
              aria-label="Close"
            >
              <X size={22} strokeWidth={2.2} />
            </button>

            {/* Header */}
            <div className="mb-5 pr-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl border border-[#073E36]/20 bg-white/90 p-2.5 shadow-[0_4px_14px_rgba(7,62,54,0.12)]">
                  <FileText className="h-5 w-5 text-[#073E36]" strokeWidth={2.2} />
                </div>
                <h2
                  className="font-display text-2xl font-bold leading-tight text-[#073E36] md:text-[1.65rem]"
                  style={{
                    textShadow:
                      '0 1px 0 rgba(255,255,255,0.35), 0 2px 8px rgba(7, 62, 54, 0.18), 0 4px 14px rgba(7, 62, 54, 0.12)',
                  }}
                >
                  DPDP Act Terms & Privacy Policy
                </h2>
              </div>
              <p
                className="text-sm font-medium text-[#1a2e2c]/90"
                style={{ textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}
              >
                Digital Personal Data Protection Act, 2023
              </p>
            </div>

            {/* Content - Scrollable */}
            <div className="mb-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:rgba(7,62,54,0.35)_transparent]">
              <div className="space-y-5 rounded-xl border border-[#073E36]/12 bg-white/85 p-4 text-sm text-[#1a2e2c] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] md:p-5">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">1. Introduction</h3>
                  <p className="leading-relaxed">
                    This Privacy Policy applies to the use of the EduFoyer platform (the "Service"). Eduackhos Pvt Ltd ("we", "us", "our") collects, stores, and processes your personal data in accordance with the Digital Personal Data Protection Act, 2023.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">2. Data Collection and Processing</h3>
                  <p className="mb-2 leading-relaxed">
                    By signing up for EduFoyer, you consent to the collection, storage, and processing of your personal data, including but not limited to your:
                  </p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 marker:text-[#073E36]">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>University affiliation</li>
                    <li>Academic information</li>
                    <li>Usage and activity data</li>
                  </ul>
                  <p className="mt-2 leading-relaxed">
                    This data is collected to provide educational services, facilitate doubt-solving sessions, manage your account, and improve the platform.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">3. Purpose of Data Processing</h3>
                  <p className="mb-2 leading-relaxed">Your personal data will be processed for the following purposes:</p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 marker:text-[#073E36]">
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
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">4. Data Sharing and Disclosure</h3>
                  <p className="mb-2 leading-relaxed">We may share your personal data with:</p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 marker:text-[#073E36]">
                    <li>Authorized peer solvers and educators for service delivery</li>
                    <li>Payment processors for transaction-related activities</li>
                    <li>Third-party service providers who support platform operations</li>
                    <li>Legal or regulatory authorities when required by law</li>
                  </ul>
                  <p className="mt-2 leading-relaxed">We do not sell your personal data to any third party.</p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">5. Data Security</h3>
                  <p className="leading-relaxed">
                    We implement appropriate technical and organizational measures to safeguard your personal data from unauthorized access, alteration, disclosure, or destruction. However, no method of data transmission over the internet is completely secure, and we cannot guarantee absolute security.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">6. Your Rights Under the DPDP Act</h3>
                  <p className="mb-2 leading-relaxed">You have the right to:</p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 marker:text-[#073E36]">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate or incomplete data</li>
                    <li>Request deletion of your personal data</li>
                    <li>Withdraw consent for data processing</li>
                    <li>File a complaint with the Data Protection Board of India</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">7. Data Retention</h3>
                  <p className="mb-2 leading-relaxed">We retain your personal data for only as long as necessary to:</p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 marker:text-[#073E36]">
                    <li>Fulfill the purposes outlined in this policy</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes</li>
                    <li>Enforce our terms and agreements</li>
                  </ul>
                  <p className="mt-2 leading-relaxed">You may request deletion of your data at any time.</p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">8. Cookies and Tracking</h3>
                  <p className="mb-2 leading-relaxed">We use cookies and similar technologies to:</p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 marker:text-[#073E36]">
                    <li>Enhance platform functionality</li>
                    <li>Analyze usage behavior</li>
                    <li>Improve user experience</li>
                  </ul>
                  <p className="mt-2 leading-relaxed">You may manage or disable cookies through your browser settings.</p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">9. Contact Information</h3>
                  <p className="mb-2 leading-relaxed">
                    For questions, concerns, or requests related to your personal data, please contact:
                  </p>
                  <p className="mt-2 leading-relaxed">
                    <strong className="font-semibold text-[#073E36]">Email:</strong> edufoyer2025@gmail.com<br />
                    <strong className="font-semibold text-[#073E36]">Address:</strong> Jacobpura, Sector 52, Gurugram, Haryana, India
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-[#073E36]">10. Acceptance of Policy</h3>
                  <p className="leading-relaxed">
                    By checking the acceptance box or continuing to use the EduFoyer platform, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree, please refrain from using the Service.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 border-t border-[#073E36]/20 pt-4 md:gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowDPDPModal(false);
                  setAcceptDPDP(true);
                }}
                className="min-w-0 flex-1 rounded-full bg-[#073E36] py-3 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(7,62,54,0.25)] transition-opacity hover:opacity-95 md:text-sm"
              >
                Accept & Continue
              </button>
              <button
                type="button"
                onClick={() => setShowDPDPModal(false)}
                className="min-w-0 flex-1 rounded-full border border-[#073E36]/28 bg-white/95 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#073E36] shadow-[0_4px_12px_rgba(7,62,54,0.1)] transition-opacity hover:bg-white hover:opacity-95 md:text-sm"
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
