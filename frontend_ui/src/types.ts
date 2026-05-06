/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Page {
  DASHBOARD = 'dashboard',
  LIVE_MONITORING = 'live-monitoring',
  VIOLATIONS = 'violations',
  VEHICLE_SEARCH = 'vehicle-search',
  ANALYTICS = 'analytics',
  MAP_CENTER = 'map-center',
  REPORTS = 'reports',
  SETTINGS = 'settings',
}

export interface Incident {
  id: string;
  type: string;
  location: string;
  time: string;
  description: string;
  severity: 'critical' | 'elevated' | 'normal';
  x: number;
  y: number;
}

export interface Violation {
  id: string;
  plate: string;
  type: string;
  location: string;
  time: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  image?: string;
}

export interface Hotspot {
  id: string;
  location: string;
  congestion: number;
  incidents: number;
  delay: string;
  status: 'Critical' | 'Elevated' | 'Normal';
}
