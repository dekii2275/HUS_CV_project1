import React from 'react';
import { X, Radio, Activity, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getYouTubeEmbedUrl } from '../../utils/utils';
import { useLanguage } from '../../context/LanguageContext';

interface CameraLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: {
    id: string;
    name: string;
    url: string;
  } | null;
}

export function CameraLiveModal({ isOpen, onClose, camera }: CameraLiveModalProps) {
  const { t } = useLanguage();
  if (!camera) return null;

  const embedUrl = camera.url.includes('embed') ? camera.url : getYouTubeEmbedUrl(camera.url);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-zinc-950 border border-brand-primary/30 shadow-[0_0_50px_rgba(255,62,0,0.15)] flex flex-col overflow-hidden"
          >
            {/* Tactical Header */}
            <div className="flex justify-between items-center bg-zinc-900/50 border-b border-brand-primary/20 px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-brand-primary animate-pulse" />
                <span className="font-mono text-[10px] font-black text-text-primary uppercase tracking-[0.3em]">
                  {camera.name} // RAW FEED // UNPROCESSED
                </span>
              </div>
              <button 
                onClick={onClose}
                className="text-text-muted hover:text-brand-primary transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video bg-black group">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={camera.name}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-error font-mono text-xs uppercase tracking-widest">
                  NO VALID STREAM SOURCE FOUND
                </div>
              )}

              {/* Tactical Overlays */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning Line */}
                <div className="absolute inset-x-0 h-px bg-brand-primary/20 top-0 animate-[scanning_4s_linear_infinite] z-20" />
                
                {/* Viewport Corners */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-brand-primary/40" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-brand-primary/40" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-brand-primary/40" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-brand-primary/40" />

                {/* Data Tags */}
                <div className="absolute bottom-10 left-10 space-y-1">
                  <div className="bg-black/60 px-2 py-1 text-[8px] font-mono text-zinc-400 border-l-2 border-brand-primary">
                    COORD: {38 + Math.random().toFixed(4)}° N, {-77 - Math.random().toFixed(4)}° W
                  </div>
                  <div className="bg-black/40 px-2 py-0.5 text-[7px] font-mono text-zinc-500 italic">
                    {t('monitor.secure_aes')} // STREAMING_LIVE
                  </div>
                </div>

                <div className="absolute top-10 right-10">
                   <div className="flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3 py-1">
                      <Radio size={12} className="text-brand-primary animate-pulse" />
                      <span className="text-[8px] font-bold text-brand-primary uppercase tracking-widest">SIGNAL: SECURE</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Tactical Footer / Status Bar */}
            <div className="bg-zinc-900/80 p-4 border-t border-brand-primary/10 flex justify-between items-center text-[8px] font-mono">
               <div className="flex gap-6 text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-brand-success" />
                    <span>Hệ thống: Ổn định</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={10} className="text-brand-primary" />
                    <span>Mã hóa: AES-256</span>
                  </div>
               </div>
               <div className="text-brand-primary/60 italic tracking-widest">
                  {camera.id} // SOURCE_ORIGIN
               </div>
            </div>

            {/* Corner Decor */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-brand-primary z-50" />
          </motion.div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanning {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}} />
    </AnimatePresence>
  );
}
