import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, Search } from 'lucide-react';
import authService from '../services/authService';
import { useRouter, useSearchParams } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import DashboardSplashTitle from './dashboard/DashboardSplashTitle';

const DEFAULT_PROFILE_COVER_URL = '/cover-photo-profile-page.jpg';

const inputClass =
  'w-full rounded-xl border border-[var(--dash-panel-border)] bg-white px-4 py-2.5 text-sm text-[var(--dash-text-body)] shadow-[var(--dash-inner-shadow)] outline-none focus:border-[var(--dash-forest)] focus:ring-2 focus:ring-[var(--dash-forest)]/15';

const inputSearchClass =
  'w-full rounded-full border border-[var(--dash-panel-border)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--dash-text-body)] shadow-[var(--dash-inner-shadow)] outline-none placeholder:text-[var(--dash-text-muted)] focus:border-[var(--dash-forest)] focus:ring-2 focus:ring-[var(--dash-forest)]/15';

const EditProfilePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = {
    search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safe)}&background=e3edd8&color=073E36&size=256&bold=true`;
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
      <DashboardPageLayout loadingMessage="Loading profile…">
        <div className="flex min-h-[16rem] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--dash-forest)]" />
          <span className="ml-3 text-[var(--dash-text-body)]">Loading…</span>
        </div>
      </DashboardPageLayout>
    );
  }

  const coverPreviewUrl =
    (editProfile.coverImageUrl && editProfile.coverImageUrl.trim()) || DEFAULT_PROFILE_COVER_URL;
  const coverSafe = String(coverPreviewUrl).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const editProfileHeader = (
    <header className="dash-page-header mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-5">
      <DashboardSplashTitle variant="page">Edit profile</DashboardSplashTitle>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push('/dashboard/profile')}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to profile
        </button>
        <div className="relative min-w-[10rem] max-w-xs flex-1 sm:min-w-[14rem] sm:flex-initial">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQ.trim()) {
                router.push(`/dashboard/doubts?tab=available`);
              }
            }}
            placeholder="Search doubt"
            className={inputSearchClass}
            aria-label="Search doubt"
          />
        </div>
        <DarkModeToggle />
      </div>
    </header>
  );

  return (
    <DashboardPageLayout loadingMessage="Loading profile…" contentVariant="card" topBar={editProfileHeader}>
      <div className="mx-auto max-w-2xl space-y-5">
        <article className="dash-panel-card p-6 md:p-8">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img
                src={
                  editProfile.avatarUrl?.trim()
                    ? editProfile.avatarUrl.trim()
                    : getAvatarUrl(editProfile.name || user?.name)
                }
                alt=""
                className="h-24 w-24 shrink-0 rounded-full border-2 border-[var(--dash-panel-border)] object-cover shadow-[var(--dash-inner-shadow)]"
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
                  className="rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
                >
                  Upload photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditProfile((p) => ({ ...p, avatarUrl: '' }));
                    setProfileFormError('');
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--dash-text-muted)] transition-colors hover:bg-[var(--dash-card-mint)]/50"
                >
                  Remove photo
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--dash-text-muted)]">
              JPG/PNG up to ~700 KB, or paste an https image URL. Images are saved on your account.
            </p>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--dash-forest)]">
                Profile photo URL (optional)
              </label>
              <input
                type="text"
                inputMode="url"
                value={editProfile.avatarUrl?.startsWith('data:') ? '' : editProfile.avatarUrl}
                onChange={(e) => setEditProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                placeholder="https://…"
                className={inputClass}
              />
            </div>

            <div className="border-t border-[var(--dash-panel-border)] pt-4">
              <p className="mb-2 text-sm font-semibold text-[var(--dash-forest)]">Cover image</p>
              <div
                className="mb-2 h-28 w-full rounded-xl border border-[var(--dash-panel-border)] bg-cover bg-center shadow-[var(--dash-inner-shadow)]"
                style={{ backgroundImage: `url('${coverSafe}')` }}
              />
              <div className="mb-2 flex flex-wrap gap-2">
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
                  className="rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
                >
                  Upload cover
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditProfile((p) => ({ ...p, coverImageUrl: '' }));
                    setProfileFormError('');
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--dash-text-muted)] transition-colors hover:bg-[var(--dash-card-mint)]/50"
                >
                  Reset to default
                </button>
              </div>
              <label className="mb-1 block text-xs font-medium text-[var(--dash-text-muted)]">
                Cover image URL (optional)
              </label>
              <input
                type="text"
                inputMode="url"
                value={editProfile.coverImageUrl?.startsWith('data:') ? '' : editProfile.coverImageUrl}
                onChange={(e) => setEditProfile((p) => ({ ...p, coverImageUrl: e.target.value }))}
                placeholder="https://…"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--dash-forest)]">Name</label>
              <input
                type="text"
                value={editProfile.name}
                onChange={(e) => setEditProfile((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
                minLength={2}
                maxLength={50}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--dash-forest)]">Username</label>
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
                className={inputClass}
                maxLength={30}
              />
              <p className="mt-1 text-xs text-[var(--dash-text-muted)]">
                3–30 characters: lowercase letters, numbers, underscore. Leave empty to clear.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--dash-forest)]">Email</label>
              <input
                type="email"
                value={editProfile.email}
                onChange={(e) => setEditProfile((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--dash-forest)]">Bio</label>
              <textarea
                value={editProfile.bio}
                onChange={(e) => setEditProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                maxLength={280}
                placeholder="Short line under your name"
                className={`${inputClass} min-h-[4rem] resize-y`}
              />
            </div>

            {profileFormError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{profileFormError}</div>
            ) : null}
            {profileFormSuccess ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {profileFormSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#073E36] py-3 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save profile
            </button>
          </form>
        </article>

        <article id="change-password-section" className="dash-panel-card scroll-mt-6 p-6 md:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--dash-forest)]">
            <Lock className="h-5 w-5 shrink-0" aria-hidden />
            Change password
          </h2>
          {passwordError ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{passwordError}</div>
          ) : null}
          {passwordSuccess ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {passwordSuccess}
            </div>
          ) : null}
          <form onSubmit={handleChangePassword} className="space-y-4">
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field, idx) => {
              const labels = ['Current Password', 'New Password', 'Confirm New Password'];
              const keys = ['current', 'new', 'confirm'];
              const k = keys[idx];
              return (
                <div key={field}>
                  <label className="mb-2 block text-sm font-semibold text-[var(--dash-forest)]">{labels[idx]}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[k] ? 'text' : 'password'}
                      value={passwordForm[field]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                      className={`${inputClass} pr-10 py-3`}
                      required
                      minLength={field === 'currentPassword' ? undefined : 6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, [k]: !showPasswords[k] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dash-text-muted)] hover:text-[var(--dash-forest)]"
                      aria-label={showPasswords[k] ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords[k] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push('/dashboard/profile')}
                className="flex-1 rounded-xl border border-[var(--dash-panel-border)] bg-white py-2.5 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#073E36] py-2.5 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update password
              </button>
            </div>
          </form>
        </article>
      </div>
    </DashboardPageLayout>
  );
};

export default EditProfilePage;
