import React, { forwardRef } from 'react';

export interface CardProps {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  onHeaderClick?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  rightContent?: React.ReactNode;
  variant?: 'glass' | 'solid' | 'subtle';
  padding?: 'normal' | 'compact' | 'none';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  title,
  icon,
  children,
  className = '',
  titleClassName = 'text-violet-400',
  onHeaderClick,
  onClick,
  rightContent,
  variant = 'glass',
  padding = 'normal'
}, ref) => {
  const variantStyles = {
    glass: 'bg-[#050508]/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
    solid: 'bg-[#090715] border border-white/10 shadow-xl',
    subtle: 'bg-white/[0.02] border border-white/5'
  }[variant];

  const paddingStyles = {
    normal: 'px-6 pb-6 pt-0',
    compact: 'px-4 pb-4 pt-0',
    none: 'p-0'
  }[padding];

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`rounded-[2rem] flex flex-col overflow-hidden relative transition-all duration-300 ${variantStyles} ${className}`}
    >
      {/* Subtle Specular Top Highlight Overlay */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-60 pointer-events-none" />

      {(title || icon) && (
        <div
          className={`px-6 py-5 flex items-center justify-between relative z-10 select-none ${
            onHeaderClick ? 'cursor-pointer hover:bg-white/[0.02] transition-colors' : ''
          }`}
          onClick={onHeaderClick}
        >
          <div className="flex items-center gap-3">
            {icon && <span className={titleClassName}>{icon}</span>}
            {title && (
              <h2 className={`text-[10px] font-bold tracking-[0.3em] uppercase ${titleClassName} drop-shadow-[0_0_8px_currentColor]`}>
                {title}
              </h2>
            )}
          </div>

          {rightContent ? (
            rightContent
          ) : (
            <div className="flex gap-1.5 items-center">
              <div className={`w-1.5 h-1.5 rounded-full ${titleClassName.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
              <div className={`w-1.5 h-1.5 rounded-full ${titleClassName.replace('text-', 'bg-')} opacity-60`} />
              <div className={`w-1.5 h-1.5 rounded-full ${titleClassName.replace('text-', 'bg-')} opacity-30`} />
            </div>
          )}
        </div>
      )}

      <div className={`flex-1 flex flex-col relative z-10 ${paddingStyles}`}>
        {children}
      </div>
    </div>
  );
});

Card.displayName = 'Card';
