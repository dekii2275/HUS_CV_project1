import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_ITEMS, FOOTER_NAVIGATION } from '../../constants';
import { cn } from '../../utils/utils';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

import { useLanguage } from '../../context/LanguageContext';

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <aside className={cn(
      "border-r border-border-subtle bg-background-muted h-screen fixed left-0 top-14 flex flex-col z-40 transition-all duration-300 shadow-2xl",
      collapsed ? "w-20" : "w-64"
    )}>
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-24 bg-background-muted border border-border-subtle rounded-full p-1 text-text-muted hover:text-brand-primary hover:border-brand-primary/50 transition-all z-50 shadow-lg"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn("px-6 py-8 border-b border-border-subtle/50 transition-all overflow-hidden whitespace-nowrap", collapsed && "px-4")}>
        {!collapsed && (
          <>
            <h2 className="text-[9px] font-bold text-text-muted uppercase tracking-[0.5em] mb-1 animate-in fade-in slide-in-from-left-2">{t('nav.navigation')}</h2>
            <p className="text-[11px] font-medium text-text-primary tracking-widest font-sans uppercase">{t('nav.control_matrix')}</p>
          </>
        )}
        {collapsed && (
          <div className="text-[10px] font-bold text-brand-primary flex justify-center">K / T</div>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto font-mono">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
          const translatedLabel = t(`nav.${item.id}`);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id === 'dashboard' ? '/' : `/${item.id}`)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-none transition-all text-[10px] uppercase tracking-[0.2em] font-semibold group",
                isActive 
                  ? "bg-surface text-brand-primary border-l-2 border-brand-primary" 
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? translatedLabel : ""}
            >
              <item.icon size={14} className={cn(
                isActive ? "text-brand-primary" : "text-text-muted group-hover:text-text-primary",
                "shrink-0"
              )} />
              {!collapsed && <span className="animate-in fade-in slide-in-from-left-2">{translatedLabel}</span>}
            </button>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-border-subtle space-y-2", collapsed && "flex flex-col items-center")}>
        {FOOTER_NAVIGATION.map((item) => {
           const translatedLabel = t(`nav.${item.id}`);
           return (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 rounded-none transition-all text-[9px] uppercase tracking-[0.2em] font-semibold text-text-muted hover:text-text-primary group",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? translatedLabel : ""}
            >
              <item.icon size={14} className="text-text-muted group-hover:text-text-primary shrink-0" />
              {!collapsed && <span className="animate-in fade-in slide-in-from-left-2">{translatedLabel}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
