import React, { forwardRef } from 'react';

type BentoBoxProps = {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  onHeaderClick?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  rightContent?: React.ReactNode;
};

export const BentoBox = forwardRef<HTMLDivElement, BentoBoxProps>(({
  title,
  icon,
  children,
  className = '',
  titleClassName = 'text-white',
  onHeaderClick,
  onClick,
  rightContent
}, ref) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`bg-[#050508]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden relative transition-all duration-300 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />
      
      {(title || icon) && (
        <div 
          className={`px-6 py-5 flex items-center justify-between relative z-10 ${onHeaderClick ? 'cursor-pointer select-none hover:bg-white/[0.02] transition-colors' : ''}`}
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
          {rightContent ? rightContent : (
            <div className="flex gap-1">
              <div className={`w-1 h-1 rounded-full ${titleClassName.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
              <div className={`w-1 h-1 rounded-full ${titleClassName.replace('text-', 'bg-')} opacity-60`} />
              <div className={`w-1 h-1 rounded-full ${titleClassName.replace('text-', 'bg-')} opacity-30`} />
            </div>
          )}
        </div>
      )}
      <div className="flex-1 flex flex-col px-6 pb-6 pt-0 relative z-10">{children}</div>
    </div>
  );
});

BentoBox.displayName = 'BentoBox';
