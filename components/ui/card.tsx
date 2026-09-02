import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  headerColor?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({
  className = "",
  headerColor,
  title,
  subtitle,
  action,
  children,
  ...props
}: CardProps) {
  return (
    <div className={`neo-box ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div
          className={`flex items-center justify-between border-b-3 border-black p-4 ${
            headerColor || "bg-white"
          }`}
        >
          <div>
            {title && <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs font-medium text-neutral-600">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
