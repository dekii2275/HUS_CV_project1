import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Incident } from '../../types';
import { cn } from '../../lib/utils';
import { AlertTriangle, MapPin, ZoomIn, ZoomOut, Maximize, X, Clock, Activity, Shield, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface IncidentMapProps {
  incidents: Incident[];
  className?: string;
}

export const IncidentMap = ({ incidents, className }: IncidentMapProps) => {
  const { t } = useLanguage();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['critical', 'elevated', 'normal']);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIncident, setHoveredIncident] = useState<Incident | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Filter incidents based on active severity filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => activeFilters.includes(incident.severity));
  }, [incidents, activeFilters]);

  const toggleFilter = (severity: string) => {
    setActiveFilters(prev => 
      prev.includes(severity) 
        ? prev.filter(s => s !== severity) 
        : [...prev, severity]
    );
  };

  // Generate a random city grid for the background
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 20; i++) {
        lines.push({ x1: 0, y1: i * 5, x2: 100, y2: i * 5 });
        lines.push({ x1: i * 5, y1: 0, x2: i * 5, y2: 100 });
    }
    return lines;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - lastMousePos.current.x);
    const dy = (e.clientY - lastMousePos.current.y);
    
    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    
    const delta = -e.deltaY;
    const factor = 1.2;
    const newScale = delta > 0 ? scale * factor : scale / factor;
    
    // Clamp zoom
    const clampedScale = Math.min(Math.max(newScale, 0.5), 8);
    
    if (clampedScale === scale) return;

    // Zoom towards mouse position
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate center of container
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Coordinates of mouse relative to map center (adjusted for current scale and position)
    const mX = mouseX - centerX;
    const mY = mouseY - centerY;

    const ratio = clampedScale / scale;
    
    setPosition(prev => ({
      x: mX - (mX - prev.x) * ratio,
      y: mY - (mY - prev.y) * ratio
    }));
    
    setScale(clampedScale);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full h-full bg-background-muted overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-300", className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Interactive Map Layer */}
      <motion.div 
        className="absolute inset-0 w-full h-full"
        style={{ originX: 0.5, originY: 0.5 }}
        animate={{ 
          x: position.x, 
          y: position.y,
          scale: scale
        }}
        transition={{ 
          type: 'spring', 
          damping: 35, 
          stiffness: 300, 
          mass: 0.5,
          restDelta: 0.001,
          restSpeed: 0.001
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="mapGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="var(--bg-surface)" />
              <stop offset="100%" stopColor="var(--bg-muted)" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#mapGradient)" />
          
          {/* Grid System */}
          {gridLines.map((line, i) => (
            <line
              key={`grid-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="var(--border-subtle)"
              strokeWidth="0.05"
            />
          ))}

          {/* Markers */}
          <AnimatePresence>
            {filteredIncidents.map((incident) => {
              const isHovered = hoveredIncident?.id === incident.id;
              
              return (
                <motion.g
                  key={incident.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: (isHovered ? 1.4 : 1) / Math.max(1, scale * 0.7), 
                    opacity: 1 
                  }}
                  transition={{ 
                    type: 'tween',
                    ease: 'easeOut',
                    duration: 0.2
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="group pointer-events-none"
                  style={{ 
                    originX: `${incident.x}%`, 
                    originY: `${incident.y}%`,
                  }}
                >
                  {/* Invisible Hover Area (Hitbox) - THE ONLY INTERACTIVE PART */}
                  <circle
                    cx={incident.x}
                    cy={incident.y}
                    r={6 / scale}
                    fill="transparent"
                    className="pointer-events-auto cursor-pointer"
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredIncident(incident);
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation();
                      setHoveredIncident(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncident(incident);
                    }}
                  />

                  <circle
                    cx={incident.x}
                    cy={incident.y}
                    r={2 / scale}
                    className={cn(
                      "animate-ping opacity-20",
                      incident.severity === 'critical' ? 'fill-brand-primary' : 
                      incident.severity === 'elevated' ? 'fill-text-muted' : 'fill-text-muted/60'
                    )}
                  />
                  
                  <path
                    d={`M ${incident.x - 1.5} ${incident.y - 1.5} L ${incident.x - 1.5} ${incident.y + 1.5} L ${incident.x + 1.5} ${incident.y + 1.5} L ${incident.x + 1.5} ${incident.y - 1.5} Z`}
                    className={cn(
                      "stroke-1 fill-none transition-colors",
                      incident.severity === 'critical' ? 'stroke-brand-primary' : 
                      incident.severity === 'elevated' ? 'stroke-text-muted' : 'stroke-text-muted/60'
                    )}
                    strokeWidth={0.2 / scale}
                  />

                  <circle
                    cx={incident.x}
                    cy={incident.y}
                    r={0.6 / scale}
                    className={cn(
                      incident.severity === 'critical' ? 'fill-brand-primary' : 
                      incident.severity === 'elevated' ? 'fill-text-muted' : 'fill-text-muted/60'
                    )}
                  />
                  
                  <title>{`${incident.type} - ${incident.location}`}</title>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Tooltip Overlay */}
        <AnimatePresence>
          {hoveredIncident && (
            <motion.div
              key="map-tooltip"
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ 
                opacity: 1, 
                scale: 1 / Math.max(1, scale * 0.7),
                y: 0 
              }}
              transition={{ type: 'tween', duration: 0.1 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
              style={{
                position: 'absolute',
                left: `${hoveredIncident.x}%`,
                top: `${hoveredIncident.y}%`,
                transform: 'translate(-50%, calc(-100% - 15px))',
                transformOrigin: 'bottom',
                zIndex: 100,
                pointerEvents: 'none',
              }}
              className="min-w-[200px]"
            >
              <div className="bg-surface/95 border border-brand-primary p-3 backdrop-blur-md shadow-[0_0_30px_rgba(255,62,0,0.2)]">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border-subtle">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        hoveredIncident.severity === 'critical' ? 'bg-brand-primary' : 'bg-text-muted'
                    )} />
                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest leading-none">
                        {hoveredIncident.type}
                    </span>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={8} className="text-text-muted" />
                        <span className="text-[8px] font-mono text-text-muted uppercase font-bold">{hoveredIncident.location}</span>
                    </div>
                    <p className="text-[10px] text-text-primary font-medium italic opacity-95">
                        {hoveredIncident.description}
                    </p>
                    <div className="pt-1 flex justify-between items-center">
                        <span className="text-[7px] font-mono text-text-muted">NODE_ID / {hoveredIncident.id.slice(0, 8)}</span>
                        <span className="text-[7px] font-mono text-text-muted font-bold">{hoveredIncident.time}</span>
                    </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface/95 border-b border-r border-brand-primary rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Control Interface (HUD) */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 pointer-events-none">
        <div className="bg-surface/80 border border-border-subtle px-3 py-1 backdrop-blur-sm shadow-xl">
          <div className="text-[8px] font-mono text-text-muted uppercase tracking-widest">{t('map.nav_mode')} / INTERACTIVE</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-[10px] font-mono text-text-primary">{t('map.zoom')}: {Math.round(scale * 100)}%</div>
            <div className="text-[10px] font-mono text-text-muted/60">FILT: {activeFilters.length}/3</div>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <FilterToggle 
            label={t('map.filter.critical')} 
            color="var(--color-brand-primary)" 
            active={activeFilters.includes('critical')} 
            onClick={() => toggleFilter('critical')} 
          />
          <FilterToggle 
            label={t('map.filter.elevated')} 
            color="#A1A1AA" 
            active={activeFilters.includes('elevated')} 
            onClick={() => toggleFilter('elevated')} 
          />
          <FilterToggle 
            label={t('map.filter.normal')} 
            color="#52525B" 
            active={activeFilters.includes('normal')} 
            onClick={() => toggleFilter('normal')} 
          />
        </div>
      </div>

      {/* Quick Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 p-1">
        <MapControlButton 
          icon={<ZoomIn size={14}/>} 
          onClick={() => setScale(s => Math.min(s * 1.2, 8))} 
          title={t('map.zoom') + ' (+)'}
        />
        <MapControlButton 
          icon={<ZoomOut size={14}/>} 
          onClick={() => setScale(s => Math.max(s / 1.2, 0.5))} 
          title={t('map.zoom') + ' (-)'}
        />
        <div className="h-[1px] bg-border-subtle/50 my-1 mx-1" />
        <MapControlButton 
          icon={<Maximize size={14}/>} 
          onClick={resetView} 
          title={t('map.reset')}
          className="border-brand-primary/20 hover:border-brand-primary"
        />
      </div>

      {/* Map Scanning Line (Static relative to viewport) */}
      <motion.div 
        className="absolute w-full h-[1px] bg-brand-primary/10 shadow-[0_0_15px_var(--color-brand-primary)] z-20 pointer-events-none"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Incident Detail Side Panel */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-80 h-full bg-surface/95 border-l border-border-subtle backdrop-blur-xl z-[150] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  selectedIncident.severity === 'critical' ? "bg-brand-primary animate-pulse" : "bg-text-muted"
                )} />
                <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Incident Report</h3>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="text-text-muted hover:text-brand-primary transition-colors"
                id="close-incident-panel"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <section>
                <div className="bg-brand-primary/5 border border-brand-primary/20 p-4 mb-4">
                  <div className="text-[12px] font-black text-text-primary uppercase mb-1 tracking-tight">
                    {selectedIncident.type}
                  </div>
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Activity size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Priority: {selectedIncident.severity}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <DetailItem icon={<MapPin size={12} />} label="Location" value={selectedIncident.location} />
                  <DetailItem icon={<Clock size={12} />} label="Timestamp" value={selectedIncident.time} />
                  <DetailItem icon={<Shield size={12} />} label="Node Identity" value={`NODE_${selectedIncident.id.toUpperCase().slice(0, 6)}`} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={12} className="text-brand-primary" />
                  <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Operational Description</h4>
                </div>
                <div className="p-4 bg-background-muted border border-border-subtle font-mono">
                  <p className="text-[10px] text-text-primary leading-relaxed uppercase italic">
                    {selectedIncident.description}
                  </p>
                </div>
              </section>

              <section className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-surface border border-border-subtle flex flex-col gap-1">
                      <span className="text-[7px] text-text-muted uppercase">Latitude</span>
                      <span className="text-[10px] font-mono text-text-primary">38.{(selectedIncident.x * 123).toFixed(0)}N</span>
                   </div>
                   <div className="p-3 bg-surface border border-border-subtle flex flex-col gap-1">
                      <span className="text-[7px] text-text-muted uppercase">Longitude</span>
                      <span className="text-[10px] font-mono text-text-primary">77.{(selectedIncident.y * 321).toFixed(0)}W</span>
                   </div>
                </div>
                <button className="w-full py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0_0_rgba(255,62,0,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                  Dispatch Unit
                </button>
              </section>
            </div>
            
            <div className="p-4 border-t border-border-subtle bg-background-muted flex justify-center">
              <span className="text-[7px] font-mono text-text-muted uppercase tracking-widest">Encrypted Tactical Transmission Channel 12</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-1 text-brand-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="text-[8px] font-bold text-text-muted uppercase tracking-widest mb-0.5">{label}</div>
        <div className="text-[10px] font-black text-text-primary uppercase">{value}</div>
      </div>
    </div>
  );
}

function MapControlButton({ icon, onClick, title, className }: { icon: React.ReactNode, onClick: () => void, title?: string, className?: string }) {
    return (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            title={title}
            className={cn(
              "w-8 h-8 bg-surface/90 border border-border-subtle flex items-center justify-center text-text-muted hover:text-brand-primary hover:border-brand-primary/40 transition-all pointer-events-auto shadow-xl",
              className
            )}
        >
            {icon}
        </button>
    );
}

function FilterToggle({ label, color, active, onClick }: { label: string, color: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-2 py-1 border transition-all text-[8px] font-bold uppercase tracking-widest",
        active 
          ? "bg-surface border-border-subtle text-text-primary" 
          : "bg-surface/40 border-border-subtle/50 text-text-muted hover:bg-surface/60"
      )}
    >
      <div className="w-1.5 h-1.5" style={{ backgroundColor: active ? color : 'transparent', border: `1px solid ${color}` }} />
      {label}
    </button>
  );
}

