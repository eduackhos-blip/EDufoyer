'use client';

import { PenLine } from 'lucide-react';

/** Fountain-pen style nav icon (tilted nib) for sidebar "My doubts". */
export default function MyDoubtsNavIcon({
  className = '',
  strokeWidth = 2.2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <PenLine
      className={`${className} -rotate-[32deg]`}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
