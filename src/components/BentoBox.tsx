import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardProps } from './ui/Card';

export interface BentoBoxProps extends CardProps {
  animateOnScroll?: boolean;
  index?: number;
  delay?: number;
}

export const BentoBox = forwardRef<HTMLDivElement, BentoBoxProps>(({
  animateOnScroll = false,
  index = 0,
  delay,
  className = '',
  ...props
}, ref) => {
  const shouldReduceMotion = useReducedMotion();

  // If standalone animateOnScroll is enabled
  if (animateOnScroll && !shouldReduceMotion) {
    const staggerDelay = delay ?? Math.min((index % 4) * 0.08, 0.24);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24, scale: 0.985, filter: 'blur(5px)' }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-40px 0px' }}
        transition={{
          duration: 0.55,
          delay: staggerDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{
          y: -2,
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        className="relative group/bento transition-all duration-300"
      >
        {/* Subtle magical ambient sheen on hover */}
        <div className="absolute -inset-[1px] rounded-[2.05rem] bg-gradient-to-r from-violet-500/0 via-violet-400/15 to-cyan-400/0 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />
        <Card className={className} {...props} />
      </motion.div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative group/bento transition-transform duration-300 hover:-translate-y-0.5"
    >
      {/* Subtle magical ambient sheen on hover */}
      <div className="absolute -inset-[1px] rounded-[2.05rem] bg-gradient-to-r from-violet-500/0 via-violet-400/15 to-cyan-400/0 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />
      <Card className={className} {...props} />
    </div>
  );
});

BentoBox.displayName = 'BentoBox';
