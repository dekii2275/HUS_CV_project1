import React from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Database, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../utils/utils';
import { TacticalDatePicker } from '../components/common/TacticalDatePicker';
import { isAfter } from 'date-fns';

const RECENT_REPORTS = [
  { id: 'REP_4482', name: 'Weekly Traffic Volume (Cluster Z)', date: '2026-04-28', size: '2.4 MB', type: 'PDF' },
  { id: 'REP_4481', name: 'Violation Summary (April 2026)', date: '2026-04-25', size: '1.8 MB', type: 'CSV' },
  { id: 'REP_4480', name: 'Infrastructure Audit: Bridge A1', date: '2026-04-22', size: '12.2 MB', type: 'ZIP' },
  { id: 'REP_4479', name: 'Operator Efficiency Metrics', date: '2026-04-20', size: '840 KB', type: 'PDF' },
  { id: 'REP_4478', name: 'Neural Model Confidence Log', date: '2026-04-18', size: '4.1 MB', type: 'LOG' },
];

export default function ReportsExport() {
  const { t } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | null>(new Date());
  const [toDate, setToDate] = React.useState<Date | null>(new Date());

  // Ensure toDate is always >= fromDate if fromDate changes
  React.useEffect(() => {
    if (fromDate && toDate && isAfter(fromDate, toDate)) {
      setToDate(fromDate);
    }
  }, [fromDate, toDate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
            {t('reports.manifest_archive')} // {t('nav.reports')}
          </h1>
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
            {t('reports.sync_export')} // SECURE ISO 27001
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 border border-brand-success/30 bg-brand-success/5 text-brand-success font-mono text-[10px] font-bold">
              <ShieldCheck size={14} />
              <span className="uppercase tracking-widest tracking-tighter">{t('reports.integrity_verified')}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Builder */}
        <div className="lg:col-span-1 space-y-6">
           <Card title={t('reports.generator')} subtitle={t('reports.config_manifest')}>
              <div className="p-6 space-y-6 bg-surface">
                 <div className="space-y-2">
                    <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{t('reports.template')}</label>
                    <select className="w-full bg-background-muted border border-border-subtle px-4 py-3 text-[10px] font-mono text-text-primary uppercase outline-none focus:border-brand-primary appearance-none">
                       <option>{t('reports.template_full')}</option>
                       <option>{t('reports.template_incident')}</option>
                       <option>{t('reports.template_velocity')}</option>
                       <option>{t('reports.template_asset')}</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{t('reports.temporal_range')}</label>
                    <div className="grid grid-cols-2 gap-4">
                       <TacticalDatePicker 
                        label={t('reports.from')} 
                        selectedDate={fromDate} 
                        onChange={setFromDate} 
                       />
                       <TacticalDatePicker 
                        label={t('reports.to')} 
                        selectedDate={toDate} 
                        onChange={setToDate}
                        minDate={fromDate}
                        align="right"
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{t('reports.output_params')}</label>
                    <div className="space-y-2">
                       <Checkbox label={t('reports.param_raw')} />
                       <Checkbox label={t('reports.param_neural')} active />
                       <Checkbox label={t('reports.param_relational')} active />
                    </div>
                 </div>

                 <button className="w-[252px] h-[35px] bg-brand-primary text-white text-[9px] leading-[16px] font-bold uppercase tracking-[0.4em] hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[0_5px_15px_rgba(255,62,0,0.2)] mx-auto">
                    <FileText size={14} />
                    {t('reports.compile')}
                 </button>
              </div>
           </Card>

           <Card title={t('reports.data_export')} subtitle={t('reports.db_dump')}>
              <div className="p-6 bg-background-muted border border-border-subtle font-mono text-center space-y-4">
                 <Database size={24} className="mx-auto text-text-muted/40" />
                 <p className="text-[9px] text-text-muted uppercase tracking-widest leading-relaxed">
                    {t('reports.db_request')}
                 </p>
                 <button className="text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-widest tracking-tighter">
                    {t('reports.db_access')}
                 </button>
              </div>
           </Card>
        </div>

        {/* Archives */}
        <div className="lg:col-span-2 space-y-6">
           <Card title={t('reports.archives')} subtitle={t('reports.secure_repo')}>
              <div className="bg-surface">
                 <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-muted/30">
                    <div className="relative group flex-1 max-w-sm">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                       <input type="text" placeholder={t('reports.filter_name')} className="w-full bg-surface border border-border-subtle pl-10 pr-4 py-2 text-[9px] font-mono text-text-primary outline-none focus:border-brand-primary" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold text-text-muted hover:text-brand-primary border border-border-subtle transition-all uppercase tracking-widest tracking-tighter">
                       <Filter size={12} />
                       {t('reports.sort_date')}
                    </button>
                 </div>

                 <div className="divide-y divide-border-subtle/50">
                    {RECENT_REPORTS.map((report) => (
                      <div key={report.id} className="p-5 hover:bg-background-muted transition-all group flex items-center gap-6 cursor-pointer">
                         <div className="w-12 h-12 bg-background-muted border border-border-subtle flex items-center justify-center relative flex-shrink-0">
                            <FileText size={20} className="text-text-muted/40 group-hover:text-brand-primary transition-colors" />
                            <div className="absolute -bottom-1 -right-1 bg-surface text-[6px] font-bold font-mono text-text-muted px-1 border border-border-subtle">{report.type}</div>
                         </div>

                         <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3">
                               <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-widest group-hover:text-brand-primary transition-colors">{report.name}</h4>
                               <div className="flex items-center gap-1 text-[8px] font-mono text-brand-success bg-brand-success/5 px-2 py-0.5 border border-brand-success/20">
                                  <CheckCircle2 size={10} />
                                  <span>{t('reports.verified')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[8px] font-mono text-text-muted uppercase tracking-tighter tracking-widest">
                               <span className="flex items-center gap-1"><Clock size={10}/> {report.date}</span>
                               <span className="p-0.5 bg-background-muted border border-border-subtle rounded-none">{report.size}</span>
                               <span>{report.id}</span>
                            </div>
                         </div>

                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                            <button className="p-2 border border-border-subtle hover:border-brand-primary text-text-muted hover:text-brand-primary bg-surface transition-all">
                               <Download size={14} />
                            </button>
                            <button className="p-2 border border-border-subtle hover:border-zinc-500 text-text-muted hover:text-text-primary bg-surface transition-all">
                               <MoreVertical size={14} />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="p-4 border-t border-border-subtle bg-background-muted/30 flex justify-center">
                    <button className="flex items-center gap-2 text-[9px] font-bold text-text-muted hover:text-brand-primary transition-colors uppercase tracking-[0.2em]">
                       {t('reports.view_all')}
                       <ExternalLink size={12} />
                    </button>
                 </div>
              </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 
                INTERNAL_SECURITY_VERIFICATION:
                SHA256: 8C27E5A5B6B4D6F4E8D6B4D6F4E8D6B4D6F4E8D6B4D6F4E8
              */}
              <div className="p-6 border border-dashed border-border-subtle opacity-30 font-mono text-[8px] uppercase tracking-widest flex flex-col justify-center items-center gap-2">
                 <p className="font-bold text-text-primary">{t('reports.sync_status')}</p>
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                       <div className="w-1.5 h-1.5 bg-brand-success rotate-45" />
                       <span>{t('reports.primary')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                       <div className="w-1.5 h-1.5 bg-brand-success rotate-45" />
                       <span>{t('reports.secondary')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-brand-primary animate-pulse">
                       <div className="w-1.5 h-1.5 bg-brand-primary rotate-45" />
                       <span>{t('reports.neural')}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <button className="flex items-center gap-3 group w-full text-left">
       <div className={cn(
         "w-4 h-4 border flex items-center justify-center transition-all",
         active ? "bg-brand-primary border-brand-primary" : "border-border-subtle group-hover:border-zinc-500"
       )}>
          {active && <CheckCircle2 size={10} className="text-black" />}
       </div>
       <span className={cn("text-[10px] font-mono tracking-widest uppercase tracking-tighter", active ? "text-text-primary" : "text-text-muted group-hover:text-text-primary")}>
          {label}
       </span>
    </button>
  );
}
