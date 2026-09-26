"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-navy text-paper hover:bg-navy-soft shadow-[0_10px_24px_rgba(18,26,43,0.18)]",
  secondary: "bg-white text-ink border border-line hover:bg-paper-dim shadow-sm",
  ghost: "bg-transparent text-ink hover:bg-paper-dim",
  danger: "bg-rust text-white hover:opacity-90 shadow-[0_10px_24px_rgba(222,81,56,0.25)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={disabled || isLoading ? undefined : { scale: 1.02 }}
        whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12 }}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {isLoading ? (
          <motion.span
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
          />
        ) : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
