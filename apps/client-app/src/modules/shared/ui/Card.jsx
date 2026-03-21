import React from "react";

// ─── Card ─────────────────────────────────────────────────────────────────────
function CardComponent({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────
function CardHeaderComponent({ children, className = "" }) {
  return (
    <div className={`px-4 pt-4 pb-2 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// ─── CardContent ──────────────────────────────────────────────────────────────
function CardContentComponent({ children, className = "" }) {
  return (
    <div className={`px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}

// ─── CardFooter ───────────────────────────────────────────────────────────────
function CardFooterComponent({ children, className = "" }) {
  return (
    <div className={`px-4 pb-4 pt-2 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export const Card        = React.memo(CardComponent);
export const CardHeader  = React.memo(CardHeaderComponent);
export const CardContent = React.memo(CardContentComponent);
export const CardFooter  = React.memo(CardFooterComponent);

export default Card;
