import {
  Home,
  BookOpen,
  LogOut,
  Bell,
  User,
  Users,
  Share2,
  Building2,
  UserPlus,
  Calendar,
} from 'lucide-react';

/**
 * Main dashboard nav (same order/labels/paths as Profile). `active` follows current route.
 */
export function buildDashboardSidebarItems({ user, pathname, search, onLogout }) {
  const userId = user?.id || user?._id || 'default_user';
  const activeHome = pathname === '/dashboard';
  const activeDoubts =
    pathname === '/dashboard/doubts' || pathname === '/dashboard/solved-doubts';
  const activeSocial =
    pathname === '/dashboard/social' || pathname.startsWith('/dashboard/social/');
  const activeCorp = pathname === '/dashboard/corporate-connect';
  const activeReferral = pathname === '/dashboard/referral-system';
  const activePyq = pathname === '/dashboard/pyq' || pathname.startsWith('/dashboard/pyq/');
  const activeNotif = pathname === '/dashboard/notifications';
  const activeProfile =
    pathname === '/dashboard/profile' || pathname.startsWith('/dashboard/profile/');
  const activeAdmin = pathname === '/admin/panel';

  const baseItems = [
    { icon: Home, label: 'Home', path: '/dashboard', active: activeHome },
    { icon: BookOpen, label: 'Doubts', path: '/dashboard/doubts', active: activeDoubts },
    {
      icon: Share2,
      label: 'Educational Social',
      path: `/dashboard/social/${userId}`,
      active: activeSocial,
    },
    {
      icon: Building2,
      label: 'Corporate Connect',
      path: '/dashboard/corporate-connect',
      active: activeCorp,
    },
    {
      icon: UserPlus,
      label: 'Online Referral System',
      path: '/dashboard/referral-system',
      active: activeReferral,
    },
    {
      icon: Calendar,
      label: 'Previous Year Live',
      path: '/dashboard/pyq',
      active: activePyq,
    },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', active: activeNotif },
    { icon: User, label: 'Profile', path: '/dashboard/profile', active: activeProfile },
    { icon: LogOut, label: 'Logout', onClick: onLogout },
  ];

  if (user?.role === 'admin') {
    baseItems.splice(-1, 0, {
      icon: Users,
      label: 'Admin Panel',
      path: '/admin/panel',
      active: activeAdmin,
    });
  }

  return baseItems;
}

export function getSidebarAvatarUrl(name) {
  const safe = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safe)}&background=e0e7ff&color=3730a3&size=256&bold=true`;
}

export function getSidebarDisplayAvatarSrc(u) {
  const raw = u?.avatarUrl ?? u?.avatar;
  if (raw && String(raw).trim()) return String(raw).trim();
  return getSidebarAvatarUrl(u?.name);
}

export function getSidebarHandleLine(user) {
  if (!user) return '@user';
  if (user.username) return `@${user.username}`;
  const em = user.email || '';
  const local = em.split('@')[0] || 'user';
  return `@${local.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20) || 'user'}`;
}
