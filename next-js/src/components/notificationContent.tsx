'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

const URL_PART = /(https?:\/\/[^\s]+|\/dashboard\/session\/[^\s]+)/gi;

function isSessionJoinUrl(part: string): boolean {
  return /\/dashboard\/session\//i.test(part);
}

/** Remove redundant CTA copy; the Join button replaces it. */
function stripJoinSessionPhrase(text: string): string {
  return text
    .replace(/\s*Join(?:\s+the)?\s+session\s*:?\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sessionPathFromUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    const match = trimmed.match(/\/dashboard\/session\/[^\s]+/);
    return match?.[0] ?? trimmed;
  }
}

/** Renders notification body: session URLs become a themed Join button; other URLs stay forest links. */
export function renderNotificationContent(text: string | null | undefined): ReactNode {
  if (!text) return null;

  const parts = String(text).split(URL_PART);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (isSessionJoinUrl(part)) {
      const href = sessionPathFromUrl(part);
      return (
        <Link key={`session-${idx}`} href={href} className="notification-join-btn">
          Join session
        </Link>
      );
    }

    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={`url-${idx}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="notification-link"
        >
          View link
        </a>
      );
    }

    const cleaned = stripJoinSessionPhrase(part);
    if (!cleaned) return null;
    return <span key={`text-${idx}`}>{cleaned}</span>;
  });
}
