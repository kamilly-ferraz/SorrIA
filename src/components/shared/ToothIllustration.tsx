import React from 'react';

const ToothIllustration: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Tooth illustration"
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#BFFCF0" stopOpacity="1" />
          <stop offset="60%" stopColor="#9FE6FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#0095FF" stopOpacity="1" />
        </linearGradient>
        <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feBlend in="SourceGraphic" in2="b" mode="screen" />
        </filter>
      </defs>

      <rect width="100%" height="100%" rx="24" fill="transparent" />

      <g transform="translate(20,12)">
        <g filter="url(#f1)">
          <path
            d="M90 18c-10 0-22 6-30 20-6 10-10 28-6 46 4 18 12 36 24 44 8 6 18 8 30 8s22-2 30-8c12-8 20-26 24-44 4-18 0-36-6-46-8-14-20-20-30-20-6 0-12 2-18 6-6-4-12-6-18-6z"
            fill="url(#g1)"
            opacity="0.98"
          />
        </g>

        <path
          d="M90 28c-8 0-18 5-24 16-5 9-8 23-5 37 3 14 10 28 20 34 7 5 16 6 24 6s17-1 24-6c10-6 17-20 20-34 3-14 0-28-5-37-6-11-16-16-24-16-5 0-9 2-14 5-5-3-9-5-14-5z"
          fill="#fff"
          opacity="0.7"
        />

        <g transform="translate(20,20)">
          <path
            d="M50 6c-6 0-12 3-16 9-3 5-5 13-3 21 2 8 6 15 12 19 4 3 9 4 14 4s10-1 14-4c6-4 10-11 12-19 2-8 0-16-3-21-4-6-10-9-16-9-3 0-6 1-9 3-3-2-6-3-9-3z"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />

          <circle cx="84" cy="12" r="2.2" fill="#fff" opacity="0.7">
            <animate attributeName="cy" values="12;8;12" dur="3.4s" repeatCount="indefinite" />
          </circle>

          <g transform="translate(8,58)" opacity="0.7">
            <path d="M0 6c8 2 18 2 26 0" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
};

export default ToothIllustration;
