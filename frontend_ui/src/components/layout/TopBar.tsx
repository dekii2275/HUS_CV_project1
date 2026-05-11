import React from 'react';
import { Search, Bell, Clock, User, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/utils';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../context/UserContext';

import { useLocation } from '../../context/LocationContext';
import { Target, Navigation, Zap, Signal } from 'lucide-react';

export const TopBar = () => {
  const { t } = useLanguage();
  const { userData } = useUser();
  const { coords, isSyncing, error } = useLocation();
  
  return (
    <header className="h-14 bg-background-muted border-b border-border-subtle fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 px-12 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="bg-brand-primary w-7 h-7 flex items-center justify-center">
          <div className="w-3 h-3 bg-white rotate-45" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[10px] uppercase tracking-[0.4em] text-text-primary leading-none mb-1">Kinetix / Traffic</span>
          {coords && !error ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-brand-primary animate-pulse">
                <Target size={8} />
                <span className="text-[7px] font-mono font-bold tracking-widest">{coords.lat.toFixed(4)}N {Math.abs(coords.lng).toFixed(4)}W</span>
              </div>
              <div className="h-3 w-px bg-border-subtle" />
              <div className="flex items-center gap-1.5 text-text-muted">
                <Navigation size={8} className="transform" style={{ transform: `rotate(${coords.heading || 0}deg)` }} />
                <span className="text-[7px] font-mono font-bold uppercase">{coords.speed ? `${(coords.speed * 3.6).toFixed(1)} KM/H` : t('topbar.stationary')}</span>
              </div>
              <div className="h-3 w-px bg-border-subtle" />
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Signal size={8} />
                <span className="text-[7px] font-mono font-bold uppercase">±{coords.accuracy?.toFixed(0)}M</span>
              </div>
            </div>
          ) : isSyncing ? (
            <div className="flex items-center gap-1.5 text-brand-primary/60 animate-pulse">
               <Zap size={8} />
               <span className="text-[7px] font-mono font-bold tracking-widest uppercase">{t('topbar.precision_link')}</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-1.5 text-brand-error">
               <AlertTriangle size={8} />
               <span className="text-[7px] font-mono font-bold tracking-widest uppercase text-brand-error/70">{t('topbar.telemetry_error')}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text" 
            placeholder={t('topbar.search_placeholder')} 
            className="w-full h-8 bg-surface border border-border-subtle rounded-none pl-10 pr-4 text-[10px] text-text-primary uppercase tracking-widest outline-none focus:border-brand-primary/50 transition-all font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-text-muted hover:text-brand-primary transition-all">
          <Bell size={18} />
        </button>
        <button className="text-text-muted hover:text-brand-primary transition-all">
          <Clock size={18} />
        </button>
        <div className="w-px h-6 bg-border-subtle mx-1" />
        <button className="flex items-center gap-3 hover:text-text-primary transition-all group text-left">
          <div className="w-8 h-8 bg-surface border border-border-subtle flex items-center justify-center group-hover:border-brand-primary transition-all overflow-hidden rounded-none">
            {userData.avatarUrl ? (
              <img src={userData.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={16} className="text-text-muted group-hover:text-brand-primary" />
            )}
          </div>
          <div className="hidden sm:block">
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted group-hover:text-text-primary line-clamp-1 max-w-[120px]">{userData.username}</span>
            <span className="block text-[8px] font-mono text-text-muted/60 uppercase">{t('topbar.unit')}</span>
          </div>
        </button>
      </div>
    </header>
  );
};
