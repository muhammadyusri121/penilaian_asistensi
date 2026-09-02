import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export function Badge({ className = "", variant = "neutral", children, ...props }: BadgeProps) {
  const variantStyles = {
    success: "bg-[#4CAF50] text-black",
    warning: "bg-[#FFEB3B] text-black",
    danger: "bg-[#FF5252] text-white",
    info: "bg-[#2196F3] text-white",
    neutral: "bg-white text-black",
  }[variant];

  return (
    <span
      className={`neo-box-sm inline-flex items-center px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
