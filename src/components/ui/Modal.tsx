import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'violet' | 'rose' | 'cyan' | 'emerald' | 'amber';
  className?: string;
}

const themeStyles = {
  violet: {
    border: 'border-violet-500/30',
    iconBg: 'bg-violet-500/15 border-violet-500/30 text-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.25)]',
    glow: 'shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(167,139,250,0.15)]',
    titleText: 'text-violet-300'
  },
  rose: {
    border: 'border-rose-500/30',
    iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    glow: 'shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(244,63,94,0.15)]',
    titleText: 'text-rose-300'
  },
  cyan: {
    border: 'border-cyan-500/30',
    iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]',
    glow: 'shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.15)]',
    titleText: 'text-cyan-300'
  },
  emerald: {
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]',
    glow: 'shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(52,211,153,0.15)]',
    titleText: 'text-emerald-300'
  },
  amber: {
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    glow: 'shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)]',
    titleText: 'text-amber-300'
  }
};

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl'
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'lg',
  theme = 'violet',
  className = ''
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const style = themeStyles[theme];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-[#06040f] border ${style.border} rounded-[2rem] w-full ${widthClasses[maxWidth]} ${style.glow} flex flex-col relative overflow-hidden transition-all animate-in zoom-in-95 duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${style.iconBg}`}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-white/50 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 relative z-10">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between relative z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
