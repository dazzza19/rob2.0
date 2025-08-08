import React from 'react';

export const CarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M14 16.5V15a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1.5" />
    <path d="M2 10h20" />
    <path d="M6 10V8c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2" />
    <path d="M7 19h10" />
    <path d="M5 19v-3.5a2.5 2.5 0 0 1 5 0V19" />
    <path d="M19 19v-3.5a2.5 2.5 0 0 0-5 0V19" />
  </svg>
);