import React from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ChevronRight,
  Shield,
  Activity,
  FileText
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../utils/utils';

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

interface Incident {
  id: string;
  type: string;
  severity: 'Critical' | 'Elevated' | 'Nominal';
  location: string;
  timestamp: string;
  status: 'Resolved' | 'Active' | 'Pending';
  node: string;
  operator: string;
}

export default function IncidentLog() {
  const { t } = useLanguage();
  const { currentUser } = useUser();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'incidents'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          // Handle timestamp conversion
          timestamp: docData.timestamp?.toDate ? docData.timestamp.toDate().toLocaleString() : docData.timestamp,
          operator: docData.operatorId || 'SYSTEM'
        } as Incident;
      });
      setIncidents(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'incidents');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredIncidents = incidents.filter(inc => 
    inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
            {t('incident.log_protocol')} // {t('nav.violations')}
          </h1>
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
            {t('incident.central_archive')} // {t('incident.access_secure')}
          </p>
        </div>

        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle hover:border-brand-primary/40 transition-all text-text-muted hover:text-text-primary group">
              <Download size={14} className="group-hover:text-brand-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('incident.export_manifest')}</span>
           </button>
           <div className="h-8 w-px bg-border-subtle/50" />
           <div className="flex items-center gap-2 text-brand-primary font-mono text-[10px]">
              <Shield size={12} className="animate-pulse" />
              <span className="uppercase tracking-widest font-bold">{t('incident.encrypted_conn')}</span>
           </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors">
            <Search size={14} />
          </div>
          <input 
            type="text"
            placeholder={t('incident.search_placeholder')}
            className="w-full bg-surface border border-border-subtle px-12 py-3 rounded-none text-[10px] font-mono text-text-primary outline-none focus:border-brand-primary/30 transition-all placeholder:text-text-muted/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <FilterToggle icon={<AlertTriangle size={12}/>} label={t('incident.filter_critical')} active />
          <FilterToggle icon={<Clock size={12}/>} label={t('incident.filter_recent')} />
          <FilterToggle icon={<MapPin size={12}/>} label={t('incident.filter_node')} />
        </div>
      </div>

      {/* Main Grid */}
      <Card title={t('incident.event_history')} subtitle={t('incident.audit_trail')}>
        <div className="overflow-x-auto bg-surface">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted font-mono animate-pulse uppercase tracking-widest text-[10px]">
              {t('incident.sync_archive')}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-6 py-4 text-left text-[8px] font-bold text-text-muted uppercase tracking-[0.4em]">{t('incident.table.id')}</th>
                  <th className="px-6 py-4 text-left text-[8px] font-bold text-text-muted uppercase tracking-[0.4em]">{t('incident.table.type')}</th>
                  <th className="px-6 py-4 text-left text-[8px] font-bold text-text-muted uppercase tracking-[0.4em]">{t('incident.table.location')}</th>
                  <th className="px-6 py-4 text-center text-[8px] font-bold text-text-muted uppercase tracking-[0.4em]">{t('incident.table.timestamp')}</th>
                  <th className="px-6 py-4 text-center text-[8px] font-bold text-text-muted uppercase tracking-[0.4em]">{t('incident.table.operator')}</th>
                  <th className="px-6 py-4 text-right text-[8px] font-bold text-text-muted uppercase tracking-[0.4em]">{t('incident.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-mono">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted uppercase text-[10px] tracking-widest">
                      {t('incident.no_records')}
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-background-muted transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-brand-primary tracking-tighter">{incident.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-1.5 h-1.5 rotate-45 transition-all group-hover:scale-150",
                            incident.severity === 'Critical' ? "bg-brand-error" : 
                            incident.severity === 'Elevated' ? "bg-brand-primary" : "bg-brand-success"
                          )} />
                          <span className="text-[10px] text-text-primary uppercase font-bold">{incident.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-primary uppercase">{incident.location}</span>
                          <span className="text-[7px] text-text-muted tracking-widest">{incident.node}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[9px] text-text-muted">{incident.timestamp}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[9px] text-text-primary border border-border-subtle px-2 py-0.5 bg-background-muted">{incident.operator}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <Badge variant={
                              incident.status === 'Resolved' ? 'success' : 
                              incident.status === 'Active' ? 'error' : 'neutral'
                            }>
                              {incident.status}
                           </Badge>
                           <ChevronRight size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-border-subtle flex justify-between items-center bg-background-muted">
           <span className="text-[8px] font-mono text-text-muted uppercase tracking-widest">{t('incident.page')} 01 // 42 {t('incident.entries_displayed')}</span>
           <div className="flex gap-1">
              {[1, 2, 3].map(p => (
                <button key={p} className={cn(
                  "w-6 h-6 flex items-center justify-center text-[10px] font-bold border transition-all",
                  p === 1 ? "bg-brand-primary border-brand-primary text-white" : "border-border-subtle text-text-muted hover:border-brand-primary/40"
                )}>
                  {p}
                </button>
              ))}
           </div>
        </div>
      </Card>

      {/* Background Decor */}
      <div className="fixed top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none text-right">
        <Activity size={400} className="text-brand-primary" />
        <div className="text-6xl font-black uppercase tracking-[0.3em] font-mono">INCIDENT DB</div>
      </div>
    </div>
  );
}

function FilterToggle({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "px-3 py-2 border transition-all flex items-center gap-2 rounded-none group",
      active 
        ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(255,62,0,0.15)]" 
        : "bg-surface border-border-subtle text-text-muted hover:border-brand-primary/40"
    )}>
      <span className={cn("transition-transform group-active:scale-95", active ? "text-brand-primary" : "text-text-muted group-hover:text-brand-primary")}>
        {icon}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
