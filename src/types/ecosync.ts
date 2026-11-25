export type PublicRoute =
  | '/'
  | '/about'
  | '/technology'
  | '/features'
  | '/demo'
  | '/contact'
  | '/hardware';

export type AppManagementRoute =
  | '/app'
  | '/app/rooms'
  | '/app/analytics'
  | '/app/automation'
  | '/app/devices'
  | '/app/settings';

export type AppRoute = PublicRoute | AppManagementRoute;

export type ZoneId = 'living' | 'bedroom' | 'kitchen' | 'study';

export type DashboardTab = 'overview' | 'spaces' | 'automation' | 'devices' | 'settings';
export type DashboardMode = 'simple' | 'advanced';
export type AnalyticsPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface ZoneSensorState {
  id: ZoneId;
  name: string;
  occupied: boolean;
  brightness: number;
  ldrRawAdc: number;
  ldrCalibrationOffset: number;
  temperatureC: number;
  tempCalibrationOffset: number;
  humidityPct: number;
  lastMotionSec: number;
  lastMotionAt: string;
  pirState: 'HIGH' | 'LOW';
  dht11Status: 'OK' | 'OFFLINE';
  senseConnected: boolean;
  tempThresholdOverrideC?: number;
  daylightThresholdOverride?: number;
}

export interface ApplianceCircuit {
  id: string;
  name: string;
  zoneId: ZoneId;
  category: 'lighting' | 'fan';
  relayChannel: number;
  isOn: boolean;
  autoMode: boolean;
  nominalWatts: number;
  currentWatts: number;
  voltageV: number;
  powerFactor: number;
}

export type AutomationSystemId =
  | 'smart-lighting'
  | 'daylight-optimization'
  | 'temp-control'
  | string;

export interface AutomationRule {
  id: AutomationSystemId;
  name: string;
  shortDescription: string;
  sensorSource: string;
  triggerDescription: string;
  actionDescription: string;
  enabled: boolean;
  thresholdValue: number;
  thresholdUnit: string;
  thresholdLabel: string;
  hysteresis?: number;
  priority: number;
  currentCondition: string;
  lastTriggered: string;
  isCustom?: boolean;
  targetZoneId?: ZoneId | 'all';
}

export type LogCategory =
  | 'sensor'
  | 'connection'
  | 'automation'
  | 'relay'
  | 'threshold'
  | 'system';

export type LogSeverity = 'info' | 'warning' | 'alert';

export interface SystemActivityEvent {
  id: string;
  timestamp: string;
  dateIso: string;
  room: string;
  description: string;
  device: string;
  status: 'Automated' | 'Manual' | 'Threshold' | 'System';
  category: LogCategory;
  severity: LogSeverity;
}

export interface TelemetrySample {
  timestamp: string;
  watts: number;
  voltageV: number;
  currentA: number;
  powerFactor: number;
}

export interface EnergyThresholdSettings {
  powerLimitW: number;
  dailyEnergyLimitKwh: number;
  dailyCostLimitInr: number;
}

export interface HardwareBridgeConfig {
  transport: 'simulation' | 'mqtt' | 'http';
  brokerOrEndpoint: string;
  topicPrefix: string;
  pollIntervalMs: number;
}

export interface ExplodedStage {
  index: number;
  range: [number, number];
  componentName: string;
  role: string;
  explanation: string;
  stageLabel: string;
}
