import React from "react";

interface CardProps { children: React.ReactNode; className?: string; padding?: "none" | "sm" | "md" | "lg"; onClick?: () => void; }

export const Card = React.memo(function Card({ children, className = "", padding = "md", onClick }: CardProps) {
  const paddings = { none: "", sm: "p-3", md: "p-4", lg: "p-6" };
  return (
    <div
      onClick={onClick}
      className={["rounded-3xl bg-white border border-slate-100 shadow-sm", paddings[padding], onClick ? "cursor-pointer active:scale-[0.98] transition" : "", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
});
