import React from 'react';

export function RainbowButton({ children, className = '', ...props }) {
  return (
    <button
      className={[
        'rainbow-btn group relative inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-8 py-2 font-medium text-white transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
