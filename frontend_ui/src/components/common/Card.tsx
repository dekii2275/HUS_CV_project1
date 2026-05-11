import React from 'react';
import { cn } from '../../utils/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  headerClassName?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card = ({ title, subtitle, action, children, className, headerClassName, ...props }: CardProps) => {
  return (
    <div 
      className={cn(
        "bg-surface border border-border-subtle rounded-none flex flex-col shadow-none hover:border-brand-primary/30 transition-all",
        className
      )} 
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={cn("px-5 py-4 border-b border-border-subtle flex items-center justify-between", headerClassName)}>
          <div>
            {title && <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-primary leading-tight italic">{title}</h3>}
            {subtitle && <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1 font-mono">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
