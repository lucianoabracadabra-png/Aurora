import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  theme?: 'violet' | 'rose' | 'cyan' | 'emerald' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const themeVariants = {
  violet: {
    primary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(167,139,250,0.3)] border-transparent',
    secondary: 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border-violet-500/30',
    outline: 'bg-transparent hover:bg-violet-500/10 text-violet-300 border-violet-500/40',
    ghost: 'bg-transparent hover:bg-white/5 text-violet-300 border-transparent'
  },
  rose: {
    primary: 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] border-transparent',
    secondary: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30',
    outline: 'bg-transparent hover:bg-rose-500/10 text-rose-300 border-rose-500/40',
    ghost: 'bg-transparent hover:bg-white/5 text-rose-300 border-transparent'
  },
  cyan: {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] border-transparent',
    secondary: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30',
    outline: 'bg-transparent hover:bg-cyan-500/10 text-cyan-300 border-cyan-500/40',
    ghost: 'bg-transparent hover:bg-white/5 text-cyan-300 border-transparent'
  },
  emerald: {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)] border-transparent',
    secondary: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30',
    outline: 'bg-transparent hover:bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    ghost: 'bg-transparent hover:bg-white/5 text-emerald-300 border-transparent'
  },
  amber: {
    primary: 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] border-transparent',
    secondary: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30',
    outline: 'bg-transparent hover:bg-amber-500/10 text-amber-300 border-amber-500/40',
    ghost: 'bg-transparent hover:bg-white/5 text-amber-300 border-transparent'
  }
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
  md: 'px-4 py-2 text-xs font-semibold rounded-xl min-h-[40px]',
  lg: 'px-5 py-3 text-sm font-bold rounded-2xl min-h-[44px]'
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  theme = 'violet',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = themeVariants[theme][variant];
  const sizeClass = sizeClasses[size];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 border font-medium tracking-wider uppercase transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
