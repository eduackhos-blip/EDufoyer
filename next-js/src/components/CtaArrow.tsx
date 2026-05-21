'use client';

import React from 'react';

const CTA_ARROW_SRC = '/Arrow%20up-left.png';

type CtaArrowProps = {
  tone?: 'white' | 'forest-dark';
  className?: string;
};

export function CtaArrow({ tone = 'forest-dark', className = 'h-5 w-5 shrink-0' }: CtaArrowProps) {
  const color = tone === 'white' ? '#ffffff' : '#073E36';

  return (
    <span
      aria-hidden
      className={`block ${className}`}
      style={{
        backgroundColor: color,
        transform: 'rotate(-100deg)',
        maskImage: `url("${CTA_ARROW_SRC}")`,
        WebkitMaskImage: `url("${CTA_ARROW_SRC}")`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}
