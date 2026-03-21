import React from 'react';

// Minimal safe placeholder (no extra deps).
// If you later want real Lottie, install `lottie-react` and replace this component.
export function LottieView({ className = '', label = 'Loading...' }) {
  return <div className={['text-sm text-gray-600', className].join(' ')}>{label}</div>;
}
