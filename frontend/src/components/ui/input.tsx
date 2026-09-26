import { type InputHTMLAttributes, type LabelHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={clsx("text-sm font-medium text-white", className)} {...props} />
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-xl border bg-slate-900/70 px-3.5 py-2.75 text-sm text-white placeholder:text-slate-400 shadow-sm",
          "transition-all duration-200 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/20",
          error ? "border-rust bg-rust-soft/10" : "border-white/10",
          className
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-rust">{error}</p> : null}
    </div>
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <textarea
      ref={ref}
      className={clsx(
        "w-full rounded-xl border bg-slate-900/70 px-3.5 py-2.75 text-sm text-white placeholder:text-slate-400 shadow-sm",
        "transition-all duration-200 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/20",
        error ? "border-rust bg-rust-soft/10" : "border-white/10",
        className
      )}
      {...props}
    />
    {error ? <p className="mt-1 text-xs text-rust">{error}</p> : null}
  </div>
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(({ className, error, children, ...props }, ref) => (
  <div className="w-full">
    <select
      ref={ref}
      className={clsx(
        "w-full rounded-xl border bg-slate-900/70 px-3.5 py-2.75 text-sm text-white shadow-sm",
        "transition-all duration-200 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/20",
        error ? "border-rust bg-rust-soft/10" : "border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error ? <p className="mt-1 text-xs text-rust">{error}</p> : null}
  </div>
));
Select.displayName = "Select";
