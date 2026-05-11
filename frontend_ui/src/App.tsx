/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import IncidentLog from './pages/IncidentLog';
import VehicleSearch from './pages/VehicleSearch';
import TrafficAnalytics from './pages/TrafficAnalytics';
import LiveMonitoring from './pages/LiveMonitoring';
import MapCenter from './pages/MapCenter';
import ReportsExport from './pages/ReportsExport';
import { Card } from './components/common/Card';
import { useLanguage } from './context/LanguageContext';

// Tactical Placeholder component for other pages
const Placeholder = ({ name, icon: Icon }: { name: string, icon?: any }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-text-primary uppercase tracking-[0.3em] font-mono italic">
          {name}
        </h1>
        <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
          {t('placeholder.secure_net')} // {t('placeholder.node_id')}: {Math.random().toString(36).substring(7).toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card title={t('placeholder.system_status')} subtitle="Real-time Module Diagnostic" className="md:col-span-2">
          <div className="p-12 flex flex-col items-center justify-center text-text-muted space-y-6 bg-surface min-h-[400px]">
             <div className="relative">
                <div className="w-16 h-16 border border-border-subtle rotate-45 flex items-center justify-center animate-pulse">
                   <div className="w-12 h-12 border border-brand-primary/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-brand-primary rotate-45" />
                   </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-24 border border-dashed border-border-subtle/30 rounded-full animate-[spin_10s_linear_infinite]" />
                </div>
             </div>
             
             <div className="text-center space-y-2">
               <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-[0.4em]">{name} / {t('placeholder.initialization')}</h2>
               <p className="text-[9px] font-mono uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                 This functional module is currently being synchronized with the primary Traffic Operations network. 
                 {t('placeholder.standby')}
               </p>
             </div>

             <div className="flex gap-4">
                <div className="w-20 h-1 bg-border-subtle">
                   <div className="w-1/3 h-full bg-brand-primary animate-[loading_2s_ease-in-out_infinite]" />
                </div>
             </div>
          </div>
        </Card>

        <div className="space-y-8">
           <Card title={t('placeholder.neural_logs')} subtitle="Event Stream">
              <div className="p-6 space-y-4 bg-surface h-[400px] overflow-hidden opacity-50">
                 {[1,2,3,4,5].map(i => (
                    <div key={i} className="space-y-1">
                       <div className="flex justify-between items-center text-[7px] font-mono">
                          <span className="text-brand-primary">LOG {Math.random().toString(36).substring(7).toUpperCase()}</span>
                          <span className="text-text-muted">0.00{i}s</span>
                       </div>
                       <div className="h-0.5 bg-border-subtle w-full" />
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

import { LocationProvider } from './context/LocationContext';

export default function App() {
  const { t } = useLanguage();
  return (
    <LocationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="live-monitoring" element={<LiveMonitoring />} />
            <Route path="violations" element={<IncidentLog />} />
            <Route path="vehicle-search" element={<VehicleSearch />} />
            <Route path="analytics" element={<TrafficAnalytics />} />
            <Route path="map-center" element={<MapCenter />} />
            <Route path="reports" element={<ReportsExport />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LocationProvider>
  );
}
