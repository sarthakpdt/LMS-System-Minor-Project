import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoverCard, AnimatedProgressBar, animationVariants } from './animations';
import { ArrowUp, FileX2, LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

// ============= CARD COMPONENTS =============

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
  hover?: boolean;
  noPadding?: boolean;
  role?: 'admin' | 'student' | 'teacher';
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  gradient = false,
  hover = true,
  noPadding = false,
  role,
  glass = false,
  className = '',
  ...props
}) => {
  const roleGradients = {
    admin: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    student: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    teacher: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
  };

  const baseClass = glass
    ? `backdrop-blur-xl bg-white/70 dark:bg-gray-800/60 border border-white/30 dark:border-gray-700/30 rounded-xl ${noPadding ? '' : 'p-6'} shadow-lg dark:shadow-2xl`
    : `bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/50 rounded-xl ${noPadding ? '' : 'p-6'} shadow-sm dark:shadow-lg`;

  const hoverClass = hover ? 'hover:shadow-md dark:hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200' : 'transition-colors duration-200';
  const gradientClass = gradient || role ? `bg-gradient-to-br ${role ? roleGradients[role] : 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'}` : '';

  if (hover) {
    return (
      <HoverCard
        className={`${baseClass} ${hoverClass} ${gradientClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </HoverCard>
    );
  }

  return (
    <div
      className={`${baseClass} ${hoverClass} ${gradientClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

// ============= BUTTON COMPONENTS =============

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/20 active:shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg hover:shadow-red-500/20 active:shadow-sm',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg hover:shadow-green-500/20 active:shadow-sm',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
        flex items-center justify-center
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </motion.button>
  );
};

// ============= STAT CARD COMPONENTS =============

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  gradient?: string;
  role?: 'admin' | 'student' | 'teacher';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  gradient = 'from-blue-500 to-blue-600',
  role,
}) => {
  const roleGradients = {
    admin: 'from-purple-500 to-indigo-600',
    student: 'from-blue-500 to-cyan-600',
    teacher: 'from-green-500 to-emerald-600',
  };

  const roleGlow = {
    admin: 'shadow-purple-500/20',
    student: 'shadow-blue-500/20',
    teacher: 'shadow-green-500/20',
  };

  const finalGradient = role ? roleGradients[role] : gradient;
  const glowClass = role ? roleGlow[role] : 'shadow-blue-500/20';

  return (
    <Card gradient hover className="relative overflow-hidden group">
      {/* Gradient background accent */}
      <div className={`absolute -right-6 -top-6 w-28 h-28 bg-gradient-to-br ${finalGradient} opacity-[0.07] rounded-full transition-transform duration-500 group-hover:scale-125`} />
      <div className={`absolute -right-2 -bottom-2 w-16 h-16 bg-gradient-to-br ${finalGradient} opacity-[0.04] rounded-full`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br ${finalGradient} rounded-xl text-white shadow-lg ${glowClass}`}>
            {icon}
          </div>
          {change && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                change.isPositive
                  ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
                  : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
              }`}
            >
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
            </motion.span>
          )}
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
        <motion.p
          className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.p>
      </div>
    </Card>
  );
};

// ============= PROGRESS RING COMPONENT =============

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 'md',
  label,
  color = 'blue',
}) => {
  const sizeMap = {
    sm: { outer: 64, stroke: 4, textSize: 'text-sm' },
    md: { outer: 100, stroke: 5, textSize: 'text-xl' },
    lg: { outer: 140, stroke: 6, textSize: 'text-2xl' },
  };

  const colorMap: Record<string, { stroke: string; glow: string }> = {
    blue: { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
    green: { stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' },
    orange: { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
    red: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
    purple: { stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.3)' },
  };

  const { outer, stroke, textSize } = sizeMap[size];
  const radius = (outer - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: outer, height: outer }}>
        {/* Background circle */}
        <svg className="absolute inset-0 transform -rotate-90" width={outer} height={outer}>
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={colorMap[color].stroke}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${colorMap[color].glow})` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            className={`${textSize} font-bold text-gray-900 dark:text-white`}
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      </div>
      {label && <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>}
    </div>
  );
};

// ============= BADGE COMPONENT =============

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'md' }) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1
        font-semibold rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {children}
    </motion.span>
  );
};

// ============= ALERT COMPONENT =============

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, onClose }) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  };

  return (
    <motion.div
      variants={animationVariants.slideInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`border rounded-xl p-4 ${variantClasses[variant]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{children}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-lg font-bold opacity-40 hover:opacity-100 transition-opacity leading-none"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============= LOADING SKELETON CARD =============

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/50 rounded-xl shadow-sm">
          <div className="space-y-4 p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 ds-shimmer" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 ds-shimmer" style={{ animationDelay: '0.1s' }} />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full ds-shimmer" style={{ animationDelay: '0.2s' }} />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6 ds-shimmer" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      ))}
    </>
  );
};


// ================================================================
// NEW COMPONENTS
// ================================================================

// ============= EMPTY STATE =============

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileX2,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6"
      >
        <Icon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

// ============= SCROLL TO TOP BUTTON =============

export const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Look for main scrollable container or use window
      const mainEl = document.querySelector('main');
      if (mainEl) {
        setVisible(mainEl.scrollTop > 300);
      } else {
        setVisible(window.scrollY > 300);
      }
    };

    const mainEl = document.querySelector('main');
    const target = mainEl || window;
    target.addEventListener('scroll', handleScroll, { passive: true });
    return () => target.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ============= GLASS CARD =============

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hover = true,
  noPadding = false,
  className = '',
  ...props
}) => {
  const base = `backdrop-blur-xl bg-white/60 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30 rounded-xl ${noPadding ? '' : 'p-6'} shadow-lg`;
  const hoverClass = hover ? 'hover:shadow-xl hover:bg-white/70 dark:hover:bg-gray-800/60 transition-all duration-200' : '';

  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`${base} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ============= SECTION HEADER =============

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
