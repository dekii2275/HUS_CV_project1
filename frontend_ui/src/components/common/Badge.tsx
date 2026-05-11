import React from 'react';
import { cn } from '../../utils/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'info';
  className?: string;
}

export const Badge = ({ children, variant = 'neutral', className }: BadgeProps) => {
  const variants = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    error: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary',
    neutral: 'bg-background-muted border-border-subtle text-text-muted',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-none text-[9px] font-bold border uppercase tracking-[0.2em] font-mono",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
