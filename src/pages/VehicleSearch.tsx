import React from 'react';
import { 
  Search, 
  Car, 
  Fingerprint, 
  Camera, 
  Palette, 
  Tag, 
  History, 
  ChevronRight,
  ShieldCheck,
  Scan,
  Database
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

interface VehicleResult {
  plate: string;
  type: string;
  make: string;
  model: string;
  color: string;
  lastSeen: string;
  location: string;
  confidence: number;
}

interface RecentQuery {
  id: string;
  type: 'PLATE' | 'VIN';
  value: string;
  timestamp: number;
}

const MOCK_RESULTS: VehicleResult[] = [
  { plate: 'ABC-1234', type: 'SEDAN', make: 'TOYOTA', model: 'CAMRY', color: 'NAVY', lastSeen: '14:22:10', location: 'NODE W11', confidence: 98.4 },
  { plate: 'XYZ-9988', type: 'SUV', make: 'FORD', model: 'EXPLORER', color: 'BLACK', lastSeen: '13:55:00', location: 'NODE C04', confidence: 94.2 },
  { plate: 'FAST-01', type: 'SPORTS', make: 'PORSCHE', model: '911', color: 'CRIMSON', lastSeen: '13:12:44', location: 'NODE E01', confidence: 99.1 },
  { plate: 'TRK-772', type: 'TRUCK', make: 'VOLVO', model: 'FH16', color: 'WHITE', lastSeen: '12:30:15', location: 'NODE S12', confidence: 88.7 },
  { plate: 'VAN-44A', type: 'VAN', make: 'MERCEDES', model: 'SPRINTER', color: 'GRAY', lastSeen: '11:55:00', location: 'NODE W03', confidence: 92.5 },
];

import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { useUser } from '../context/UserContext';

export default function VehicleSearch() {
  const { t } = useLanguage();
  const { currentUser } = useUser();
  const [isScanning, setIsScanning] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState('ALL TYPES');
  const [plateQuery, setPlateQuery] = React.useState('');
  const [vinQuery, setVinQuery] = React.useState('');
  const [vinError, setVinError] = React.useState<string | null>(null);
  const [filteredResults, setFilteredResults] = React.useState<VehicleResult[]>([]);
  const [recentQueries, setRecentQueries] = React.useState<RecentQuery[]>([]);

  React.useEffect(() => {
    const savedHeaders = localStorage.getItem('vehicle_queries');
    if (savedHeaders) {
      try {
        setRecentQueries(JSON.parse(savedHeaders));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveQuery = (type: 'PLATE' | 'VIN', value: string) => {
    if (!value) return;
    setRecentQueries(prev => {
      const filtered = prev.filter(q => !(q.type === type && q.value === value));
      const newItem: RecentQuery = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        value: value.toUpperCase(),
        timestamp: Date.now()
      };
      const updated = [newItem, ...filtered].slice(0, 5);
      localStorage.setItem('vehicle_queries', JSON.stringify(updated));
      return updated;
    });
  };

  const validateVin = (vin: string) => {
    if (!vin) return true;
    // Standard VIN: 17 characters, no I, O, Q
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinRegex.test(vin);
  };

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setVinQuery(value);
    if (value && !validateVin(value)) {
      setVinError("INVALID VIN FORMAT: REQUIRES 17 CHARACTERS (EXCL. I, O, Q)");
    } else {
      setVinError(null);
    }
  };

  React.useEffect(() => {
    // Initial load: show mock or leave empty? 
    // Let's show mock results initially if both queries are empty
    if (!plateQuery && !vinQuery) {
      setFilteredResults(MOCK_RESULTS);
    }
  }, [plateQuery, vinQuery]);

  const handleSearch = async () => {
    if (!currentUser) return;
    
    setIsScanning(true);
    
    try {
      if (plateQuery) saveQuery('PLATE', plateQuery);
      if (vinQuery) saveQuery('VIN', vinQuery);

      let fsResults: VehicleResult[] = [];

      // 1. Search in Firestore Violations
      if (plateQuery || vinQuery) {
        let vQuery;
        if (plateQuery) {
          vQuery = query(
            collection(db, 'violations'),
            where('plate', '==', plateQuery.toUpperCase()),
            limit(10)
          );
        } else {
          vQuery = query(
            collection(db, 'violations'),
            where('vin', '==', vinQuery.toUpperCase()),
            limit(10)
          );
        }
        
        const vSnapshot = await getDocs(vQuery).catch(err => {
          handleFirestoreError(err, OperationType.GET, 'violations');
          throw err;
        });

        fsResults = vSnapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            plate: data.plate || 'N/A',
            type: data.type || 'DETECTED',
            make: data.make || 'UNKNOWN',
            model: data.model || 'DETECTED UNIT',
            color: data.color || 'N/A',
            lastSeen: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString() : 'RECENT',
            location: data.location || 'UNKNOWN',
            confidence: data.confidence || 0
          } as VehicleResult;
        });
      }

      // 2. Fallback/Combine with local filtering
      const mockMatches = MOCK_RESULTS.filter(v => {
        const matchesType = selectedType === 'ALL TYPES' || v.type === selectedType;
        const matchesPlate = !plateQuery || v.plate.toLowerCase().includes(plateQuery.toLowerCase());
        // For mock data, we don't have VIN, so we just match plate/type
        return matchesType && matchesPlate;
      });

      setFilteredResults([...fsResults, ...mockMatches]);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
            {t('vehicle.neural_identity')} // {t('nav.vehicle-search')}
          </h1>
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
            {t('vehicle.registry_cross')} // {t('vehicle.db_status')}: {t('vehicle.synchronized')}
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-brand-primary font-mono text-[10px] bg-brand-primary/5 px-4 py-2 border border-brand-primary/20">
              <Database size={12} className="animate-pulse" />
              <span className="uppercase tracking-widest font-bold">1.2M {t('vehicle.records_online')}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Search Parameters */}
        <aside className="lg:col-span-1 space-y-6">
          <Card title={t('vehicle.query_params')} subtitle={t('vehicle.neural_filters')}>
            <div className="p-6 space-y-6 bg-surface">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{t('vehicle.plate_number')}</label>
                  <div className="relative group">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary" size={14} />
                    <input 
                      type="text" 
                      placeholder="E.G. ABC-1234"
                      value={plateQuery}
                      onChange={(e) => setPlateQuery(e.target.value)}
                      className="w-full bg-background-muted border border-border-subtle pl-10 pr-4 py-3 text-[10px] font-mono text-text-primary uppercase outline-none focus:border-brand-primary/30" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{t('vehicle.vin_number')}</label>
                  <div className="relative group">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary" size={14} />
                    <input 
                      type="text" 
                      placeholder="VEHICLE IDENTIFICATION NO."
                      value={vinQuery}
                      onChange={handleVinChange}
                      className={cn(
                        "w-full bg-background-muted border pl-10 pr-4 py-3 text-[10px] font-mono text-text-primary uppercase outline-none transition-all",
                        vinError ? "border-brand-primary/50 focus:border-brand-primary" : "border-border-subtle focus:border-brand-primary/30"
                      )}
                    />
                  </div>
                  {vinError && (
                    <div className="text-[7px] text-brand-primary font-bold font-mono animate-pulse uppercase tracking-tighter italic">
                      {vinError}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{t('vehicle.type')}</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-background-muted border border-border-subtle px-4 py-3 text-[10px] font-mono text-text-primary uppercase outline-none focus:border-brand-primary/30 appearance-none"
                >
                  <option value="ALL TYPES">ALL TYPES</option>
                  <option value="SEDAN">SEDAN</option>
                  <option value="SUV">SUV</option>
                  <option value="TRUCK">TRUCK</option>
                  <option value="MOTORCYCLE">MOTORCYCLE</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="VAN">VAN</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{t('vehicle.color_match')}</label>
                <div className="grid grid-cols-4 gap-2">
                   {['bg-zinc-900', 'bg-zinc-100', 'bg-blue-900', 'bg-red-700'].map((color, i) => (
                     <button key={i} className={cn("w-full h-8 border border-border-subtle hover:border-brand-primary/50 transition-all", color)} />
                   ))}
                </div>
              </div>

              <button 
                onClick={handleSearch}
                disabled={isScanning || !!vinError}
                className="w-full py-4 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isScanning ? <Scan size={14} className="animate-spin" /> : <Search size={14} />}
                {isScanning ? t('vehicle.scanning') : t('vehicle.execute_search')}
              </button>
            </div>
          </Card>

          <Card title={t('vehicle.recent_logs')} subtitle={t('vehicle.neural_history')}>
            <div className="p-6 space-y-4 bg-surface font-mono">
               <div className="flex items-center justify-between text-brand-primary uppercase text-[8px] font-bold tracking-widest">
                  <div className="flex items-center gap-2">
                    <History size={10} />
                    <span>{t('dashboard.search_history')}</span>
                  </div>
                  {recentQueries.length > 0 && (
                    <button 
                      onClick={() => {
                        setRecentQueries([]);
                        localStorage.removeItem('vehicle_queries');
                      }}
                      className="text-text-muted hover:text-brand-primary transition-colors text-[7px]"
                    >
                      {t('vehicle.flush_cache')}
                    </button>
                  )}
               </div>
               <div className="space-y-2">
                  {recentQueries.length > 0 ? (
                    recentQueries.map((q) => (
                      <button 
                        key={q.id}
                        onClick={() => {
                          if (q.type === 'PLATE') {
                            setPlateQuery(q.value);
                            setVinQuery('');
                          } else {
                            setVinQuery(q.value);
                            setPlateQuery('');
                          }
                        }}
                        className="w-full text-left group"
                      >
                        <div className="text-[9px] text-text-muted group-hover:text-text-primary transition-colors border-b border-border-subtle/30 pb-1 flex justify-between items-center bg-background-muted/50 px-2 py-1.5 hover:bg-brand-primary/5">
                          <span className="flex items-center gap-2">
                            {q.type === 'PLATE' ? <Tag size={8} /> : <Fingerprint size={8} />}
                            {q.value}
                          </span>
                          <Search size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-[8px] text-text-muted italic opacity-50 uppercase text-center py-4 border border-dashed border-border-subtle">
                      {t('vehicle.no_logs')}
                    </div>
                  )}
               </div>
            </div>
          </Card>
        </aside>

        {/* Search Results */}
        <div className="lg:col-span-3 space-y-6">
          <Card title={t('vehicle.registry_results')} subtitle={`${filteredResults.length} ${t('vehicle.matches')}`}>
             <div className="bg-surface">
                {isScanning ? (
                  <div className="p-20 flex flex-col items-center justify-center space-y-6">
                    <div className="relative w-32 h-32 border border-brand-primary/20 rotate-45 flex items-center justify-center">
                       <div className="absolute inset-0 border border-brand-primary/10 scale-125 animate-pulse" />
                       <Scan size={32} className="text-brand-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-mono text-brand-primary font-bold animate-pulse">{t('vehicle.optimizing')}</p>
                      <p className="text-[8px] font-mono text-text-muted mt-2 uppercase tracking-widest">{t('vehicle.accessing_db')} // Partition 0x442</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle/50">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((v, i) => (
                        <div key={i} className="p-6 hover:bg-background-muted transition-all cursor-pointer group flex items-center gap-8">
                           <div className="relative flex-shrink-0">
                             <div className="w-24 h-16 bg-zinc-900 border border-border-subtle overflow-hidden relative">
                                <div className="absolute inset-0 bg-brand-primary/5 flex items-center justify-center">
                                  <Car size={24} className="text-text-muted/20" />
                                </div>
                                <div className="absolute top-0 right-0 p-1">
                                  <div className="text-[6px] text-brand-primary font-bold bg-brand-primary/10 px-1 border border-brand-primary/20">{v.confidence}% {t('vehicle.matches').slice(0, -1)}</div>
                                </div>
                                <div className="absolute bottom-1 left-2 h-0.5 bg-brand-primary w-2/3 animate-[loading_3s_linear_infinite]" />
                             </div>
                             <div className="absolute -top-3 -left-3 text-brand-primary font-black opacity-20 text-4xl font-mono select-none">
                                0{i+1}
                             </div>
                          </div>

                          <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-6 font-mono">
                             <div className="space-y-1">
                                <span className="text-[7px] text-brand-primary font-bold uppercase tracking-widest">{t('dashboard.table.plate')}</span>
                                <div className="text-sm font-black text-text-primary tracking-tighter">{v.plate}</div>
                             </div>
                             <div className="space-y-2">
                                <span className="text-[7px] text-text-muted uppercase tracking-widest">{t('vehicle.manufacturer')}</span>
                                <div className="flex items-center gap-1">
                                  <Tag size={8} className="text-brand-primary" />
                                  <span className="text-[10px] font-black text-text-primary uppercase tracking-tighter">{v.make}</span>
                                </div>
                                <div className="text-[8px] text-text-muted tracking-widest uppercase">{v.model}</div>
                             </div>
                             <div className="space-y-2">
                                <span className="text-[7px] text-text-muted uppercase tracking-widest">{t('vehicle.visual_spec')}</span>
                                <div className="flex items-center gap-1">
                                  <Palette size={8} className="text-brand-primary" />
                                  <span className="text-[10px] font-black text-text-primary uppercase tracking-tighter">{v.color}</span>
                                </div>
                                <div className="text-[8px] text-text-muted tracking-widest uppercase">{v.type}</div>
                             </div>
                             <div className="space-y-1">
                                <span className="text-[7px] text-text-muted uppercase tracking-widest">{t('vehicle.last_telemetric')}</span>
                                <div className="text-[10px] font-bold text-text-primary tracking-tighter">{v.lastSeen}</div>
                                <div className="text-[8px] text-brand-primary font-bold tracking-widest">{v.location}</div>
                             </div>
                             <div className="flex items-center justify-end">
                                <div className="flex flex-col items-end mr-4">
                                   <span className="text-[6px] text-text-muted uppercase">Confidence</span>
                                   <span className="text-[10px] font-black text-brand-primary">{v.confidence}%</span>
                                </div>
                                <button className="h-10 w-10 flex items-center justify-center bg-surface border border-border-subtle group-hover:border-brand-primary/40 text-text-muted group-hover:text-brand-primary transition-all rounded-none hover:bg-brand-primary/5">
                                   <ChevronRight size={16} />
                                </button>
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-20 text-center">
                        <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{t('vehicle.no_matches')}</p>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </Card>

          {/* AI Insight Footer */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 font-mono flex items-center gap-6">
             <div className="p-3 bg-brand-primary/10 text-brand-primary">
                <Fingerprint size={20} />
             </div>
             <div className="flex-1">
                <p className="text-[9px] text-brand-primary font-bold uppercase tracking-[0.2em] mb-1">{t('vehicle.predictive_analysis')}</p>
                <p className="text-[10px] text-zinc-400 uppercase leading-relaxed">
                   AI detects recurring pattern for plate <span className="text-zinc-100">XYZ-9988</span>. Frequent presence on <span className="text-brand-primary">NODE_C04</span> between 13:00 - 15:00 UTC. Flag for observational audit.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
