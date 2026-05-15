import React from 'react';
import { 
  BarChart3, 
  Camera, 
  Gavel, 
  Search, 
  LayoutDashboard, 
  Map as MapIcon, 
  FileText, 
  Settings,
  HelpCircle,
  Bot
} from 'lucide-react';
import { Page } from './types';

export const NAVIGATION_ITEMS = [
  { id: Page.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: Page.LIVE_MONITORING, label: 'Live Monitoring', icon: Camera },
  { id: Page.VIOLATIONS, label: 'Violations', icon: Gavel },
  { id: Page.VEHICLE_SEARCH, label: 'Vehicle Search', icon: Search },
  { id: Page.ANALYTICS, label: 'Analytics', icon: BarChart3 },
  { id: Page.MAP_CENTER, label: 'Map Center', icon: MapIcon },
  { id: Page.REPORTS, label: 'Reports', icon: FileText },
  { id: Page.SETTINGS, label: 'Settings', icon: Settings },
];

export const FOOTER_NAVIGATION = [
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'copilot', label: 'AI Copilot', icon: Bot },
];
