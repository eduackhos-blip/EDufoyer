import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, Search } from 'lucide-react';
import authService from '../services/authService';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';
import DashboardPageLayout from './dashboard/DashboardPageLayout';

const DEFAULT_PROFILE_COVER_URL = '/cover-photo-profile-page.jpg';

const EditProfilePage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, search: searchParams.toString() ? `?${searchParams.toString()}` : '', hash: typeof window !== 'undefined' ? window.location.hash : '' };
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  const [editProfile, setEditProfile] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    avatarUrl: '',
    coverImageUrl: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormError, setProfileFormError] = useState('');
  const [profileFormSuccess, setProfileFormSuccess] = useState('');
  const avatarFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!authService.isAuthenticated()) {
        router.push('/');
        return;
      }
      if (localStorage.getItem('cacheVerified') !== 'true') {
        router.push('/verify-cache');
        return;
      }
      try {
        setIsLoading(true);
        const userData = await authService.getProfile();
        setUser(userData);
        setEditProfile({
          name: userData?.name || '',
          username: userData?.username || '',
          email: userData?.email || '',
          bio: userData?.bio || '',
          avatarUrl: userData?.avatarUrl || userData?.avatar || '',
          coverImageUrl: userData?.coverImageUrl || '',
        });
      } catch (e) {
        console.error(e);
        authService.logout();
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  useEffect(() => {
    if (location.hash !== '#password' || isLoading || !user) return;
    const id = window.setTimeout(() => {
      document.getElementById('change-password-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(id);
  }, [location.hash, isLoading, user]);

  const getAvatarUrl = (name) => {
    const safe = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safe)}&background=e0e7ff&color=3730a3&size=256&bold=true`;
  };

  const displayAvatarSrc = (u) => {
    const raw = u?.avatarUrl ?? u?.avatar;
    if (raw && String(raw).trim()) return String(raw).trim();
    return getAvatarUrl(u?.name);
  };

  const onAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileFormError('Please choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      setProfileFormError('');
      setEditProfile((prev) => ({ ...prev, avatarUrl: result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileFormError('Please choose an image file for the cover');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      setProfileFormError('');
      setEditProfile((prev) => ({ ...prev, coverImageUrl: result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileFormError('');
    setProfileFormSuccess('');
    const uname = editProfile.username.trim().replace(/^@/, '').toLowerCase();
    if (uname && !/^[a-z0-9_]{3,30}$/.test(uname)) {
      setProfileFormError('Username: 3–30 characters, letters, numbers, underscore only');
      return;
    }
    try {
      setIsSavingProfile(true);
      const avatarRaw = editProfile.avatarUrl;
      const coverRaw = editProfile.coverImageUrl;
      const payload = {
        name: editProfile.name.trim(),
        email: editProfile.email.trim(),
        username: uname || '',
        bio: editProfile.bio.trim(),
        avatarUrl: typeof avatarRaw === 'string' ? avatarRaw.trim() : '',
        coverImageUrl: typeof coverRaw === 'string' ? coverRaw.trim() : '',
      };
      await authService.updateProfile(payload);
      const fresh = await authService.getProfile();
      setUser(fresh);
      setEditProfile((prev) => ({
        ...prev,
        name: fresh?.name || prev.name,
        username: fresh?.username || '',
        email: fresh?.email || prev.email,
        bio: fresh?.bio || '',
        avatarUrl: fresh?.avatarUrl || fresh?.avatar || '',
        coverImageUrl: fresh?.coverImageUrl || '',
      }));
      try {
        const forStorage = { ...fresh };
        try {
          localStorage.setItem('user', JSON.stringify(forStorage));
        } catch {
          const lean = { ...forStorage };
          delete lean.avatarUrl;
          delete lean.coverImageUrl;
          try {
            localStorage.setItem('user', JSON.stringify(lean));
          } catch {
            /* ignore */
          }
        }
      } catch (_) {
        /* ignore */
      }
      setProfileFormSuccess('Profile saved');
      setTimeout(() => setProfileFormSuccess(''), 2500);
    } catch (err) {
      setProfileFormError(err.message || 'Could not save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch {
      router.push('/');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    try {
      setIsChangingPassword(true);
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading…</span>
      </div>
    );
  }

  return (
    <DashboardPageLayout loadingMessage="Loading profile…">
      <div className="flex min-h-full flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
        <header className="shrink-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3 max-w-6xl mx-auto">
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQ.trim()) {
                    router.push(`/dashboard/doubts?tab=available`);
                  }
                }}
                placeholder="Search Doubt"
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <DarkModeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/profile')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Back to profile
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Edit profile
              </h1>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <img
                    src={
                      editProfile.avatarUrl?.trim()
                        ? editProfile.avatarUrl.trim()
                        : getAvatarUrl(editProfile.name || user?.name)
                    }
                    alt=""
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shrink-0"
                  />
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onAvatarFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Upload photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditProfile((p) => ({ ...p, avatarUrl: '' }));
                        setProfileFormError('');
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG/PNG up to ~700 KB, or paste an https image URL. Images are saved on your account.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile photo URL (optional)
                  </label>
                  <input
                    type="text"
                    inputMode="url"
                    value={editProfile.avatarUrl?.startsWith('data:') ? '' : editProfile.avatarUrl}
                    onChange={(e) => setEditProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                    placeholder="https://…"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Cover image</p>
                  <div
                    className="h-28 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-cover bg-center mb-2"
                    style={{
                      backgroundImage: `url(${JSON.stringify(
                        (editProfile.coverImageUrl && editProfile.coverImageUrl.trim()) ||
                          DEFAULT_PROFILE_COVER_URL
                      )})`,
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mb-2">
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onCoverFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Upload cover
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditProfile((p) => ({ ...p, coverImageUrl: '' }));
                        setProfileFormError('');
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      Reset to default
                    </button>
                  </div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Cover image URL (optional)
                  </label>
                  <input
                    type="text"
                    inputMode="url"
                    value={editProfile.coverImageUrl?.startsWith('data:') ? '' : editProfile.coverImageUrl}
                    onChange={(e) => setEditProfile((p) => ({ ...p, coverImageUrl: e.target.value }))}
                    placeholder="https://…"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editProfile.name}
                    onChange={(e) => setEditProfile((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    minLength={2}
                    maxLength={50}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editProfile.username}
                    onChange={(e) =>
                      setEditProfile((p) => ({
                        ...p,
                        username: e.target.value.replace(/^@+/, '').toLowerCase(),
                      }))
                    }
                    placeholder="your_handle"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    3–30 characters: lowercase letters, numbers, underscore. Leave empty to clear.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editProfile.email}
                    onChange={(e) => setEditProfile((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea
                    value={editProfile.bio}
                    onChange={(e) => setEditProfile((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    maxLength={280}
                    placeholder="Short line under your name"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-y min-h-[4rem]"
                  />
                </div>

                {profileFormError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {profileFormError}
                  </div>
                )}
                {profileFormSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                    {profileFormSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save profile
                </button>
              </form>

              <div className="my-8 border-t border-gray-200 dark:border-gray-600" />

              <h2
                id="change-password-section"
                className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 scroll-mt-24"
              >
                <Lock className="w-4 h-4" />
                Change password
              </h2>
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                  {passwordSuccess}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                {['currentPassword', 'newPassword', 'confirmPassword'].map((field, idx) => {
                  const labels = ['Current Password', 'New Password', 'Confirm New Password'];
                  const keys = ['current', 'new', 'confirm'];
                  const k = keys[idx];
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {labels[idx]}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords[k] ? 'text' : 'password'}
                          value={passwordForm[field]}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, [field]: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pr-10 text-gray-900 dark:text-white"
                          required
                          minLength={field === 'currentPassword' ? undefined : 6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, [k]: !showPasswords[k] })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPasswords[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/profile')}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Back to profile
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-2 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Update password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default EditProfilePage;
