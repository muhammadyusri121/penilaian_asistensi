import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-black uppercase tracking-wider mb-1.5 text-black">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`neo-input w-full px-3.5 py-2.5 text-sm font-medium text-black placeholder:text-neutral-500 transition-colors ${
            error ? "border-[#FF5252] bg-red-50" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-bold text-[#FF5252]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
