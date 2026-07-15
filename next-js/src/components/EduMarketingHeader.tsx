import React from 'react';
import Link from 'next/link';

export type EduMarketingHeaderVariant = 'inline' | 'fixed';

type EduMarketingHeaderProps = {
  /** `inline`: landing hero (flow in section). `fixed`: auth page top bar. */
  variant: EduMarketingHeaderVariant;
};

/**
 * Shared marketing nav: EDUFOYER logo, ABOUT US / CONTACT US (with curve marks), QUICK TOUR.
 * Styles from globals.css (.edu-logo, .edu-hero-header, .edu-nav-link, .edu-tour-btn, …).
 */
export default function EduMarketingHeader({ variant }: EduMarketingHeaderProps) {
  const header = (
    <header
      className={
        variant === 'fixed' ? 'edu-hero-header edu-hero-header--auth' : 'edu-hero-header'
      }
    >
      <Link href="/" className="edu-logo" aria-label="Edufoyer home">
        <span className="edu-logo-text">EDU</span>
        <span className="edu-logo-f">F</span>
        <span className="edu-logo-text">OYER</span>
      </Link>

      <nav className="edu-hero-nav">
        <Link href="/about" className="edu-nav-link">
          ABOUT US
          <img
            src="/aboutus&contactusarrow.png"
            alt=""
            aria-hidden
            className="edu-nav-curve-img edu-nav-curve-img-about"
            decoding="async"
          />
        </Link>
        <Link href="/contact" className="edu-nav-link">
          CONTACT US
          <img
            src="/aboutus&contactusarrow.png"
            alt=""
            aria-hidden
            className="edu-nav-curve-img edu-nav-curve-img-contact"
            decoding="async"
          />
        </Link>
      </nav>

      <button type="button" className="edu-tour-btn">
        <span aria-hidden>↖</span>
        QUICK TOUR
      </button>
    </header>
  );

  if (variant === 'fixed') {
    return (
      <div
        className="fixed right-0 z-50 border-b border-gray-100"
        style={{ background: 'transparent', top: '28px', left: '0px',border:"none" }}
      >
        <div className="mx-auto w-[96%] px-[6px] pt-[12px] sm:w-[92%]">{header}</div>
      </div>
    );
  }

  return header;
}
