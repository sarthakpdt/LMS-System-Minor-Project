import React, { ReactNode, useEffect, useState } from 'react';
import { motion, MotionProps, useInView, AnimatePresence } from 'framer-motion';

// ================================================================
// ANIMATION VARIANTS
// ================================================================

export const animationVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  // Slide animations
  slideInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  slideInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Stagger container (for multiple children)
  staggerContainer: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },

  // Hover animations
  hoverScale: {
    whileHover: { scale: 1.05 },
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },

  hoverLift: {
    whileHover: { y: -5 },
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },

  // === NEW VARIANTS ===

  // Page transition (subtle fade + slide)
  pageTransition: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },

  // Modal animation (scale + fade)
  modalScale: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },

  // Sidebar collapse
  sidebarExpand: {
    initial: { width: 0, opacity: 0 },
    animate: { width: 256, opacity: 1 },
    exit: { width: 0, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },

  // Notification slide
  notificationSlide: {
    initial: { opacity: 0, x: 50, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 50, scale: 0.95 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },

  // Fast stagger (for grids)
  staggerGrid: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },

  staggerGridItem: {
    initial: { opacity: 0, y: 15, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },

  // Dropdown menu
  dropdownOpen: {
    initial: { opacity: 0, y: -8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.96 },
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  },
};


// ================================================================
// ANIMATED COMPONENTS
// ================================================================

// Animated Container Component
interface AnimatedContainerProps extends MotionProps {
  children: ReactNode;
  variant?: keyof typeof animationVariants;
  className?: string;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  variant = 'fadeIn',
  className = '',
  ...motionProps
}) => {
  const variantConfig = animationVariants[variant];
  return (
    <motion.div
      initial={variantConfig.initial}
      animate={variantConfig.animate}
      exit={variantConfig.exit}
      transition={variantConfig.transition}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

// Stagger List Component (for animating lists of items)
interface StaggerListProps {
  children: ReactNode;
  className?: string;
}

export const StaggerList: React.FC<StaggerListProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={animationVariants.staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger Item Component (wrap each child)
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({ children, className = '' }) => {
  return (
    <motion.div variants={animationVariants.staggerItem} className={className}>
      {children}
    </motion.div>
  );
};

// Hover Card Component (lifts on hover)
interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const HoverCard: React.FC<HoverCardProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.995 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated Loading Skeleton
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export const AnimatedSkeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
}) => {
  return (
    <motion.div
      className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg ${className}`}
      animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
      style={{ backgroundSize: '200% 100%' }}
    />
  );
};

// Page Transition Wrapper
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated Badge
interface AnimatedBadgeProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  className = '',
  animated = true,
}) => {
  return (
    <motion.span
      className={className}
      animate={animated ? { scale: [1, 1.08, 1], opacity: [1, 0.85, 1] } : undefined}
      transition={animated ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : undefined}
    >
      {children}
    </motion.span>
  );
};

// Animated Progress Bar
interface AnimatedProgressBarProps {
  progress: number;
  className?: string;
  color?: string;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  className = '',
  color,
}) => {
  const gradientClass = color || 'bg-gradient-to-r from-blue-500 to-cyan-500';
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full ${gradientClass} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
};

// Spinning Loader
interface SpinningLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SpinningLoader: React.FC<SpinningLoaderProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`${sizeMap[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    >
      <div className="w-full h-full border-[3px] border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400 rounded-full" />
    </motion.div>
  );
};


// ================================================================
// NEW COMPONENTS
// ================================================================

/**
 * ScrollReveal — Animate children into view when scrolled into viewport.
 * Uses Framer Motion's useInView for intersection detection.
 */
interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  once = true,
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  const directionMap = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { x: 24, y: 0 },
    right: { x: -24, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerGrid — Staggered animation container optimized for card grids.
 */
interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

export const StaggerGrid: React.FC<StaggerGridProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={animationVariants.staggerGrid}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerGridItem: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div variants={animationVariants.staggerGridItem} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * AnimatedModal — Wrapper for modal content with scale+fade animation.
 */
interface AnimatedModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  children,
  isOpen,
  onClose,
  className = '',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * CountUp — Animated number that counts up from 0.
 */
interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, isInView]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};
