
import React from 'react';

export const LicensePlateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M4 12h2" />
    <path d="M10 12h4" />
    <path d="M18 12h2" />
    <path d="M7 9h4" />
    <path d="M13 9h4" />
  </svg>
);