import React from 'react';
import { 
  Camera, 
  Wifi, 
  Maximize2, 
  Scan, 
  Activity, 
  Cpu, 
  Radio, 
  MapPin,
  RefreshCw,
  X,
  Minimize2
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CAMERA_NODES = [
  { id: 'CAM W11', location: 'I-95 Northbound', status: 'ACTIVE', bit: '4.2 MB/S', latency: '18ms' },
  { id: 'CAM C04', location: 'Main St Intersection', status: 'ACTIVE', bit: '3.8 MB/S', latency: '12ms' },
  { id: 'CAM E01', location: 'Tunnel West Entrance', status: 'ACTIVE', bit: '5.1 MB/S', latency: '24ms' },
  { id: 'CAM S12', location: 'Beltway Junction', status: 'OFFLINE', bit: '0.0 MB/S', latency: '---' },
  { id: 'CAM W03', location: 'River Bridge', status: 'ACTIVE', bit: '2.9 MB/S', latency: '31ms' },
  { id: 'CAM N08', location: 'Rail Buffer Zone', status: 'ACTIVE', bit: '4.5 MB/S', latency: '14ms' },
];

export default function LiveMonitoring() {
  const { t } = useLanguage();
  const [isZoomed, setIsZoomed] = React.useState(false);

  const CameraView = ({ zoomed = false, onToggleZoom }: { zoomed?: boolean, onToggleZoom: () => void }) => (
    <div className={cn(
      "relative bg-zinc-950 overflow-hidden group",
      zoomed ? "w-full h-full" : "aspect-video"
    )}>
       {/* Camera Overlay */}
       <div className={cn(
         "absolute inset-0 flex flex-col justify-between pointer-events-none z-10",
         zoomed ? "p-10" : "p-6"
       )}>
          <div className="flex justify-between items-start">
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-black/60 px-3 py-1.5 border-l-4 border-brand-primary">
                   <span className={cn(
                     "font-mono font-bold text-white tracking-widest uppercase italic tracking-tighter",
                     zoomed ? "text-lg" : "text-[10px]"
                   )}>
                     CAM W11 // 4K UHD // TS 60FPS
                   </span>
                </div>
                <div className={cn(
                  "font-mono text-zinc-400 bg-black/40 px-2 uppercase py-1 self-start",
                  zoomed ? "text-[10px]" : "text-[8px]"
                )}>
                  REC ● [00:42:15:22]
                </div>
             </div>
             <div className="bg-brand-primary/10 border border-brand-primary/20 px-4 py-1.5 flex items-center gap-2">
                <Radio size={zoomed ? 14 : 10} className="text-brand-primary animate-pulse" />
                <span className={cn("font-bold text-brand-primary uppercase tracking-widest", zoomed ? "text-[10px]" : "text-[8px]")}>
                  {t('monitor.stream_live')}
                </span>
             </div>
          </div>

          <div className="flex justify-between items-end">
             <div className="space-y-2">
                <div className={cn("font-mono text-zinc-300 bg-black/60 px-3 py-2", zoomed ? "text-xs" : "text-[10px]")}>
                  COORD: 38.8951° N, 77.0364° W
                </div>
                <div className={cn("font-mono text-zinc-500 italic tracking-widest", zoomed ? "text-[10px]" : "text-[8px]")}>
                  AZIMUTH: 182.4° // PITCH: -14.2° // FOV: 75°
                </div>
             </div>
             
             {/* Interaction Controls */}
             <div className="flex gap-4 pointer-events-auto">
                <button 
                  onClick={onToggleZoom}
                  className={cn(
                    "flex items-center gap-3 bg-brand-primary text-black font-black uppercase tracking-[0.2em] transition-all hover:bg-white active:scale-95",
                    zoomed ? "px-6 py-3 text-[10px] shadow-[0_0_30px_rgba(255,62,0,0.4)]" : "p-2 border border-white/10"
                  )}
                >
                   {zoomed ? (
                     <>
                       <Minimize2 size={16} />
                       {t('monitor.zoom_out')}
                     </>
                   ) : (
                     <Maximize2 size={16} />
                   )}
                </button>
             </div>
          </div>
       </div>

       {/* Camera Visual Content */}
       <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1545147981-197a31bcc20b?auto=format&fit=crop&q=80&w=1200" 
            alt="Traffic Feed"
            className={cn(
              "w-full h-full object-cover grayscale contrast-125",
              zoomed ? "opacity-80" : "opacity-60"
            )}
            referrerPolicy="no-referrer"
          />
          
          {/* Noise / Grain */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" 
               style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

          {/* Grid Lines (Zoomed Only) */}
          {zoomed && (
            <div className="absolute inset-0 pointer-events-none opacity-20">
               <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
               <div className="absolute top-1/2 left-0 w-full h-px bg-white/20" />
               <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
            </div>
          )}
       </div>

       {/* Scanning Line */}
       <div className="absolute inset-x-0 h-px bg-brand-primary/30 top-0 animate-[scanning_4s_linear_infinite] z-20" />

       {/* Viewport Corners */}
       <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-white/20" />
       <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-white/20" />
       <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-white/20" />
       <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-white/20" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
            {t('monitor.stream_overlay')} // {t('nav.live-monitoring')}
          </h1>
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
            {t('monitor.node_cluster')} // {t('monitor.encrypted_feed')}
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 border border-border-subtle bg-surface text-[10px] font-mono">
              <div className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" />
              <span className="text-text-primary uppercase font-bold tracking-widest tracking-tighter">{t('monitor.system_health')}: 100%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <Card title={t('monitor.primary_feed')} subtitle={t('monitor.thermal_res')}>
            <CameraView onToggleZoom={() => setIsZoomed(true)} />

            <div className="p-4 bg-surface border-t border-border-subtle flex justify-between items-center overflow-x-auto gap-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="flex-1 min-w-[120px] p-3 border border-border-subtle bg-background-muted/50 hover:border-brand-primary/30 cursor-pointer transition-all">
                    <div className="text-[7px] font-mono text-text-muted uppercase mb-1">{t('monitor.node_stream')} {i}</div>
                    <div className="h-12 bg-background-muted border border-border-subtle flex items-center justify-center">
                       <Camera size={14} className="text-text-muted/40" />
                    </div>
                 </div>
               ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
           <Card title={t('monitor.telemetry')} subtitle={t('monitor.signal_strength')}>
              <div className="p-6 space-y-6 bg-surface">
                 <div className="space-y-4">
                    {CAMERA_NODES.map(cam => (
                      <div key={cam.id} className="flex items-center gap-4 group cursor-pointer hover:bg-background-muted p-2 -mx-2 transition-all">
                         <div className={cn(
                           "p-2 border transition-all",
                           cam.status === 'ACTIVE' ? "border-brand-primary/20 text-brand-primary bg-brand-primary/5" : "border-border-subtle text-text-muted opacity-30"
                         )}>
                           <Wifi size={14} />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <span className="text-[9px] font-bold text-text-primary uppercase tracking-widest">{cam.id}</span>
                               <span className={cn("text-[7px] font-mono font-bold", cam.status === 'ACTIVE' ? "text-brand-success" : "text-brand-error")}>{cam.status}</span>
                            </div>
                            <div className="text-[8px] text-text-muted uppercase font-mono tracking-tighter italic">{cam.location}</div>
                         </div>
                         <div className="text-right flex flex-col items-end">
                            <span className="text-[8px] font-mono text-text-primary">{cam.bit}</span>
                            <span className="text-[6px] font-mono text-text-muted">{cam.latency}</span>
                         </div>
                      </div>
                    ))}
                 </div>

                 <button className="w-full py-3 bg-background-muted border border-border-subtle hover:border-brand-primary/40 text-[9px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all group">
                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500 text-brand-primary" />
                    {t('monitor.rescan')}
                 </button>
              </div>
           </Card>

           <Card title={t('monitor.auto_analysis')} subtitle={t('monitor.motion_vectoring')}>
              <div className="p-6 space-y-4 bg-surface">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/10 text-brand-primary">
                       <Scan size={14} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-text-primary uppercase">{t('monitor.engine_active')}</span>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-mono text-text-muted uppercase">
                       <span>{t('monitor.cpu_util')}</span>
                       <span>42%</span>
                    </div>
                    <div className="h-1 bg-background-muted border border-border-subtle">
                       <div className="h-full bg-brand-primary w-1/2" />
                    </div>
                 </div>
                 <p className="text-[9px] font-mono text-text-muted uppercase leading-relaxed italic">
                    {t('monitor.pattern_anomalies')}
                 </p>
              </div>
           </Card>
        </div>
      </div>

      {/* Expanded Zoomed View Overlay */}
      <AnimatePresence>
        {isZoomed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 overflow-hidden">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsZoomed(false)}
               className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full h-full max-w-[95%] max-h-[90%] bg-zinc-950 border border-brand-primary/50 relative z-10 shadow-[0_0_100px_rgba(255,62,0,0.2)] flex flex-col"
            >
              <div className="flex-1 min-h-0">
                <CameraView zoomed onToggleZoom={() => setIsZoomed(false)} />
              </div>
              
              {/* Tactical Modal Decor */}
              <div className="absolute -top-1 -right-1 w-12 h-12 border-t-2 border-r-2 border-brand-primary pointer-events-none" />
              <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-2 border-l-2 border-brand-primary pointer-events-none" />
              
              {/* Data Overlay Corners */}
               <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-brand-primary text-black px-4 py-1 text-[8px] font-black uppercase tracking-[0.4em] z-30">
                  {t('monitor.secure_aes')} // {t('monitor.overlay_expanded')}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanning {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}} />
    </div>
  );
}
