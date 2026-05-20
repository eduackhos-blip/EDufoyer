import { Home, List, LogOut, Bell, User, Users } from 'lucide-react';
import MyDoubtsNavIcon from './icons/MyDoubtsNavIcon';

function getDoubtsTabFromSearch(search) {
  const raw = (search || '').replace(/^\?/, '');
  const tab = new URLSearchParams(raw).get('tab');
  if (tab === 'my-doubts' || tab === 'available' || tab === 'assigned') return tab;
  return 'available';
}

/**
 * Main dashboard nav. `active` follows current route + doubts tab query.
 */
export function buildDashboardSidebarItems({ user, pathname, search, onLogout }) {
  const activeHome = pathname === '/dashboard';
  const onDoubtsPage = pathname === '/dashboard/doubts';
  const doubtsTab = onDoubtsPage ? getDoubtsTabFromSearch(search) : null;
  const activeMyDoubts = doubtsTab === 'my-doubts';
  const activeAvailableDoubts =
    onDoubtsPage && (doubtsTab === 'available' || doubtsTab === 'assigned');
  const activeNotif = pathname === '/dashboard/notifications';
  const activeProfile =
    pathname === '/dashboard/profile' || pathname.startsWith('/dashboard/profile/');
  const activeAdmin = pathname === '/admin/panel';

  const baseItems = [
    { icon: Home, label: 'Home', path: '/dashboard', active: activeHome },
    {
      icon: MyDoubtsNavIcon,
      label: 'My doubts',
      path: '/dashboard/doubts?tab=my-doubts',
      active: activeMyDoubts,
    },
    {
      icon: List,
      label: 'Available doubts',
      path: '/dashboard/doubts?tab=available',
      active: activeAvailableDoubts,
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
