import React from 'react';
import { Wifi, RefreshCw } from 'lucide-react';
import { Card } from '../common/Card';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/utils';

interface Camera {
  id: string;
  name?: string;
  status: string;
  location: string;
  bit?: string;
  bitrate?: string;
  latency: string;
}

interface CameraTelemetryProps {
  cameras: Camera[];
  loading: boolean;
  onRescan?: () => void;
  onCameraClick?: (camera: any) => void;
}

export function CameraTelemetry({ cameras, loading, onRescan, onCameraClick }: CameraTelemetryProps) {
  const { t } = useLanguage();

  return (
    <Card title={t('monitor.telemetry')} subtitle={t('monitor.signal_strength')}>
      <div className="p-6 space-y-6 bg-surface">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-brand-primary text-xs font-mono animate-pulse uppercase">
              FETCHING NODE TELEMETRY...
            </div>
          ) : (
            cameras.map((cam) => (
              <div 
                key={cam.id} 
                onClick={() => onCameraClick?.(cam)}
                className="flex items-center gap-4 group cursor-pointer hover:bg-background-muted p-2 -mx-2 transition-all active:scale-[0.98]"
              >
                <div className={cn(
                  "p-2 border transition-all",
                  cam.status === 'ACTIVE' 
                    ? "border-brand-primary/20 text-brand-primary bg-brand-primary/5" 
                    : "border-border-subtle text-text-muted opacity-30"
                )}>
                  <Wifi size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-text-primary uppercase tracking-widest">
                      {cam.name || cam.id}
                    </span>
                    <span className={cn(
                      "text-[7px] font-mono font-bold", 
                      cam.status === 'ACTIVE' ? "text-brand-success" : "text-brand-error"
                    )}>
                      {cam.status}
                    </span>
                  </div>
                  <div className="text-[8px] text-text-muted uppercase font-mono tracking-tighter italic">
                    {cam.location}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[8px] font-mono text-text-primary">
                    {cam.bitrate || cam.bit}
                  </span>
                  <span className="text-[6px] font-mono text-text-muted">
                    {cam.latency}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={onRescan}
          className="w-full py-3 bg-background-muted border border-border-subtle hover:border-brand-primary/40 text-[9px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all group"
        >
          <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500 text-brand-primary" />
          {t('monitor.rescan')}
        </button>
      </div>
    </Card>
  );
}
