'use client';

import React from 'react';

type DashboardSplashTitleProps = {
  children: React.ReactNode;
  variant?: 'welcome' | 'page';
  className?: string;
  as?: 'h1' | 'span';
};

export default function DashboardSplashTitle({
  children,
  variant = 'page',
  className = '',
  as = 'h1',
}: DashboardSplashTitleProps) {
  const Tag = as;
  const variantClass = variant === 'welcome' ? 'dash-splash-title--welcome' : 'dash-splash-title--page';
  const markClass = variant === 'welcome' ? 'dash-splash-mark--welcome' : 'dash-splash-mark--page';

  return (
    <Tag className={`dash-splash-title ${variantClass} ${className}`.trim()}>
      <img
        src="/aboveMarks.png"
        alt=""
        aria-hidden
        className={`dash-splash-mark ${markClass}`}
        decoding="async"
      />
      {children}
    </Tag>
  );
}
