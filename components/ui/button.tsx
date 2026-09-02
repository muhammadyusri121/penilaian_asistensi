import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "info" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    let variantStyles = "bg-[#FFEB3B] text-black hover:bg-[#FDD835]";

    if (variant === "secondary") {
      variantStyles = "bg-white text-black hover:bg-neutral-100";
    } else if (variant === "danger") {
      variantStyles = "bg-[#FF5252] text-white hover:bg-[#FF1744]";
    } else if (variant === "info") {
      variantStyles = "bg-[#2196F3] text-white hover:bg-[#1E88E5]";
    } else if (variant === "outline") {
      variantStyles = "bg-transparent text-black hover:bg-neutral-200";
    } else if (variant === "ghost") {
      return (
        <button
          ref={ref}
          disabled={disabled}
          className={`font-bold transition-opacity hover:opacity-75 disabled:opacity-50 cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </button>
      );
    }

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`neo-btn inline-flex items-center justify-center gap-2 rounded-none font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
