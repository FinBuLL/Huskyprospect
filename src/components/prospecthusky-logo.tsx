import type React from 'react';

export const ProspectHuskyLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="ProspectHusky Logo" // Changed aria-label
  >
    {/* Keeping the visual elements the same as ProspectWiseLogo for now */}
    <path
      d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 26c-6.627 0-12-5.373-12-12S9.373 4 16 4s12 5.373 12 12-5.373 12-12 12z"
      fill="currentColor"
    />
    <path
      d="M16 8c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.313 0-6-2.687-6-6s2.687-6 6-6 6 2.687 6 6-2.687 6-6 6z"
      fill="currentColor"
      opacity="0.6"
    />
    <path
      d="M16 12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z"
      fill="currentColor"
      opacity="0.8"
    />
  </svg>
);
