import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type {
  ZoneId,
  ZoneSensorState,
  ApplianceCircuit,
  AutomationRule,
  AutomationSystemId,
  SystemActivityEvent,
  TelemetrySample,
  EnergyThresholdSettings,
  HardwareBridgeConfig,
  LogCategory,
  LogSeverity,
} from '../types/ecosync';

export const TARIFF_INR_PER_KWH = 7.2;

interface NewRuleInput {
  name: string;
  shortDescription: string;
  sensorSource: string;
  thresholdLabel: string;
  thresholdValue: number;
  thresholdUnit: string;
  hysteresis: number;
  priority: number;
  targetZoneId: ZoneId | 'all';
}

interface EcosyncContextValue {
  zones: ZoneSensorState[];
  circuits: ApplianceCircuit[];
  rules: AutomationRule[];
  activityFeed: SystemActivityEvent[];
  telemetryHistory: TelemetrySample[];
  ambientDaylightPct: number;
  tariffInrPerKwh: number;
  totalWatts: number;
  averageVoltage: number;
  totalCurrentAmps: number;
  apparentPowerVa: number;
  reactivePowerVar: number;
  frequencyHz: number;
  powerFactor: number;
  cumulativeKwh: number;
  baselineKwh: number;
  estimatedCostInr: number;
  estimatedSavingsPct: number;
  coreConnected: boolean;
  wifiRssiDbm: number;
  uptimeSeconds: number;
  lastUpdatedAt: string;
  energyThresholds: EnergyThresholdSettings;
  bridgeConfig: HardwareBridgeConfig;
  setAmbientDaylightPct: (val: number) => void;
  setTariffInrPerKwh: (val: number) => void;
  updateEnergyThresholds: (next: Partial<EnergyThresholdSettings>) => void;
  updateBridgeConfig: (next: Partial<HardwareBridgeConfig>) => void;
  toggleZoneOccupancy: (zoneId: ZoneId) => void;
  simulateInactivityTimeout: (zoneId: ZoneId) => void;
  toggleCircuitManual: (circuitId: string) => void;
  toggleZoneAppliance: (zoneId: ZoneId, category: 'lighting' | 'fan') => void;
  toggleCircuitAutoMode: (circuitId: string) => void;
  toggleRuleEnabled: (ruleId: AutomationSystemId) => void;
  updateRuleThreshold: (ruleId: AutomationSystemId, value: number) => void;
  updateRuleDetails: (ruleId: AutomationSystemId, patch: Partial<AutomationRule>) => void;
  createCustomRule: (input: NewRuleInput) => void;
  deleteCustomRule: (ruleId: AutomationSystemId) => void;
  setZoneTemperature: (zoneId: ZoneId, tempC: number) => void;
  updateZoneThresholds: (
    zoneId: ZoneId,
    patch: {
      tempThresholdOverrideC?: number;
      daylightThresholdOverride?: number;
      ldrCalibrationOffset?: number;
      tempCalibrationOffset?: number;
    }
  ) => void;
  toggleCoreConnection: () => void;
  toggleSenseConnection: (zoneId: ZoneId) => void;
  resetSimulationMetrics: () => void;
}

function formatNowTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatTodayIso(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function brightnessToAdc(brightness: number): number {
  return Math.max(40, Math.min(1023, Math.round(80 + brightness * 3.4)));
}

const INITIAL_ZONES: ZoneSensorState[] = [
  {
    id: 'living',
    name: 'Living Room',
    occupied: true,
    brightness: 120,
    ldrRawAdc: brightnessToAdc(120),
    ldrCalibrationOffset: 0,
    temperatureC: 26,
    tempCalibrationOffset: 0,
    humidityPct: 58,
    lastMotionSec: 6,
    lastMotionAt: '09:14:22',
    pirState: 'HIGH',
    dht11Status: 'OK',
    senseConnected: true,
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    occupied: false,
    brightness: 65,
    ldrRawAdc: brightnessToAdc(65),
    ldrCalibrationOffset: 0,
    temperatureC: 24,
    tempCalibrationOffset: 0,
    humidityPct: 52,
    lastMotionSec: 420,
    lastMotionAt: '09:07:12',
    pirState: 'LOW',
    dht11Status: 'OK',
    senseConnected: true,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    occupied: true,
    brightness: 180,
    ldrRawAdc: brightnessToAdc(180),
    ldrCalibrationOffset: 0,
    temperatureC: 29,
    tempCalibrationOffset: 0,
    humidityPct: 63,
    lastMotionSec: 19,
    lastMotionAt: '09:16:04',
    pirState: 'HIGH',
    dht11Status: 'OK',
    senseConnected: true,
  },
  {
    id: 'study',
    name: 'Study Room',
    occupied: false,
    brightness: 90,
    ldrRawAdc: brightnessToAdc(90),
    ldrCalibrationOffset: 0,
    temperatureC: 25,
    tempCalibrationOffset: 0,
    humidityPct: 48,
    lastMotionSec: 310,
    lastMotionAt: '09:09:45',
    pirState: 'LOW',
    dht11Status: 'OK',
    senseConnected: true,
  },
];

const INITIAL_CIRCUITS: ApplianceCircuit[] = [
  {
    id: 'living-lights',
    name: 'Living Room Light',
    zoneId: 'living',
    category: 'lighting',
    relayChannel: 1,
    isOn: true,
    autoMode: true,
    nominalWatts: 36,
    currentWatts: 36,
    voltageV: 230.4,
    powerFactor: 0.96,
  },
  {
    id: 'living-fan',
    name: 'Living Room Ceiling Fan',
    zoneId: 'living',
    category: 'fan',
    relayChannel: 2,
    isOn: false,
    autoMode: true,
    nominalWatts: 65,
    currentWatts: 0,
    voltageV: 230.4,
    powerFactor: 0.91,
  },
  {
    id: 'bedroom-lights',
    name: 'Bedroom Light',
    zoneId: 'bedroom',
    category: 'lighting',
    relayChannel: 3,
    isOn: false,
    autoMode: true,
    nominalWatts: 24,
    currentWatts: 0,
    voltageV: 230.3,
    powerFactor: 0.95,
  },
  {
    id: 'bedroom-fan',
    name: 'Bedroom Ceiling Fan',
    zoneId: 'bedroom',
    category: 'fan',
    relayChannel: 4,
    isOn: false,
    autoMode: true,
    nominalWatts: 60,
    currentWatts: 0,
    voltageV: 230.3,
    powerFactor: 0.9,
  },
  {
    id: 'kitchen-lights',
    name: 'Kitchen Light',
    zoneId: 'kitchen',
    category: 'lighting',
    relayChannel: 5,
    isOn: true,
    autoMode: true,
    nominalWatts: 32,
    currentWatts: 32,
    voltageV: 230.1,
    powerFactor: 0.96,
  },
  {
    id: 'kitchen-fan',
    name: 'Kitchen Exhaust & Fan',
    zoneId: 'kitchen',
    category: 'fan',
    relayChannel: 6,
    isOn: true,
    autoMode: true,
    nominalWatts: 70,
    currentWatts: 70,
    voltageV: 230.1,
    powerFactor: 0.89,
  },
  {
    id: 'study-lights',
    name: 'Study Room Task Light',
    zoneId: 'study',
    category: 'lighting',
    relayChannel: 7,
    isOn: false,
    autoMode: true,
    nominalWatts: 28,
    currentWatts: 0,
    voltageV: 230.2,
    powerFactor: 0.97,
  },
  {
    id: 'study-fan',
    name: 'Study Room Ceiling Fan',
    zoneId: 'study',
    category: 'fan',
    relayChannel: 8,
    isOn: false,
    autoMode: true,
    nominalWatts: 58,
    currentWatts: 0,
    voltageV: 230.2,
    powerFactor: 0.91,
  },
];

const INITIAL_RULES: AutomationRule[] = [
  {
    id: 'smart-lighting',
    name: 'Smart Lighting',
    shortDescription: 'PIR-based occupancy detection and automatic lighting.',
    sensorSource: 'PIR Motion Sensor',
    triggerDescription: 'PIR == HIGH (Occupied) -> Energize Light Relay; Vacant -> Cutoff',
    actionDescription: 'Switches room lighting relay automatically with occupancy',
    enabled: true,
    thresholdValue: 120,
    thresholdUnit: 's',
    thresholdLabel: 'Vacancy Timeout',
    hysteresis: 10,
    priority: 1,
    currentCondition: '2 of 4 rooms occupied',
    lastTriggered: 'Kitchen Light switched ON',
    targetZoneId: 'all',
  },
  {
    id: 'daylight-optimization',
    name: 'Daylight Optimization',
    shortDescription: 'LDR-based relative ambient brightness monitoring and lighting adjustment.',
    sensorSource: 'LDR Ambient Light Sensor',
    triggerDescription: 'LDR >= Threshold (rel) -> Reduce artificial lighting',
    actionDescription: 'Holds light relay OFF when natural daylight is sufficient',
    enabled: true,
    thresholdValue: 200,
    thresholdUnit: 'rel',
    thresholdLabel: 'Daylight Cutoff',
    hysteresis: 20,
    priority: 2,
    currentCondition: 'All rooms below 200 rel',
    lastTriggered: 'Ambient light below cutoff; room lighting enabled',
    targetZoneId: 'all',
  },
  {
    id: 'temp-control',
    name: 'Automatic Temperature Control',
    shortDescription: 'DHT11 temperature monitoring and relay-controlled fan activation.',
    sensorSource: 'DHT11 Temperature Sensor',
    triggerDescription: 'Occupied AND DHT11 >= Threshold °C -> Energize Fan Relay',
    actionDescription: 'Activates ceiling fan relay when room temperature exceeds limit',
    enabled: true,
    thresholdValue: 27.0,
    thresholdUnit: '°C',
    thresholdLabel: 'Fan Activation Temp',
    hysteresis: 1.0,
    priority: 3,
    currentCondition: 'Kitchen 29.0 °C >= 27.0 °C',
    lastTriggered: 'Kitchen fan activated at 29°C',
    targetZoneId: 'all',
  },
];

const TODAY_ISO = formatTodayIso();

const INITIAL_ACTIVITY: SystemActivityEvent[] = [
  {
    id: 'evt-1',
    timestamp: '09:14:22',
    dateIso: TODAY_ISO,
    room: 'Living Room',
    description: 'Motion detected in Living Room.',
    device: 'ECOSYNC SENSE · PIR',
    status: 'Automated',
    category: 'sensor',
    severity: 'info',
  },
  {
    id: 'evt-2',
    timestamp: '09:14:23',
    dateIso: TODAY_ISO,
    room: 'Living Room',
    description: 'Living Room Light switched ON.',
    device: 'ECOSYNC CORE · Relay CH-01',
    status: 'Automated',
    category: 'relay',
    severity: 'info',
  },
  {
    id: 'evt-3',
    timestamp: '09:16:04',
    dateIso: TODAY_ISO,
    room: 'Kitchen',
    description: 'Motion detected in Kitchen; Kitchen Light switched ON.',
    device: 'ECOSYNC CORE · Relay CH-05',
    status: 'Automated',
    category: 'automation',
    severity: 'info',
  },
  {
    id: 'evt-4',
    timestamp: '09:16:06',
    dateIso: TODAY_ISO,
    room: 'Kitchen',
    description: 'Kitchen Exhaust & Fan activated at 29°C (exceeded 27°C threshold).',
    device: 'ECOSYNC CORE · Relay CH-06',
    status: 'Threshold',
    category: 'threshold',
    severity: 'warning',
  },
  {
    id: 'evt-5',
    timestamp: '09:21:12',
    dateIso: TODAY_ISO,
    room: 'Bedroom',
    description: 'Bedroom marked vacant after inactivity timeout.',
    device: 'ECOSYNC SENSE · PIR',
    status: 'Automated',
    category: 'automation',
    severity: 'info',
  },
  {
    id: 'evt-6',
    timestamp: '09:22:05',
    dateIso: TODAY_ISO,
    room: 'Study Room',
    description: 'Study Room marked vacant; task light and fan standby.',
    device: 'ECOSYNC SENSE · PIR',
    status: 'Automated',
    category: 'sensor',
    severity: 'info',
  },
];

const INITIAL_HISTORY: TelemetrySample[] = [
  { timestamp: '09:10:00', watts: 108, voltageV: 230.1, currentA: 0.5, powerFactor: 0.94 },
  { timestamp: '09:12:00', watts: 138, voltageV: 230.3, currentA: 0.64, powerFactor: 0.93 },
  { timestamp: '09:14:00', watts: 164, voltageV: 230.0, currentA: 0.77, powerFactor: 0.92 },
  { timestamp: '09:16:00', watts: 138, voltageV: 230.2, currentA: 0.65, powerFactor: 0.93 },
  { timestamp: '09:18:00', watts: 140, voltageV: 230.4, currentA: 0.65, powerFactor: 0.93 },
  { timestamp: '09:20:00', watts: 138, voltageV: 230.2, currentA: 0.64, powerFactor: 0.93 },
];

const EcosyncContext = createContext<EcosyncContextValue | null>(null);

export const EcosyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<ZoneSensorState[]>(INITIAL_ZONES);
  const [circuits, setCircuits] = useState<ApplianceCircuit[]>(INITIAL_CIRCUITS);
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [activityFeed, setActivityFeed] = useState<SystemActivityEvent[]>(INITIAL_ACTIVITY);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySample[]>(INITIAL_HISTORY);
  const [ambientDaylightPct, setAmbientDaylightPctState] = useState<number>(30);
  const [tariffInrPerKwh, setTariffInrPerKwhState] = useState<number>(TARIFF_INR_PER_KWH);
  const [cumulativeKwh, setCumulativeKwh] = useState<number>(12.46);
  const [baselineKwh, setBaselineKwh] = useState<number>(17.92);
  const [coreConnected, setCoreConnected] = useState<boolean>(true);
  const [wifiRssiDbm, setWifiRssiDbm] = useState<number>(-56);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(14280);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(() => formatNowTime());

  const [energyThresholds, setEnergyThresholds] = useState<EnergyThresholdSettings>({
    powerLimitW: 350,
    dailyEnergyLimitKwh: 16.0,
    dailyCostLimitInr: 120,
  });

  const [bridgeConfig, setBridgeConfig] = useState<HardwareBridgeConfig>({
    transport: 'simulation',
    brokerOrEndpoint: 'mqtt://192.168.1.40:1883',
    topicPrefix: 'ecosync/residence',
    pollIntervalMs: 3000,
  });

  const pushActivity = useCallback(
    (
      room: string,
      description: string,
      device: string,
      status: SystemActivityEvent['status'],
      category: LogCategory = 'system',
      severity: LogSeverity = 'info'
    ) => {
      const event: SystemActivityEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatNowTime(),
        dateIso: formatTodayIso(),
        room,
        description,
        device,
        status,
        category,
        severity,
      };
      setActivityFeed((prev) => [event, ...prev].slice(0, 60));
      setLastUpdatedAt(event.timestamp);
    },
    []
  );

  const evaluateControlLogic = useCallback(
    (
      nextZones: ZoneSensorState[],
      nextRules: AutomationRule[],
      prevCircuits: ApplianceCircuit[],
      isCoreOnline: boolean
    ): { updatedCircuits: ApplianceCircuit[]; changes: SystemActivityEvent[] } => {
      if (!isCoreOnline) {
        return { updatedCircuits: prevCircuits, changes: [] };
      }

      const lightingRule = nextRules.find((r) => r.id === 'smart-lighting');
      const daylightRule = nextRules.find((r) => r.id === 'daylight-optimization');
      const tempRule = nextRules.find((r) => r.id === 'temp-control');

      const lightingEnabled = lightingRule?.enabled ?? false;
      const daylightEnabled = daylightRule?.enabled ?? false;
      const defaultDaylightCutoff = daylightRule?.thresholdValue ?? 200;
      const daylightHyst = daylightRule?.hysteresis ?? 20;
      const tempEnabled = tempRule?.enabled ?? false;
      const defaultTempThresholdC = tempRule?.thresholdValue ?? 27.0;
      const tempHyst = tempRule?.hysteresis ?? 1.0;

      const changes: SystemActivityEvent[] = [];
      const ts = formatNowTime();
      const dateIso = formatTodayIso();

      const updatedCircuits = prevCircuits.map((circuit) => {
        if (!circuit.autoMode) {
          return {
            ...circuit,
            currentWatts: circuit.isOn ? circuit.nominalWatts : 0,
          };
        }

        const zone = nextZones.find((z) => z.id === circuit.zoneId);
        if (!zone || !zone.senseConnected) return circuit;

        const roomDaylightCutoff = zone.daylightThresholdOverride ?? defaultDaylightCutoff;
        const roomTempThreshold = zone.tempThresholdOverrideC ?? defaultTempThresholdC;

        let nextOn = circuit.isOn;
        if (circuit.category === 'lighting') {
          if (lightingEnabled && daylightEnabled) {
            if (!zone.occupied) {
              nextOn = false;
            } else if (circuit.isOn) {
              nextOn = zone.brightness < roomDaylightCutoff;
            } else {
              nextOn = zone.brightness < roomDaylightCutoff - daylightHyst;
            }
          } else if (lightingEnabled) {
            nextOn = zone.occupied;
          } else if (daylightEnabled) {
            nextOn = circuit.isOn && zone.brightness < roomDaylightCutoff;
          }
        } else if (circuit.category === 'fan') {
          if (tempEnabled) {
            if (!zone.occupied) {
              nextOn = false;
            } else if (circuit.isOn) {
              nextOn = zone.temperatureC > roomTempThreshold - tempHyst;
            } else {
              nextOn = zone.temperatureC >= roomTempThreshold;
            }
          }
        }

        if (nextOn !== circuit.isOn) {
          if (circuit.category === 'lighting') {
            if (!nextOn && zone.occupied && daylightEnabled && zone.brightness >= roomDaylightCutoff) {
              changes.push({
                id: `evt-${Date.now()}-${circuit.id}`,
                timestamp: ts,
                dateIso,
                room: zone.name,
                description: 'Daylight level sufficient; artificial lighting reduced.',
                device: `ECOSYNC CORE · Relay CH-0${circuit.relayChannel}`,
                status: 'Threshold',
                category: 'threshold',
                severity: 'info',
              });
            } else {
              changes.push({
                id: `evt-${Date.now()}-${circuit.id}`,
                timestamp: ts,
                dateIso,
                room: zone.name,
                description: `${circuit.name} switched ${nextOn ? 'ON' : 'OFF'}.`,
                device: `ECOSYNC CORE · Relay CH-0${circuit.relayChannel}`,
                status: 'Automated',
                category: 'relay',
                severity: 'info',
              });
            }
          } else if (circuit.category === 'fan') {
            changes.push({
              id: `evt-${Date.now()}-${circuit.id}`,
              timestamp: ts,
              dateIso,
              room: zone.name,
              description: nextOn
                ? 'Fan activated because temperature exceeded threshold.'
                : `${circuit.name} switched OFF.`,
              device: `ECOSYNC CORE · Relay CH-0${circuit.relayChannel}`,
              status: nextOn ? 'Threshold' : 'Automated',
              category: nextOn ? 'threshold' : 'relay',
              severity: nextOn ? 'warning' : 'info',
            });
          }
        }

        return {
          ...circuit,
          isOn: nextOn,
          currentWatts: nextOn ? circuit.nominalWatts : 0,
        };
      });

      return { updatedCircuits, changes };
    },
    []
  );

  const syncRuleConditions = useCallback(
    (
      nextZones: ZoneSensorState[],
      currentRules: AutomationRule[],
      lastEventText?: { id: AutomationSystemId; text: string }
    ) => {
      const occupiedCount = nextZones.filter((z) => z.occupied).length;
      return currentRules.map((r) => {
        let condition = r.currentCondition;
        if (r.id === 'smart-lighting') {
          condition = `${occupiedCount} of ${nextZones.length} rooms occupied`;
        } else if (r.id === 'daylight-optimization') {
          const brightRooms = nextZones.filter((z) => z.brightness >= r.thresholdValue).length;
          condition =
            brightRooms > 0
              ? `${brightRooms} room(s) >= ${r.thresholdValue} rel`
              : `All rooms below ${r.thresholdValue} rel`;
        } else if (r.id === 'temp-control') {
          const hotRooms = nextZones.filter(
            (z) => z.occupied && z.temperatureC >= r.thresholdValue
          );
          condition =
            hotRooms.length > 0
              ? `${hotRooms.map((h) => h.name).join(', ')} >= ${r.thresholdValue.toFixed(1)} °C`
              : `All occupied rooms below ${r.thresholdValue.toFixed(1)} °C`;
        }
        return {
          ...r,
          currentCondition: condition,
          lastTriggered:
            lastEventText && lastEventText.id === r.id ? lastEventText.text : r.lastTriggered,
        };
      });
    },
    []
  );

  const setAmbientDaylightPct = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(100, val));
      setAmbientDaylightPctState(clamped);

      const baselines: Record<ZoneId, number> = {
        living: 120,
        bedroom: 65,
        kitchen: 180,
        study: 90,
      };
      const delta = Math.round((clamped - 30) * 2.5);

      const nextZones = zones.map((z) => {
        const nextBrightness = Math.max(
          10,
          Math.min(255, baselines[z.id] + delta + z.ldrCalibrationOffset)
        );
        return {
          ...z,
          brightness: nextBrightness,
          ldrRawAdc: brightnessToAdc(nextBrightness),
        };
      });

      const { updatedCircuits, changes } = evaluateControlLogic(
        nextZones,
        rules,
        circuits,
        coreConnected
      );

      setZones(nextZones);
      setCircuits(updatedCircuits);
      setRules((prev) =>
        syncRuleConditions(
          nextZones,
          prev,
          changes.length > 0
            ? { id: 'daylight-optimization', text: changes[0].description }
            : undefined
        )
      );
      if (changes.length > 0) {
        setActivityFeed((prev) => [...changes, ...prev].slice(0, 60));
      }
      setLastUpdatedAt(formatNowTime());
    },
    [zones, rules, circuits, coreConnected, evaluateControlLogic, syncRuleConditions]
  );

  const setTariffInrPerKwh = useCallback(
    (val: number) => {
      const next = Number(Math.max(1, Math.min(30, val)).toFixed(2));
      setTariffInrPerKwhState(next);
      pushActivity(
        'System',
        `Electricity tariff updated to ₹${next.toFixed(2)}/kWh.`,
        'ECOSYNC Billing Config',
        'System',
        'system',
        'info'
      );
    },
    [pushActivity]
  );

  const updateEnergyThresholds = useCallback(
    (next: Partial<EnergyThresholdSettings>) => {
      setEnergyThresholds((prev) => ({ ...prev, ...next }));
      pushActivity(
        'System',
        'Energy monitoring alert thresholds updated.',
        'ECOSYNC CORE · Threshold Guard',
        'System',
        'threshold',
        'info'
      );
    },
    [pushActivity]
  );

  const updateBridgeConfig = useCallback(
    (next: Partial<HardwareBridgeConfig>) => {
      setBridgeConfig((prev) => ({ ...prev, ...next }));
      pushActivity(
        'System',
        `Hardware interface settings updated (${next.transport ?? 'polling'}).`,
        'ECOSYNC CORE · Comms',
        'System',
        'connection',
        'info'
      );
    },
    [pushActivity]
  );

  const toggleZoneOccupancy = useCallback(
    (zoneId: ZoneId) => {
      const target = zones.find((z) => z.id === zoneId);
      if (!target) return;
      const nextOccupied = !target.occupied;
      const ts = formatNowTime();

      const nextZones = zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              occupied: nextOccupied,
              pirState: (nextOccupied ? 'HIGH' : 'LOW') as 'HIGH' | 'LOW',
              lastMotionSec: nextOccupied ? 0 : 180,
              lastMotionAt: nextOccupied ? ts : z.lastMotionAt,
            }
          : z
      );

      const motionEvent: SystemActivityEvent = {
        id: `evt-${Date.now()}-pir`,
        timestamp: ts,
        dateIso: formatTodayIso(),
        room: target.name,
        description: nextOccupied
          ? `Motion detected in ${target.name}.`
          : `${target.name} marked vacant.`,
        device: `ECOSYNC SENSE · ${target.name}`,
        status: 'Automated',
        category: 'sensor',
        severity: 'info',
      };

      const { updatedCircuits, changes } = evaluateControlLogic(
        nextZones,
        rules,
        circuits,
        coreConnected
      );

      setZones(nextZones);
      setCircuits(updatedCircuits);
      setRules((prev) =>
        syncRuleConditions(nextZones, prev, {
          id: 'smart-lighting',
          text: motionEvent.description,
        })
      );
      setActivityFeed((prev) => [...changes, motionEvent, ...prev].slice(0, 60));
      setLastUpdatedAt(motionEvent.timestamp);
    },
    [zones, rules, circuits, coreConnected, evaluateControlLogic, syncRuleConditions]
  );

  const simulateInactivityTimeout = useCallback(
    (zoneId: ZoneId) => {
      const target = zones.find((z) => z.id === zoneId);
      if (!target) return;

      const nextZones = zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              occupied: false,
              pirState: 'LOW' as const,
              lastMotionSec:
                rules.find((r) => r.id === 'smart-lighting')?.thresholdValue ?? 120,
            }
          : z
      );

      const timeoutEvent: SystemActivityEvent = {
        id: `evt-${Date.now()}-timeout`,
        timestamp: formatNowTime(),
        dateIso: formatTodayIso(),
        room: target.name,
        description: `${target.name} marked vacant after inactivity timeout.`,
        device: `ECOSYNC SENSE · ${target.name}`,
        status: 'Threshold',
        category: 'automation',
        severity: 'info',
      };

      const { updatedCircuits, changes } = evaluateControlLogic(
        nextZones,
        rules,
        circuits,
        coreConnected
      );

      setZones(nextZones);
      setCircuits(updatedCircuits);
      setRules((prev) =>
        syncRuleConditions(nextZones, prev, {
          id: 'smart-lighting',
          text: timeoutEvent.description,
        })
      );
      setActivityFeed((prev) => [...changes, timeoutEvent, ...prev].slice(0, 60));
      setLastUpdatedAt(timeoutEvent.timestamp);
    },
    [zones, rules, circuits, coreConnected, evaluateControlLogic, syncRuleConditions]
  );

  const setZoneTemperature = useCallback(
    (zoneId: ZoneId, tempC: number) => {
      const clampedTemp = Number(Math.max(16, Math.min(34, tempC)).toFixed(1));
      const target = zones.find((z) => z.id === zoneId);
      if (!target) return;

      const nextZones = zones.map((z) =>
        z.id === zoneId ? { ...z, temperatureC: clampedTemp } : z
      );

      const { updatedCircuits, changes } = evaluateControlLogic(
        nextZones,
        rules,
        circuits,
        coreConnected
      );

      setZones(nextZones);
      setCircuits(updatedCircuits);
      setRules((prev) =>
        syncRuleConditions(
          nextZones,
          prev,
          changes.length > 0 ? { id: 'temp-control', text: changes[0].description } : undefined
        )
      );
      if (changes.length > 0) {
        setActivityFeed((prev) => [...changes, ...prev].slice(0, 60));
      }
      setLastUpdatedAt(formatNowTime());
    },
    [zones, rules, circuits, coreConnected, evaluateControlLogic, syncRuleConditions]
  );

  const updateZoneThresholds = useCallback(
    (
      zoneId: ZoneId,
      patch: {
        tempThresholdOverrideC?: number;
        daylightThresholdOverride?: number;
        ldrCalibrationOffset?: number;
        tempCalibrationOffset?: number;
      }
    ) => {
      const target = zones.find((z) => z.id === zoneId);
      if (!target) return;

      const nextZones = zones.map((z) => {
        if (z.id !== zoneId) return z;
        const nextLdrOffset = patch.ldrCalibrationOffset ?? z.ldrCalibrationOffset;
        const nextTempOffset = patch.tempCalibrationOffset ?? z.tempCalibrationOffset;
        const rawB = z.brightness - z.ldrCalibrationOffset;
        const nextB = Math.max(10, Math.min(255, rawB + nextLdrOffset));
        const rawT = z.temperatureC - z.tempCalibrationOffset;
        const nextT = Number(Math.max(16, Math.min(34, rawT + nextTempOffset)).toFixed(1));
        return {
          ...z,
          ...patch,
          ldrCalibrationOffset: nextLdrOffset,
          tempCalibrationOffset: nextTempOffset,
          brightness: nextB,
          ldrRawAdc: brightnessToAdc(nextB),
          temperatureC: nextT,
        };
      });

      const { updatedCircuits, changes } = evaluateControlLogic(
        nextZones,
        rules,
        circuits,
        coreConnected
      );
      setZones(nextZones);
      setCircuits(updatedCircuits);
      setRules((prev) => syncRuleConditions(nextZones, prev));
      pushActivity(
        target.name,
        `Sensor calibration or room thresholds updated for ${target.name}.`,
        `ECOSYNC SENSE · ${target.name}`,
        'System',
        'sensor',
        'info'
      );
      if (changes.length > 0) {
        setActivityFeed((prev) => [...changes, ...prev].slice(0, 60));
      }
    },
    [zones, rules, circuits, coreConnected, evaluateControlLogic, syncRuleConditions, pushActivity]
  );

  const toggleCircuitManual = useCallback(
    (circuitId: string) => {
      if (!coreConnected) {
        pushActivity(
          'System',
          'Relay command ignored: ECOSYNC CORE is disconnected.',
          'ECOSYNC CORE',
          'System',
          'connection',
          'alert'
        );
        return;
      }

      const target = circuits.find((c) => c.id === circuitId);
      if (!target) return;
      const nextOn = !target.isOn;
      const roomName = zones.find((z) => z.id === target.zoneId)?.name ?? 'Room';

      setCircuits((prev) =>
        prev.map((c) => {
          if (c.id !== circuitId) return c;
          return {
            ...c,
            autoMode: false,
            isOn: nextOn,
            currentWatts: nextOn ? c.nominalWatts : 0,
          };
        })
      );

      pushActivity(
        roomName,
        `${target.name} switched ${nextOn ? 'ON' : 'OFF'} manually.`,
        `ECOSYNC CORE · Relay CH-0${target.relayChannel}`,
        'Manual',
        'relay',
        'info'
      );
    },
    [coreConnected, circuits, zones, pushActivity]
  );

  const toggleZoneAppliance = useCallback(
    (zoneId: ZoneId, category: 'lighting' | 'fan') => {
      const target = circuits.find((c) => c.zoneId === zoneId && c.category === category);
      if (target) {
        toggleCircuitManual(target.id);
      }
    },
    [circuits, toggleCircuitManual]
  );

  const toggleCircuitAutoMode = useCallback(
    (circuitId: string) => {
      const target = circuits.find((c) => c.id === circuitId);
      if (!target) return;
      const nextAuto = !target.autoMode;
      const nextList = circuits.map((c) =>
        c.id === circuitId ? { ...c, autoMode: nextAuto } : c
      );
      const { updatedCircuits, changes } = evaluateControlLogic(
        zones,
        rules,
        nextList,
        coreConnected
      );
      setCircuits(updatedCircuits);
      const roomName = zones.find((z) => z.id === target.zoneId)?.name ?? 'System';
      pushActivity(
        roomName,
        `${target.name} set to ${nextAuto ? 'Automatic' : 'Manual'} mode.`,
        `ECOSYNC CORE · Relay CH-0${target.relayChannel}`,
        'System',
        'relay',
        'info'
      );
      if (changes.length > 0) {
        setActivityFeed((prev) => [...changes, ...prev].slice(0, 60));
      }
    },
    [circuits, zones, rules, coreConnected, evaluateControlLogic, pushActivity]
  );

  const toggleRuleEnabled = useCallback(
    (ruleId: AutomationSystemId) => {
      const target = rules.find((r) => r.id === ruleId);
      if (!target) return;
      const nextEnabled = !target.enabled;
      const nextRules = rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: nextEnabled } : r
      );
      const { updatedCircuits, changes } = evaluateControlLogic(
        zones,
        nextRules,
        circuits,
        coreConnected
      );
      setRules(syncRuleConditions(zones, nextRules));
      setCircuits(updatedCircuits);
      pushActivity(
        'System',
        `${target.name} automation ${nextEnabled ? 'enabled' : 'disabled'}.`,
        target.sensorSource,
        'System',
        'automation',
        nextEnabled ? 'info' : 'warning'
      );
      if (changes.length > 0) {
        setActivityFeed((prev) => [...changes, ...prev].slice(0, 60));
      }
    },
    [rules, zones, circuits, coreConnected, evaluateControlLogic, syncRuleConditions, pushActivity]
  );

  const updateRuleThreshold = useCallback(
    (ruleId: AutomationSystemId, value: number) => {
      const nextRules = rules.map((r) =>
        r.id === ruleId ? { ...r, thresholdValue: value } : r
      );
      const { updatedCircuits, changes } = evaluateControlLogic(
        zones,
        nextRules,
        circuits,
        coreConnected
      );
      setRules(syncRuleConditions(zones, nextRules));
      setCircuits(updatedCircuits);
      if (changes.length > 0) {
        setActivityFeed((prev) => [...changes, ...prev].slice(0, 60));
      }
      setLastUpdatedAt(formatNowTime());
    },
    [rules, zones, circuits, coreConnected, evaluateControlLogic, syncRuleConditions]
  );

  const updateRuleDetails = useCallback(
    (ruleId: AutomationSystemId, patch: Partial<AutomationRule>) => {
      const nextRules = rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r));
      const { updatedCircuits, changes } = evaluateControlLogic(
        zones,
        nextRules,
        circuits,
        coreConnected
      );
      setRules(syncRuleConditions(zones, nextRules));
      setCircuits(updatedCircuits);
      pushActivity(
        'System',
        `Updated configuration for automation rule "${patch.name ?? ruleId}".`,
        'ECOSYNC CORE · Rule Engine',
        'System',
        'automation',
        'info'
      );
      if (changes.length > 0) {
        setActivityFeed((prev) => [...changes, ...prev].slice(0, 60));
      }
    },
    [rules, zones, circuits, coreConnected, evaluateControlLogic, syncRuleConditions, pushActivity]
  );

  const createCustomRule = useCallback(
    (input: NewRuleInput) => {
      const newRule: AutomationRule = {
        id: `custom-${Date.now()}`,
        name: input.name.trim() || 'Custom Rule',
        shortDescription: input.shortDescription.trim() || 'Custom threshold automation rule.',
        sensorSource: input.sensorSource,
        triggerDescription: `${input.sensorSource} ${input.thresholdLabel} >= ${input.thresholdValue} ${input.thresholdUnit} (Hyst: ${input.hysteresis})`,
        actionDescription: `Evaluates ${input.targetZoneId === 'all' ? 'all zones' : input.targetZoneId}`,
        enabled: true,
        thresholdValue: input.thresholdValue,
        thresholdUnit: input.thresholdUnit,
        thresholdLabel: input.thresholdLabel,
        hysteresis: input.hysteresis,
        priority: input.priority,
        currentCondition: 'Monitoring active (Simulated)',
        lastTriggered: 'Rule created — awaiting trigger',
        isCustom: true,
        targetZoneId: input.targetZoneId,
      };
      setRules((prev) => [...prev, newRule]);
      pushActivity(
        input.targetZoneId === 'all'
          ? 'System'
          : zones.find((z) => z.id === input.targetZoneId)?.name ?? 'System',
        `Created custom rule "${newRule.name}".`,
        newRule.sensorSource,
        'System',
        'automation',
        'info'
      );
    },
    [zones, pushActivity]
  );

  const deleteCustomRule = useCallback(
    (ruleId: AutomationSystemId) => {
      const target = rules.find((r) => r.id === ruleId);
      if (!target || !target.isCustom) return;
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      pushActivity(
        'System',
        `Deleted custom rule "${target.name}".`,
        target.sensorSource,
        'System',
        'automation',
        'warning'
      );
    },
    [rules, pushActivity]
  );

  const toggleCoreConnection = useCallback(() => {
    const nextOnline = !coreConnected;
    setCoreConnected(nextOnline);
    pushActivity(
      'System',
      nextOnline ? 'Device connection restored.' : 'ECOSYNC CORE connection interrupted.',
      'ECOSYNC CORE · ESP32',
      'System',
      'connection',
      nextOnline ? 'info' : 'alert'
    );
  }, [coreConnected, pushActivity]);

  const toggleSenseConnection = useCallback(
    (zoneId: ZoneId) => {
      const target = zones.find((z) => z.id === zoneId);
      if (!target) return;
      const nextOnline = !target.senseConnected;
      const nextZones = zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              senseConnected: nextOnline,
              dht11Status: (nextOnline ? 'OK' : 'OFFLINE') as 'OK' | 'OFFLINE',
            }
          : z
      );
      setZones(nextZones);
      pushActivity(
        target.name,
        nextOnline
          ? `Device connection restored in ${target.name}.`
          : `ECOSYNC SENSE disconnected in ${target.name}.`,
        `ECOSYNC SENSE · ${target.name}`,
        'System',
        'connection',
        nextOnline ? 'info' : 'alert'
      );
    },
    [zones, pushActivity]
  );

  const resetSimulationMetrics = useCallback(() => {
    setCumulativeKwh(0.12);
    setBaselineKwh(0.19);
    pushActivity(
      'System',
      'Simulated energy cycle counters reset.',
      'ECOSYNC CORE · PZEM-004T',
      'System',
      'system',
      'info'
    );
  }, [pushActivity]);

  // Subtle simulated PZEM-004T telemetry tick when CORE is connected
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!coreConnected) return;
      setUptimeSeconds((prev) => prev + Math.round(bridgeConfig.pollIntervalMs / 1000));
      setCircuits((prev) => {
        const nextCircuits = prev.map((c) => {
          const jitter = (Math.random() - 0.5) * 0.4;
          const loadJitter = c.isOn ? Math.round((Math.random() - 0.5) * 2) : 0;
          return {
            ...c,
            voltageV: Number((230.2 + jitter).toFixed(1)),
            currentWatts: c.isOn ? Math.max(4, c.nominalWatts + loadJitter) : 0,
          };
        });
        const watts = nextCircuits.reduce((s, c) => s + c.currentWatts, 0);
        const avgV = nextCircuits.reduce((s, c) => s + c.voltageV, 0) / nextCircuits.length;
        const active = nextCircuits.filter((c) => c.isOn);
        const pf =
          active.length > 0
            ? active.reduce((s, c) => s + c.powerFactor, 0) / active.length
            : 1.0;
        const amps = avgV > 0 ? watts / (avgV * pf) : 0;
        setTelemetryHistory((hist) =>
          [
            ...hist,
            {
              timestamp: formatNowTime(),
              watts,
              voltageV: Number(avgV.toFixed(1)),
              currentA: Number(amps.toFixed(2)),
              powerFactor: Number(pf.toFixed(2)),
            },
          ].slice(-18)
        );
        return nextCircuits;
      });
      setZones((prev) =>
        prev.map((z) =>
          z.occupied
            ? z
            : { ...z, lastMotionSec: z.lastMotionSec + Math.round(bridgeConfig.pollIntervalMs / 1000) }
        )
      );
      setWifiRssiDbm(-55 - Math.round(Math.random() * 4));
      setCumulativeKwh((prev) => Number((prev + 0.001).toFixed(3)));
      setBaselineKwh((prev) => Number((prev + 0.002).toFixed(3)));
      setLastUpdatedAt(formatNowTime());
    }, bridgeConfig.pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [coreConnected, bridgeConfig.pollIntervalMs]);

  const totalWatts = useMemo(
    () => (coreConnected ? circuits.reduce((sum, c) => sum + c.currentWatts, 0) : 0),
    [circuits, coreConnected]
  );

  const averageVoltage = useMemo(() => {
    if (!coreConnected || !circuits.length) return 0;
    const sum = circuits.reduce((acc, c) => acc + c.voltageV, 0);
    return Number((sum / circuits.length).toFixed(1));
  }, [circuits, coreConnected]);

  const powerFactor = useMemo(() => {
    const active = circuits.filter((c) => c.isOn);
    if (!coreConnected || active.length === 0) return 1.0;
    const avg = active.reduce((acc, c) => acc + c.powerFactor, 0) / active.length;
    return Number(avg.toFixed(2));
  }, [circuits, coreConnected]);

  const totalCurrentAmps = useMemo(() => {
    if (!coreConnected || averageVoltage <= 0) return 0;
    return Number((totalWatts / (averageVoltage * powerFactor)).toFixed(2));
  }, [coreConnected, totalWatts, averageVoltage, powerFactor]);

  const apparentPowerVa = useMemo(() => {
    if (!coreConnected) return 0;
    return Math.round(averageVoltage * totalCurrentAmps);
  }, [coreConnected, averageVoltage, totalCurrentAmps]);

  const reactivePowerVar = useMemo(() => {
    if (!coreConnected || apparentPowerVa <= totalWatts) return 0;
    return Math.round(Math.sqrt(Math.max(0, apparentPowerVa ** 2 - totalWatts ** 2)));
  }, [coreConnected, apparentPowerVa, totalWatts]);

  const frequencyHz = coreConnected ? 50.0 : 0.0;

  const estimatedCostInr = useMemo(
    () => Number((cumulativeKwh * tariffInrPerKwh).toFixed(2)),
    [cumulativeKwh, tariffInrPerKwh]
  );

  const estimatedSavingsPct = useMemo(() => {
    if (baselineKwh <= 0) return 0;
    return Math.max(0, Math.round(((baselineKwh - cumulativeKwh) / baselineKwh) * 100));
  }, [baselineKwh, cumulativeKwh]);

  const value: EcosyncContextValue = {
    zones,
    circuits,
    rules,
    activityFeed,
    telemetryHistory,
    ambientDaylightPct,
    tariffInrPerKwh,
    totalWatts,
    averageVoltage,
    totalCurrentAmps,
    apparentPowerVa,
    reactivePowerVar,
    frequencyHz,
    powerFactor,
    cumulativeKwh,
    baselineKwh,
    estimatedCostInr,
    estimatedSavingsPct,
    coreConnected,
    wifiRssiDbm,
    uptimeSeconds,
    lastUpdatedAt,
    energyThresholds,
    bridgeConfig,
    setAmbientDaylightPct,
    setTariffInrPerKwh,
    updateEnergyThresholds,
    updateBridgeConfig,
    toggleZoneOccupancy,
    simulateInactivityTimeout,
    toggleCircuitManual,
    toggleZoneAppliance,
    toggleCircuitAutoMode,
    toggleRuleEnabled,
    updateRuleThreshold,
    updateRuleDetails,
    createCustomRule,
    deleteCustomRule,
    setZoneTemperature,
    updateZoneThresholds,
    toggleCoreConnection,
    toggleSenseConnection,
    resetSimulationMetrics,
  };

  return <EcosyncContext.Provider value={value}>{children}</EcosyncContext.Provider>;
};

export function useEcosync(): EcosyncContextValue {
  const ctx = useContext(EcosyncContext);
  if (!ctx) {
    throw new Error('useEcosync must be used inside EcosyncProvider');
  }
  return ctx;
}
