import React from 'react';
import { 
  Globe, 
  Layers, 
  MapPin, 
  Target, 
  Navigation, 
  Hexagon, 
  Crosshair,
  Maximize,
  Search,
  Signal
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card } from '../components/common/Card';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../utils/utils';
import { useLocation } from '../context/LocationContext';

// Fix for default marker icons in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map centering
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center);
  }, [center]);
  return null;
}

export default function MapCenter() {
  const { t } = useLanguage();
  const { coords, history, error } = useLocation();

  // Fallback to DC if no coords yet
  const displayLat = coords?.lat ?? 38.8995;
  const displayLng = coords?.lng ?? -77.1546;
  const center: [number, number] = [displayLat, displayLng];

  // Custom drone icon for current location
  const droneIcon = L.divIcon({
    className: 'custom-drone-icon',
    html: `
      <div class="relative w-10 h-10 flex items-center justify-center">
        <div class="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping"></div>
        <div class="relative w-4 h-4 bg-brand-primary border-2 border-white shadow-lg rotate-45"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
            {t('map.geospatial_core')} // {t('nav.map-center')}
          </h1>
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest text-brand-primary animate-pulse">
            {t('map.telemetry_link')} // DATUM: WGS84
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary" size={14} />
              <input 
                type="text" 
                placeholder={t('map.coord_jump')}
                className="bg-surface border border-border-subtle px-10 py-2 text-[10px] font-mono text-text-primary outline-none focus:border-brand-primary transition-all uppercase w-48"
              />
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[600px]">
        {/* Layer Controls ... */}
        <aside className="lg:col-span-1 space-y-6">
          <Card title={t('map.layer_stack')} subtitle={t('map.active_overlays')}>
             <div className="p-6 space-y-3 bg-surface">
                <LayerItem icon={<Hexagon size={12}/>} label={t('map.layer.traffic_flow')} active />
                <LayerItem icon={<Navigation size={12}/>} label={t('map.layer.public_transit')} />
                <LayerItem icon={<Crosshair size={12}/>} label={t('map.layer.incident_hotspots')} active />
                <LayerItem icon={<Target size={12}/>} label={t('map.layer.asset_tracking')} />
                <LayerItem icon={<Layers size={12}/>} label={t('map.layer.topographical')} />
             </div>
          </Card>

          <Card title={t('map.region_select')} subtitle={t('map.zone_isolation')}>
             <div className="p-6 space-y-2 bg-surface font-mono">
                {['METRO CORE', 'NORTH CORRIDOR', 'EAST TERMINAL', 'SOUTH PORT', 'WEST BYPASS'].map(zone => (
                   <button key={zone} className="w-full text-left px-3 py-2 text-[9px] text-text-muted hover:text-brand-primary border-l-2 border-transparent hover:border-brand-primary transition-all uppercase tracking-widest bg-background-muted border border-border-subtle mb-1">
                      {zone}
                   </button>
                ))}
             </div>
          </Card>

          <div className="flex-1" />
          
          <div className="p-5 border border-dashed border-border-subtle opacity-40">
             <p className="text-[8px] font-mono text-text-muted uppercase leading-relaxed text-center tracking-[0.2em]">
                {t('map.secure_vector')} // v.8.2.1
             </p>
          </div>
        </aside>

        {/* Global Map Display */}
        <div className="lg:col-span-3 h-full relative border border-border-subtle bg-zinc-950 overflow-hidden shadow-2xl group z-0">
           {/* Grid Layout Overlay */}
           <div className="absolute inset-0 z-10 pointer-events-none opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
           
           {/* Leaflet Map Integration */}
           <div className="absolute inset-0 w-full h-full group-hover:opacity-100 transition-all duration-[1s]">
              <MapContainer 
                center={center} 
                zoom={15} 
                style={{ height: '100%', width: '100%', filter: 'grayscale(1) contrast(1.2) invert(0.95)' }}
                zoomControl={false}
              >
                <ChangeView center={center} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Trace Trail */}
                {history.length > 1 && (
                  <Polyline 
                     positions={history.map(p => [p.lat, p.lng])} 
                     pathOptions={{ color: '#FF3E00', weight: 3, opacity: 0.5, dashArray: '5, 10' }} 
                  />
                )}

                {/* Breadcrumbs */}
                {history.slice(0, 10).map((point, idx) => (
                  <Marker 
                    key={`${point.timestamp}-${idx}`} 
                    position={[point.lat, point.lng]}
                    icon={L.divIcon({
                      className: 'bg-brand-primary/40 rounded-full w-1 h-1',
                      iconSize: [4, 4]
                    })}
                  />
                ))}

                {/* Current Position Marker */}
                <Marker position={center} icon={droneIcon} />
              </MapContainer>
              <div className="absolute inset-0 bg-brand-primary/5 pointer-events-none mix-blend-multiply z-[1000]" />
           </div>

           {/* Viewport UI Controls */}
           <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
              <div className="bg-black/90 border border-border-subtle p-4 font-mono shadow-[4px_4px_0_0_var(--color-brand-primary)]">
                 <div className="text-[10px] font-black text-brand-primary mb-1 uppercase italic tracking-tighter">{t('map.render_mode')}</div>
                 <div className="text-[8px] text-zinc-400 uppercase font-mono tracking-tighter">
                   LAT: {displayLat.toFixed(6)} // LONG: {displayLng.toFixed(6)}
                 </div>
                 {coords && (
                   <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center gap-4 text-[7px] font-mono">
                        <span className="text-zinc-500">{t('map.precision')}:</span>
                        <span className="text-brand-primary">±{coords.accuracy?.toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between items-center gap-4 text-[7px] font-mono">
                        <span className="text-zinc-500">{t('map.velocity')}:</span>
                        <span className="text-brand-primary">{coords.speed ? (coords.speed * 3.6).toFixed(1) : "0.0"} KM/H</span>
                      </div>
                      <div className="flex justify-between items-center gap-4 text-[7px] font-mono">
                        <span className="text-zinc-500">{t('map.heading')}:</span>
                        <span className="text-brand-primary">{coords.heading?.toFixed(1) || "0.0"}°</span>
                      </div>
                   </div>
                 )}
                 {error && (
                   <div className="text-[7px] text-brand-error mt-1 animate-pulse font-bold">{error}</div>
                 )}
              </div>
           </div>

           <div className="absolute bottom-16 right-6 z-20 flex flex-col gap-2">
              <MapBtn icon={<Maximize size={16}/>} />
              <MapBtn icon={<Layers size={16}/>} />
              <div className="h-4" />
              <MapBtn icon={<div className="font-black text-xs">+</div>} />
              <MapBtn icon={<div className="font-black text-xs">-</div>} />
           </div>

           {/* Telemetry Strip */}
           <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-md border-t border-border-subtle p-3 flex justify-between items-center z-20 px-6">
              <div className="flex gap-8">
                 <DataField label={t('map.assets_online')} value="442" />
                 <DataField label={t('map.active_alerts')} value="12" warn />
                 <DataField label={t('map.grid_sync')} value={coords ? t('status.nominal').toUpperCase() : t('status.pending').toUpperCase() + "..."} />
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-[10px] font-mono text-zinc-500 italic tracking-widest tracking-tighter uppercase px-2 max-w-xs truncate">
                {coords ? `CURRENT LOC: [${displayLat.toFixed(2)}, ${displayLng.toFixed(2)}]` : error || t('map.initializing_handshake')}
              </div>
           </div>

           {/* Corners */}
           <Corner pos="top-0 left-0" />
           <Corner pos="top-0 right-0" rotate="rotate-90" />
           <Corner pos="bottom-0 left-0" rotate="-rotate-90" />
           <Corner pos="bottom-0 right-0" rotate="rotate-180" />
        </div>
      </div>
    </div>
  );
}

function LayerItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between p-3 border transition-all rounded-none group",
      active ? "bg-brand-primary/5 border-brand-primary/40" : "bg-background-muted border-border-subtle hover:border-text-muted/30"
    )}>
      <div className="flex items-center gap-3">
         <span className={cn(active ? "text-brand-primary" : "text-text-muted group-hover:text-text-primary")}>{icon}</span>
         <span className={cn("text-[9px] font-bold uppercase tracking-widest", active ? "text-text-primary" : "text-text-muted")}>{label}</span>
      </div>
      <div className={cn("w-1.5 h-1.5 rotate-45", active ? "bg-brand-primary animate-pulse shadow-[0_0_8px_var(--color-brand-primary)]" : "bg-border-subtle")} />
    </button>
  );
}

function MapBtn({ icon }: { icon: any }) {
  return (
    <button className="w-10 h-10 bg-black/80 border border-border-subtle flex items-center justify-center text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all backdrop-blur-md shadow-xl">
       {icon}
    </button>
  );
}

function DataField({ label, value, warn = false }: { label: string, value: string, warn?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
       <span className="text-[7px] font-bold text-text-muted uppercase tracking-[0.2em]">{label}</span>
       <span className={cn("text-[10px] font-mono font-black tracking-tight", warn ? "text-brand-error animate-pulse" : "text-white uppercase tracking-tighter")}>{value}</span>
    </div>
  );
}

function Corner({ pos, rotate = '' }: { pos: string, rotate?: string }) {
  return (
    <div className={cn("absolute w-6 h-6 border-t-2 border-l-2 border-brand-primary/30 pointer-events-none z-30", pos, rotate)} />
  );
}
