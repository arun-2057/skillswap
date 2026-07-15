'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

/* ─── Container stagger animation ─── */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/* ─── Individual card animation ─── */

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/* ─── MotionGrid – wraps a list of items with stagger + exit animations ─── */

interface MotionGridProps {
  children: ReactNode;
  className?: string;
  /** Unique key to trigger re-animation when the dataset changes (e.g. filter applied) */
  animateKey?: string | number;
}

export function MotionGrid({ children, className, animateKey }: MotionGridProps) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={animateKey}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={className}
        aria-live="polite"
        aria-label="Listings grid"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── MotionCard – individual animated card ─── */

interface MotionCardProps {
  children: ReactNode;
  /** Unique key for AnimatePresence tracking */
  id: string;
  className?: string;
  onClick?: () => void;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

export function MotionCard({
  children,
  id,
  className,
  onClick,
  ariaLabel,
}: MotionCardProps) {
  return (
    <motion.div
      layout
      key={id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}