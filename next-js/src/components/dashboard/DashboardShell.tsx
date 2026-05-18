'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

export type DashboardSidebarItem = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  path?: string;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
};

type DashboardShellProps = {
  sidebarItems: DashboardSidebarItem[];
  children: React.ReactNode;
  /** Row aligned with the sidebar menu toggle (e.g. welcome + CTAs). */
  topBar?: React.ReactNode;
  /** `card` = mint rounded panel (home dashboard). `plain` = full scroll area for legacy page layouts. */
  contentVariant?: 'card' | 'plain';
};

function NavItemHandler({
  item,
  router,
  children,
}: {
  item: DashboardSidebarItem;
  router: ReturnType<typeof useRouter>;
  children: React.ReactNode;
}) {
  const handleClick = () => {
    if (item.onClick) item.onClick();
    else if (item.path) router.push(item.path);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center border-0 bg-transparent p-0"
      aria-label={item.label}
    >
      {children}
    </button>
  );
}

export default function DashboardShell({
  sidebarItems,
  children,
  topBar,
  contentVariant = 'card',
}: DashboardShellProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsExpanded(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isLogout = (label: string) => label === 'Logout';
  const mainItems = sidebarItems.filter((i) => !isLogout(i.label));
  const logoutItem = sidebarItems.find((i) => isLogout(i.label));

  const renderCollapsedIcon = (item: DashboardSidebarItem, index: number) => {
    const Icon = item.icon;
    return (
      <NavItemHandler key={index} item={item} router={router}>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            item.active ? 'shadow-sm' : 'text-[var(--dash-forest)] hover:bg-white/45'
          }`}
          style={item.active ? { backgroundColor: 'var(--dash-forest)' } : undefined}
          title={item.label}
        >
          {item.active ? (
            <img
              src="/fillStarBottom.png"
              alt=""
              className="h-4 w-4 object-contain brightness-0 invert"
              aria-hidden
            />
          ) : (
            <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
          )}
        </span>
      </NavItemHandler>
    );
  };

  const renderExpandedRow = (item: DashboardSidebarItem, index: number) => {
    const Icon = item.icon;
    const logout = isLogout(item.label);
    return (
      <NavItemHandler key={index} item={item} router={router}>
        <div
          className={`mb-1 flex min-w-0 items-center gap-2.5 rounded-full px-3 py-2.5 text-[12px] font-bold transition-colors ${
            item.active
              ? 'text-white shadow-sm'
              : logout
                ? 'text-red-600 hover:bg-red-50'
                : 'text-[var(--dash-forest)] hover:bg-[var(--dash-card-mint)]/60'
          }`}
          style={item.active ? { backgroundColor: 'var(--dash-forest)' } : undefined}
        >
          {item.active ? (
            <img
              src="/fillStarBottom.png"
              alt=""
              className="h-4 w-4 shrink-0 object-contain brightness-0 invert"
              aria-hidden
            />
          ) : (
            <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" strokeWidth={2.4} />
          )}
          <span className="truncate">{item.label}</span>
          {item.badge ? (
            <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--dash-forest)] px-1 text-[10px] text-white">
              {item.badge}
            </span>
          ) : null}
        </div>
      </NavItemHandler>
    );
  };

  const expandedNav = (
    <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-3" aria-label="Main navigation">
      {sidebarItems.map(renderExpandedRow)}
    </nav>
  );

  /** Below hamburger: pt-5 + h-11 + mb-3 */
  const drawerTopClass = 'top-[4.75rem]';
  return (
    <div
      className="dash-shell flex h-screen w-full overflow-hidden lg:grid"
      style={{ backgroundColor: 'var(--dash-shell-bg)' }}
    >
      {/* Icon rail + drawer anchored under the menu toggle */}
      <div className="dash-shell-rail relative z-40 flex h-full w-[var(--dash-rail-w)] shrink-0 flex-col items-center">
        <button
          type="button"
          onClick={() => setIsExpanded((o) => !o)}
          className="relative z-50 mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--dash-forest)' }}
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          aria-expanded={isExpanded}
        >
          <Menu className="h-5 w-5 text-white" strokeWidth={2.4} />
        </button>

        {isExpanded && (
          <aside
            className={`absolute ${drawerTopClass} bottom-4 left-1/2 z-40 hidden w-[var(--dash-drawer-w)] -translate-x-1/2 flex-col overflow-hidden rounded-[20px] shadow-[4px_0_28px_rgba(7,62,54,0.14)] lg:flex`}
            style={{ backgroundColor: 'var(--dash-sidebar-open)' }}
          >
            {expandedNav}
          </aside>
        )}

        {!isExpanded && (
          <nav
            className="hidden min-h-0 w-[4.25rem] flex-1 flex-col items-center gap-0.5 overflow-y-auto rounded-[999px] px-1 py-3 shadow-[0_8px_32px_rgba(7,62,54,0.1)] lg:flex"
            style={{ backgroundColor: 'var(--dash-sidebar-rail)' }}
            aria-label="Main navigation"
          >
            <div className="flex w-full flex-col items-center gap-0.5">
              {mainItems.map(renderCollapsedIcon)}
            </div>
            {logoutItem ? (
              <div className="mt-auto flex w-full flex-col items-center pt-2">
                {renderCollapsedIcon(logoutItem, sidebarItems.length - 1)}
              </div>
            ) : null}
          </nav>
        )}
      </div>

      {/* Mobile / tablet: overlay + drawer */}
      {isExpanded && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/25 lg:hidden"
            aria-label="Close menu overlay"
            onClick={() => setIsExpanded(false)}
          />
          <aside
            className={`fixed left-2 z-50 flex w-[var(--dash-drawer-w)] max-w-[85vw] flex-col rounded-[20px] shadow-[4px_0_28px_rgba(7,62,54,0.14)] lg:hidden ${drawerTopClass} bottom-4`}
            style={{ backgroundColor: 'var(--dash-sidebar-open)' }}
          >
            {expandedNav}
          </aside>
        </>
      )}

      {/* Column 3: main dashboard — width unchanged when sidebar opens */}
      <main
        className={`dash-shell-main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white px-3 pb-6 pt-4 lg:flex-none ${
          topBar ? 'dash-shell-main--with-topbar' : ''
        }`}
      >
        {topBar ? <div className="dash-shell-topbar shrink-0">{topBar}</div> : null}
        {contentVariant === 'card' ? (
          <div className="min-h-0 w-full flex-1 bg-white px-4 py-5 md:px-7 md:py-7">
            {children}
          </div>
        ) : (
          <div className="flex min-h-0 w-full flex-1 flex-col bg-white">{children}</div>
        )}
      </main>
    </div>
  );
}
