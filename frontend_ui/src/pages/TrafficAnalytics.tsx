import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Layers,
  Zap
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../utils/utils';

const VOLUME_DATA = [
  { time: '00:00', volume: 420 },
  { time: '04:00', volume: 280 },
  { time: '08:00', volume: 1250 },
  { time: '12:00', volume: 980 },
  { time: '16:00', volume: 1450 },
  { time: '20:00', volume: 720 },
  { time: '23:59', volume: 480 },
];

const VEHICLE_MIX = [
  { name: 'Sedans', value: 45 },
  { name: 'SUVs', value: 25 },
  { name: 'Trucks', value: 20 },
  { name: 'Motorcycles', value: 10 },
];

const PREDICTIVE_DATA = [
  { day: 'Mon', actual: 4000, predict: 4200 },
  { day: 'Tue', actual: 3000, predict: 3100 },
  { day: 'Wed', actual: 2000, predict: 2400 },
  { day: 'Thu', actual: 2780, predict: 2600 },
  { day: 'Fri', actual: 1890, predict: 2000 },
  { day: 'Sat', actual: 2390, predict: 2200 },
  { day: 'Sun', actual: 3490, predict: 3300 },
];

const COLORS = ['#FF3E00', '#FF5E20', '#FF7D40', '#FF9D60'];

export default function TrafficAnalytics() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
            {t('analytics.neural_metrics')} // {t('nav.analytics')}
          </h1>
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
            {t('analytics.op_intel')} // CYCLE ID: 0x88F2
          </p>
        </div>

        <div className="flex gap-4">
           <div className="px-4 py-2 border border-border-subtle bg-surface flex items-center gap-3">
              <Zap size={14} className="text-brand-primary" />
              <div className="flex flex-col">
                 <span className="text-[7px] font-bold text-text-muted uppercase tracking-widest">{t('analytics.network_load')}</span>
                 <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-tighter">92.4% / NOMINAL</span>
              </div>
           </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsKPI title={t('analytics.avg_velocity')} value="64.2 KM/H" trend="+4.2%" up />
        <AnalyticsKPI title={t('analytics.traffic_density')} value="1.45 VEH/M" trend="-2.1%" />
        <AnalyticsKPI title={t('analytics.incident_rate')} value="0.04%" trend="STABLE" neutral />
        <AnalyticsKPI title={t('analytics.system_latency')} value="12ms" trend="-18%" up />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Volume Chart */}
        <div className="lg:col-span-2">
          <Card title={t('analytics.network_volume')} subtitle={t('analytics.temporal_dist')}>
            <div className="p-8 h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={VOLUME_DATA}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3E00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF3E00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="currentColor" 
                    strokeOpacity={0.4}
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'currentColor', fontFamily: 'monospace', opacity: 0.5 }}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    strokeOpacity={0.4}
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'currentColor', fontFamily: 'monospace', opacity: 0.5 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-primary)'
                    }}
                    itemStyle={{ color: 'var(--color-brand-primary)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#FF3E00" 
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Vehicle Classification */}
        <div className="lg:col-span-1">
          <Card title={t('analytics.vehicle_mix')} subtitle={t('analytics.classification')}>
            <div className="p-8 h-[400px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="250">
                <PieChart>
                  <Pie
                    data={VEHICLE_MIX}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {VEHICLE_MIX.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', fontSize: '10px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                 {VEHICLE_MIX.map((v, i) => (
                   <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: COLORS[i] }} />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-text-primary uppercase tracking-widest">{v.name}</span>
                         <span className="text-[7px] font-mono text-text-muted">{v.value}%</span>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Predictive Analytics */}
        <div className="lg:col-span-3">
          <Card title={t('analytics.predictive_models')} subtitle={t('analytics.synthetic_forecasts')}>
            <div className="p-8 h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PREDICTIVE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="currentColor" 
                    strokeOpacity={0.4}
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'currentColor', fontFamily: 'monospace', opacity: 0.5 }}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    strokeOpacity={0.4}
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'currentColor', fontFamily: 'monospace', opacity: 0.5 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', fontSize: '10px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#FF3E00" 
                    strokeWidth={2} 
                    dot={{ r: 2, fill: '#FF3E00' }} 
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predict" 
                    stroke="#555" 
                    strokeWidth={1} 
                    strokeDasharray="5 5" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="fixed bottom-24 left-12 pointer-events-none opacity-[0.02] select-none">
        <Layers size={500} className="text-brand-primary" />
        <div className="text-6xl font-black uppercase tracking-[0.5em] font-mono -mt-12">DEEP ANALYTICS</div>
      </div>
    </div>
  );
}

function AnalyticsKPI({ title, value, trend, up = false, neutral = false }: { title: string, value: string, trend: string, up?: boolean, neutral?: boolean }) {
  return (
    <div className="bg-surface border border-border-subtle p-6 hover:border-brand-primary/40 transition-all group relative overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#FF3E00 1px, transparent 0)', backgroundSize: '10px 10px' }} />
      
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em] font-mono group-hover:text-brand-primary transition-colors">{title}</span>
          <Activity size={10} className="text-text-muted opacity-30" />
        </div>
        
        <div className="flex items-end justify-between">
          <div className="text-xl font-mono font-black text-text-primary tracking-tighter uppercase italic">{value}</div>
          <div className={cn(
            "flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-widest",
            neutral ? "text-text-muted" : up ? "text-brand-success" : "text-brand-error"
          )}>
            {neutral ? null : up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend}
          </div>
        </div>

        <div className="h-[2px] bg-border-subtle w-full rounded-full overflow-hidden">
           <div className={cn(
             "h-full bg-brand-primary transition-all duration-1000",
             `w-[${Math.floor(Math.random() * 60) + 20}%]`
           )} />
        </div>
      </div>
    </div>
  );
}
