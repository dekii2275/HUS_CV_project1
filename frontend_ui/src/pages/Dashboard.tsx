import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { summarizeIncident, summarizeSystemStatus } from '../services/geminiService';
import { 
  Camera, 
  AlertTriangle, 
  Activity, 
  Clock, 
  MapPin, 
  Car, 
  Wrench,
  Bot,
  CloudRain,
  Wind,
  Thermometer,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  RefreshCcw
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { cn } from '../utils/utils';
import { IncidentMap } from '../components/dashboard/IncidentMap';
import { Incident } from '../types';

import { motion, AnimatePresence } from 'motion/react';

// Mock Data
const incidents: Incident[] = [
  { 
    id: '1', 
    type: 'Collision Detected', 
    location: 'I-95 South / Marker 22', 
    time: '02m', 
    description: 'Multiple units dispatched. Two lanes blocked.', 
    severity: 'critical',
    x: 45,
    y: 35
  },
  { 
    id: '2', 
    type: 'Infrastructure', 
    location: 'Grid 4A / Station 12', 
    time: '14m', 
    description: 'Emergency repair. Slow speeds expected.', 
    severity: 'normal',
    x: 72,
    y: 65
  },
  { 
    id: '3', 
    type: 'System Alert', 
    location: 'Node 452 (Broad & Elm)', 
    time: '42m', 
    description: 'Signal node reporting sync issues.', 
    severity: 'elevated',
    x: 25,
    y: 80
  },
];

const trafficData = [
  { time: '00:00', volume: 200 },
  { time: '04:00', volume: 150 },
  { time: '08:00', volume: 850 },
  { time: '12:00', volume: 600 },
  { time: '16:00', volume: 900 },
  { time: '20:00', volume: 450 },
  { time: '23:59', volume: 250 },
];

const violationData = [
  { type: 'Red Light', count: 420 },
  { type: 'Speeding', count: 310 },
  { type: 'Bus Lane', count: 180 },
  { type: 'Other', count: 85 },
];

const hotspots = [
  { id: '1', location: 'Downtown Blvd & 5th Ave', congestion: 85, incidents: 2, delay: '14m', status: 'Critical' },
  { id: '2', location: 'I-95 North Bound Exit 4B', congestion: 70, incidents: 1, delay: '9m', status: 'Critical' },
  { id: '3', location: 'Westside Hwy & Market St', congestion: 55, incidents: 0, delay: '4m', status: 'Elevated' },
  { id: '4', location: 'University Ave & 12th St', congestion: 30, incidents: 0, delay: '1m', status: 'Normal' },
];

const searchHistory = [
  { plate: 'KX-2094-Z', model: 'Toyota Camry', type: 'Sedan', status: 'Cleared', time: '12m AGO' },
  { plate: 'BV-9912-F', model: 'Tesla Model Y', type: 'SUV', status: 'Flagged', time: '45m AGO' },
  { plate: 'NH-4421-P', model: 'Ford F-150', type: 'Truck', status: 'Stolen', time: '1h AGO' },
  { plate: 'MJ-0032-B', model: 'Honda Civic', type: 'Compact', status: 'Cleared', time: '3h AGO' },
];

import { useLanguage } from '../context/LanguageContext';

import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { useUser } from '../context/UserContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const { currentUser } = useUser();
  const [realIncidents, setRealIncidents] = React.useState<Incident[]>([]);

  React.useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'incidents'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().timestamp?.toDate ? `${Math.floor((Date.now() - doc.data().timestamp.toDate().getTime()) / 60000)}m` : '0m'
      } as Incident));
      
      // If collection is empty, we'll keep it empty or use mock for now?
      // Better to show real data if it exists.
      if (data.length > 0) {
        setRealIncidents(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'incidents');
    });

    return () => unsubscribe();
  }, [currentUser]);

  const displayIncidents = realIncidents.length > 0 ? realIncidents : incidents;

  return (
    <div className="relative min-h-[calc(100vh-125px)]">
      <div className="flex gap-8 animate-in fade-in duration-700">
        <div className="flex-1 flex flex-col gap-8">
          {/* KPI Row */}
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-cols-6 gap-4 min-w-[1080px]">
              <WeatherKPI />
              <KPICard title={t('dashboard.kpi.cameras')} value="3,492" status="active" />
              <KPICard title={t('dashboard.kpi.offline')} value="18" status="error" />
              <KPICard title={t('dashboard.kpi.violations')} value="1,248" />
              <KPICard title={t('status.pending')} value="342" />
              <KPICard title={t('dashboard.kpi.incidents')} value={String(realIncidents.length || 7)} status="warning" />
            </div>
          </div>

          {/* AI Tactical Analysis */}
          <TacticalAnalysis incidents={displayIncidents} />

          {/* Charts Row */}
          <div className="grid grid-cols-4 gap-6 h-72">
            <Card 
              title="TRAFFIC VOLUME / 24H" 
              subtitle="Unit: Vehicles per Hour" 
              className="col-span-2"
            >
              <div className="w-full h-full p-6 pt-0 bg-surface">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-muted)', borderRadius: '0', border: '1px solid var(--border-subtle)', fontSize: '10px', color: 'var(--text-primary)', textTransform: 'uppercase' }}
                    />
                    <Area 
                      type="stepAfter" 
                      dataKey="volume" 
                      stroke="var(--color-brand-primary)" 
                      strokeWidth={1}
                      fillOpacity={1} 
                      fill="url(#colorVolume)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="VIOLATION DISTRIBUTION" subtitle="By Category" className="col-span-2">
              <div className="w-full h-full p-6 pt-0 bg-surface">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={violationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                    <XAxis dataKey="type" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-muted)', borderRadius: '0', border: '1px solid var(--border-subtle)', fontSize: '10px', color: 'var(--text-primary)' }}
                    />
                    <Bar dataKey="count" radius={0}>
                      {violationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Bottom Row - Restructured to 2x2 Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card 
              title={t('dashboard.map_title')} 
              subtitle={t('dashboard.map_subtitle')}
              className="relative overflow-hidden group h-[450px]"
            >
              <div className="w-full h-full relative">
                <IncidentMap incidents={displayIncidents} />
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">Live Feed</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF3E00] animate-ping" />
                </div>
              </div>
            </Card>

            <Card 
              title={t('dashboard.intersections_title')} 
              subtitle={t('dashboard.intersections_subtitle')}
              className="h-[450px]"
            >
              <div className="overflow-x-auto bg-surface h-full">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead className="bg-background-muted border-b border-border-subtle">
                    <tr className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                      <th className="px-6 py-3">{t('dashboard.table.intersection')}</th>
                      <th className="px-6 py-3">{t('dashboard.table.load')}</th>
                      <th className="px-6 py-3 text-center">{t('dashboard.table.incidents')}</th>
                      <th className="px-6 py-3 text-center">{t('dashboard.table.temporal')}</th>
                      <th className="px-6 py-3 text-right">{t('dashboard.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] text-text-muted font-mono">
                    {hotspots.map((item) => (
                      <tr key={item.id} className="border-b border-border-subtle/50 hover:bg-background-muted transition-colors group">
                        <td className="px-6 py-4 font-bold text-text-primary uppercase tracking-wider">{item.location}</td>
                        <td className="px-6 py-4">
                          <div className="w-32 h-0.5 bg-border-subtle rounded-none overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-none transition-all duration-1000",
                                item.status === 'Critical' ? 'bg-brand-primary' : 'bg-text-muted'
                              )}
                              style={{ width: `${item.congestion}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">{item.incidents}</td>
                        <td className="px-6 py-4 text-center text-brand-primary font-bold">{item.delay}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Badge variant={item.status === 'Critical' ? 'error' : item.status === 'Elevated' ? 'neutral' : 'success'}>
                            {item.status === 'Critical' ? t('status.active') : item.status === 'Elevated' ? t('status.congested') : t('status.nominal')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card 
              title={t('dashboard.violations_title')} 
              subtitle={t('dashboard.violations_subtitle')}
              className="h-[450px]"
            >
              <div className="overflow-x-auto bg-surface h-full">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead className="bg-background-muted border-b border-border-subtle">
                    <tr className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                      <th className="px-6 py-3">{t('dashboard.table.enforcement')}</th>
                      <th className="px-6 py-3 text-center">{t('dashboard.table.plate')}</th>
                      <th className="px-6 py-3 text-center">{t('dashboard.table.site')}</th>
                      <th className="px-6 py-3 text-center">{t('dashboard.table.temporal')}</th>
                      <th className="px-6 py-3 text-right">{t('dashboard.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] text-text-muted font-mono">
                    {[
                      { type: 'Speed / Radar', plate: 'KNT-9921', location: 'Node I95 N', time: '14:42:01', status: 'pending' },
                      { type: 'Optic / Red Light', plate: 'TRF-1042', location: 'Market 04', time: '14:38:55', status: 'approved' },
                      { type: 'Lane Drift', plate: 'OPS-2211', location: 'Bay Bridge', time: '14:35:12', status: 'rejected' },
                      { type: 'Weight Limit', plate: 'LGT-0091', location: 'Port C3', time: '14:30:44', status: 'approved' },
                    ].map((item, idx) => (
                      <tr key={idx} className="border-b border-border-subtle/40 hover:bg-background-muted transition-colors group">
                        <td className="px-6 py-4 font-bold text-brand-primary uppercase italic tracking-tighter">{item.type}</td>
                        <td className="px-6 py-4 text-center text-text-primary">{item.plate}</td>
                        <td className="px-6 py-4 text-center uppercase tracking-widest text-[8px]">{item.location}</td>
                        <td className="px-6 py-4 text-center">{item.time}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Badge 
                            variant={
                              item.status === 'approved' ? 'success' : 
                              item.status === 'rejected' ? 'error' : 'neutral'
                            }
                            className="scale-90"
                          >
                            {t(`status.${item.status}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card 
              title={t('dashboard.events_title')} 
              subtitle={t('dashboard.events_subtitle')}
              className="h-[450px]"
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-6 bg-surface h-full">
                {displayIncidents.map((incident) => (
                  <IncidentItem 
                    key={incident.id}
                    icon={incident.type.includes('Collision') ? <Car size={12} className="text-brand-primary" /> : incident.type.includes('Infrastructure') ? <Wrench size={12} className="text-text-muted" /> : <Activity size={12} className="text-text-muted" />}
                    title={incident.type}
                    time={incident.time}
                    description={incident.description}
                    severity={incident.severity}
                  />
                ))}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, status }: { title: string, value: string, status?: 'active' | 'error' | 'warning' }) {
  return (
    <div className="bg-surface border border-border-subtle p-4 flex flex-col justify-between h-24 hover:border-brand-primary/40 transition-all group shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em] font-mono group-hover:text-text-primary transition-colors">{title}</span>
        {status === 'active' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10B981]" />}
        {status === 'error' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_8px_var(--color-brand-primary)]" />}
        {status === 'warning' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />}
      </div>
      <div className="font-mono text-2xl font-black text-text-primary italic tracking-tighter">
        {status === 'error' ? <span className="text-brand-primary">{value}</span> : value}
      </div>
    </div>
  );
}

function TacticalAnalysis({ incidents }: { incidents: Incident[] }) {
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { language, t } = useLanguage();

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await summarizeSystemStatus(incidents, language);
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalysis();
  }, [incidents.length]);

  return (
    <Card 
      title={`${t('dashboard.ai.command_intel')} // ${t('dashboard.ai.neural_link')}`} 
      subtitle="Real-time Operational Assessment"
      className="bg-brand-primary/[0.02] border-brand-primary/20"
    >
      <div className="p-6 flex flex-col md:flex-row items-center gap-6 bg-surface">
        <div className="w-full md:w-auto flex flex-col items-center gap-2 px-8 py-4 border border-dashed border-brand-primary/20 bg-brand-primary/5">
          <Bot size={24} className="text-brand-primary animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono text-brand-primary uppercase font-bold animate-pulse">ALIGNED</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-brand-primary" />
              <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest italic">{t('dashboard.ai.briefing')}</span>
            </div>
            <button 
              onClick={fetchAnalysis}
              disabled={isLoading}
              className="text-text-muted hover:text-brand-primary transition-colors flex items-center gap-2"
            >
              <RefreshCcw size={10} className={cn(isLoading && "animate-spin")} />
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest">{isLoading ? t('dashboard.ai.analyzing') : t('dashboard.ai.refresh')}</span>
            </button>
          </div>
          
          <div className="relative">
             {isLoading && (
               <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="h-px bg-brand-primary/30 w-32 animate-pulse" />
               </div>
             )}
             <p className={cn(
               "text-xs font-mono font-bold text-text-primary lowercase leading-relaxed max-w-4xl",
               !analysis && "text-text-muted italic opacity-50"
             )}>
               {analysis || t('dashboard.ai.initializing')}
             </p>
          </div>
          
          <div className="flex items-center gap-4 border-t border-border-subtle pt-4">
             <div className="flex items-center gap-2">
                <Cpu size={10} className="text-text-muted" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase">{t('dashboard.ai.model')}: gemini-3-flash</span>
             </div>
             <div className="w-1 h-1 bg-zinc-800 rounded-full" />
             <span className="text-[8px] font-mono text-zinc-500 uppercase">{t('dashboard.ai.priority')}: {t('dashboard.ai.high_tactical')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function WeatherKPI() {
  const [weather, setWeather] = React.useState({
    temp: 24,
    precip: 12,
    wind: 14
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        temp: prev.temp + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2),
        precip: Math.max(0, Math.min(100, prev.precip + (Math.random() > 0.5 ? 5 : -5) * Math.random())),
        wind: Math.max(0, prev.wind + (Math.random() > 0.5 ? 2 : -2) * Math.random())
      }));
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  const { t } = useLanguage();
  return (
    <div className="bg-surface border border-border-subtle p-4 flex flex-col justify-between h-24 hover:border-brand-primary/40 transition-all group shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em] font-mono group-hover:text-text-primary transition-colors">{t('dashboard.kpi.weather')}</span>
        <div className="flex items-center gap-1">
           <div className="w-1 h-1 bg-emerald-500 rounded-full" />
           <span className="text-[7px] font-mono text-emerald-500 uppercase">Live</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-text-primary">
            <Thermometer size={14} className="text-brand-primary" />
            <span className="font-mono text-2xl font-black italic tracking-tighter">
              {weather.temp.toFixed(0)}°C
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <CloudRain size={10} className="text-text-muted" />
            <span className="text-[9px] font-mono font-bold text-text-primary">{weather.precip.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind size={10} className="text-text-muted" />
            <span className="text-[9px] font-mono font-bold text-text-primary">{weather.wind.toFixed(0)}KM/H</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchInput({ label, placeholder }: { label: string, placeholder: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full bg-background-muted border border-border-subtle py-2 px-3 text-[10px] font-mono text-text-primary placeholder:text-text-muted/40 outline-none focus:border-zinc-500 transition-all"
      />
    </div>
  );
}

interface IncidentItemProps {
  icon: React.ReactNode;
  title: string;
  time: string;
  description: string;
  severity: Incident['severity'];
  key?: React.Key;
}

function IncidentItem({ icon, title, time, description, severity }: IncidentItemProps) {
  const { t, language } = useLanguage();
  const [summary, setSummary] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSummarize = async () => {
    if (summary) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    const result = await summarizeIncident(description, language);
    setSummary(result);
    setIsLoading(false);
    setIsExpanded(true);
  };

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex gap-4 items-start">
        <div className={cn(
          "w-8 h-8 border flex items-center justify-center shrink-0 mt-0.5 transition-all group-hover:bg-brand-primary group-hover:text-white",
          severity === 'critical' ? 'bg-brand-primary/10 border-brand-primary/30' : 'bg-surface border-border-subtle'
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest truncate group-hover:text-brand-primary transition-colors">{title}</span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-text-muted font-bold uppercase">{time}</span>
              <button 
                onClick={handleSummarize}
                disabled={isLoading}
                className={cn(
                  "p-1 hover:bg-background-muted border border-transparent hover:border-border-subtle transition-all disabled:opacity-50 flex items-center gap-1",
                  summary ? "text-brand-primary" : "text-text-muted"
                )}
                title={t('dashboard.incident.summarize')}
              >
                {isLoading ? (
                  <>
                    <div className="w-2 h-2 border-b border-brand-primary rounded-full animate-spin" />
                    <span className="text-[7px] font-mono font-bold uppercase">{t('dashboard.incident.summarizing')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} />
                    {summary && <ChevronDown size={8} className={cn("transition-transform", isExpanded && "rotate-180")} />}
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[9px] text-text-muted uppercase tracking-tighter leading-relaxed italic font-light group-hover:text-text-primary transition-colors">{description}</p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && summary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-12 mt-1 p-3 bg-background-muted border-l-2 border-brand-primary/50 relative overflow-hidden group/summary">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot size={8} className="text-brand-primary" />
                <span className="text-[7px] font-bold text-brand-primary uppercase tracking-[0.2em]">{t('dashboard.incident.summary')}</span>
              </div>
              <p className="text-[9px] font-mono text-text-primary uppercase leading-tight font-bold italic">
                {summary}
              </p>
              
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute top-2 right-2 text-text-muted hover:text-brand-primary opacity-0 group-hover/summary:opacity-100 transition-opacity"
              >
                <ChevronUp size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
