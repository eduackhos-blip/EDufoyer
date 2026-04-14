import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { getSidebarDisplayAvatarSrc, getSidebarHandleLine } from './dashboardSidebarUtils';

export function DashboardSidebarSuggested() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
        Suggested
      </p>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-1 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-200 to-fuchsia-200 dark:from-violet-600 dark:to-fuchsia-600 flex items-center justify-center text-sm font-bold text-violet-800 dark:text-white">
              {i === 1 ? 'BC' : 'JW'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {i === 1 ? 'Peer solver' : 'Study partner'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {i === 1 ? '@peer_help' : '@study_circle'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/doubts?tab=available')}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Ask
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSidebarUserFooter({ user, onLogout, onHelpSupport }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    setMenuOpen(false);
    if (onLogout) await onLogout();
  };

  const help = () => {
    setMenuOpen(false);
    if (onHelpSupport) onHelpSupport();
    else navigate('/contact');
  };

  return (
    <div className="p-4 flex items-center gap-3 relative" ref={menuRef}>
      <img
        key={`sb-${user?.updatedAt}-${String(user?.avatarUrl || '').length}`}
        src={getSidebarDisplayAvatarSrc(user)}
        alt=""
        className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getSidebarHandleLine(user)}</p>
      </div>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Menu"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {menuOpen && (
        <div className="absolute bottom-14 right-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg py-1 z-50">
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
              setMenuOpen(false);
              navigate('/dashboard/profile/edit#password');
            }}
          >
            Change password
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={help}
          >
            Help &amp; support
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
