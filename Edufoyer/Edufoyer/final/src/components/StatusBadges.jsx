import React from 'react';

export function DoubtStatusBadge({ status }) {
  if (!status) return null;

  let className = "text-xs font-medium px-2 py-0.5 rounded-full capitalize border whitespace-nowrap ";
  let label = status.toString().replace("_", " ");

  switch (status.toLowerCase()) {
    case "open":
      className += "bg-blue-900/60 text-blue-300 border-blue-800/70";
      break;
    case "assigned":
      className += "bg-yellow-900/60 text-yellow-300 border-yellow-800/70";
      break;
    case "resolved":
      className += "bg-green-900/60 text-green-300 border-green-800/70";
      break;
    case "closed":
      className += "bg-neutral-700 text-neutral-400 border-neutral-600";
      break;
    case "needs_info":
      className += "bg-purple-900/60 text-purple-300 border-purple-800/70";
      break;
    default:
      className += "bg-neutral-800 text-neutral-300 border-neutral-700";
      label = "Unknown";
      break;
  }
  return <span className={className}>{label}</span>;
}

export function ResolutionStatusBadge({ status }) {
  if (!status) return null;

  let className = "text-[11px] font-medium px-1.5 py-0.5 rounded-full capitalize border whitespace-nowrap ";
  let label = status.toString().replace("_", " ");

  switch (status.toLowerCase()) {
    case "pending":
      className += "bg-neutral-700 text-neutral-300 border-neutral-600";
      break;
    case "session_scheduled":
      className += "bg-blue-900/70 text-blue-300 border-blue-800/80";
      break;
    case "session_completed":
      className += "bg-green-900/70 text-green-300 border-green-800/80";
      break;
    case "accepted":
      className += "bg-green-900/70 text-green-300 border-green-800/80";
      break;
    case "rejected":
      className += "bg-red-900/70 text-red-300 border-red-800/80";
      break;
    case "needs_revision":
      className += "bg-yellow-900/70 text-yellow-300 border-yellow-800/80";
      break;
    default:
      className += "bg-neutral-800 text-neutral-300 border-neutral-700";
      label = "Unknown";
      break;
  }
  return <span className={className}>{label}</span>;
}

export function StarRating({ rating }) {
  if (rating === null || rating === undefined || rating < 1 || rating > 5) {
    return (
      <span className="text-xs text-neutral-500 italic">Not rated</span>
    );
  }

  const maxStars = 5;
  return (
    <div className="flex items-center gap-0.5" title={`${rating} out of 5 stars`}>
      {[...Array(maxStars)].map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-neutral-600 fill-neutral-600"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434L10.788 3.21z"
            clipRule="evenodd"
          />
        </svg>
      ))}
      <span className="text-xs text-neutral-400 ml-1 font-medium">
        ({rating}/5)
      </span>
    </div>
  );
}
