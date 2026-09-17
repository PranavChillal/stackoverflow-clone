import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", style, ...props }, ref) => (
  <input
    ref={ref}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm !text-gray-900 placeholder:!text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    style={{
      color: "#111827",
      WebkitTextFillColor: "#111827",
      ...style,
    }}
    {...props}
  />
));

Input.displayName = "Input";
