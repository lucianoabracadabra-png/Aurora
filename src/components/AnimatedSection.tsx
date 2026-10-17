import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedSectionProps {
  id: string;
  index: number;
  className?: string;
  children: React.ReactNode;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  id,
  index,
  className = 'flex flex-col gap-6',
  children
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Staggered cadence: entries entering the viewport stagger gracefully by 80ms
  const staggerDelay = shouldReduceMotion ? 0 : Math.min((index % 4) * 0.08, 0.24);

  return (
    <section id={id} className="relative scroll-mt-20">
      <motion.div
        className={className}
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 24, scale: 0.985, filter: 'blur(5px)' }
        }
        whileInView={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
        }
        viewport={{ once: true, margin: '-40px 0px -20px 0px' }}
        transition={{
          duration: shouldReduceMotion ? 0.2 : 0.55,
          delay: staggerDelay,
          ease: [0.22, 1, 0.36, 1], // Celestial snappy ease-out
        }}
      >
        {children}
      </motion.div>
    </section>
  );
};
