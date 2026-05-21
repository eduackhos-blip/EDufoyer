'use client';

/** Custom pen icon for sidebar "My doubts" (Figma export, rotated nib). */
export default function MyDoubtsNavIcon({
  className = '',
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 13 13"
      fill="none"
      className={`shrink-0 ${className || 'h-6 w-6'}`.trim()}
      style={{ transform: 'rotate(-9deg)' }}
      aria-hidden
    >
      <g clipPath="url(#clip0_my_doubts_nav)">
        <path
          d="M9.82007 11.0186L3.63657 8.60638L3.42469 5.20963L5.92891 3.30471L9.14587 4.41557L9.82007 11.0186ZM9.82007 11.0186L6.92993 7.21917M6.42976 2.92373L2.92384 5.59061L1.78089 4.08807L5.28681 1.42119L6.42976 2.92373ZM5.50939 6.39111C5.57559 5.90409 6.02407 5.56295 6.51109 5.62915C6.99811 5.69534 7.33925 6.14382 7.27305 6.63084C7.20685 7.11786 6.75838 7.459 6.27136 7.3928C5.78434 7.3266 5.4432 6.87813 5.50939 6.39111Z"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_my_doubts_nav">
          <rect
            width="10.6792"
            height="10.6792"
            fill="white"
            transform="translate(10.582 12.0203) rotate(-172.259)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
