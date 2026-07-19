import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-signal-500 text-blueprint-950 hover:bg-signal-400 disabled:bg-signal-950 disabled:text-line-700',
  secondary:
    'bg-transparent text-line-100 border border-blueprint-600 hover:border-signal-500 hover:text-signal-400',
  ghost: 'bg-transparent text-line-300 hover:text-line-100 hover:bg-blueprint-800',
  danger: 'bg-danger-500 text-blueprint-950 hover:brightness-110',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'font-mono font-medium uppercase tracking-[0.06em] rounded-sm transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
