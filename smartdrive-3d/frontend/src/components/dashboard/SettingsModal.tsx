import React, { useState, useEffect } from 'react';
import { X, Settings, Check, RotateCcw, Sliders } from 'lucide-react';
import { SimulationSettings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: SimulationSettings;
  onSave: (updated: Partial<SimulationSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [dangerDistance, setDangerDistance] = useState<number>(5);
  const [cautionDistance, setCautionDistance] = useState<number>(10);
  const [differentLaneWarningDistance, setDifferentLaneWarningDistance] = useState<number>(1.0);
  const [ttcThreshold, setTtcThreshold] = useState<number>(2.5);
  const [tickRateMs, setTickRateMs] = useState<number>(100);
  const [autoTraffic, setAutoTraffic] = useState<boolean>(true);
  const [warningSoundEnabled, setWarningSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (settings) {
      setDangerDistance(settings.dangerDistance ?? 5);
      setCautionDistance(settings.cautionDistance ?? 10);
      if (settings.differentLaneWarningDistance !== undefined) {
        setDifferentLaneWarningDistance(settings.differentLaneWarningDistance);
      } else {
        setDifferentLaneWarningDistance(1.0);
      }
      setTtcThreshold(settings.ttcThreshold ?? 2.5);
      setTickRateMs(settings.tickRateMs ?? 100);
      setAutoTraffic(settings.autoTraffic ?? true);
      setWarningSoundEnabled(settings.warningSoundEnabled ?? true);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSave({
      dangerDistance,
      cautionDistance,
      differentLaneWarningDistance,
      ttcThreshold,
      tickRateMs,
      autoTraffic,
      warningSoundEnabled,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setDangerDistance(5);
    setCautionDistance(10);
    setDifferentLaneWarningDistance(1.0);
    setTtcThreshold(2.5);
    setTickRateMs(100);
    setAutoTraffic(true);
    setWarningSoundEnabled(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Settings & Calibration</h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-time safety thresholds and simulation timing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Sliders */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Danger Distance Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">Front Danger Distance Threshold:</span>
              <span className="text-rose-400 font-bold">{dangerDistance} meters</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={dangerDistance}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setDangerDistance(val);
                if (val >= cautionDistance) setCautionDistance(val + 2);
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <p className="text-[11px] text-slate-400">
              Vehicles ahead in the same lane within this distance trigger urgent red DANGER alerts.
            </p>
          </div>

          {/* Caution Distance Slider (Front Warning Distance: 10m) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">Front Warning Distance (Caution):</span>
              <span className="text-amber-400 font-bold">{cautionDistance} meters</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={cautionDistance}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setCautionDistance(val);
                if (val <= dangerDistance) setDangerDistance(Math.max(2, val - 2));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[11px] text-slate-400">
              Vehicles ahead in our lane trigger collision warnings when closer than this distance (default: 10m).
            </p>
          </div>

          {/* Side Lane Warning Distance Slider: 1m */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">Side Lane Warning Threshold:</span>
              <span className="text-amber-400 font-bold">{differentLaneWarningDistance.toFixed(1)} meters</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={differentLaneWarningDistance}
              onChange={(e) => setDifferentLaneWarningDistance(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[11px] text-slate-400">
              Vehicles in side or adjacent lanes trigger proximity warnings when closer than this distance (default: 1.0m).
            </p>
          </div>

          {/* TTC Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">Time-to-Collision (TTC) Limit:</span>
              <span className="text-cyan-400 font-bold">{ttcThreshold.toFixed(1)} seconds</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.5"
              value={ttcThreshold}
              onChange={(e) => setTtcThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Closing vehicles with calculated TTC under this limit escalate to danger status.
            </p>
          </div>

          {/* Simulation Tick Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">Backend OS Tick Rate:</span>
              <span className="text-indigo-400 font-bold">
                {tickRateMs} ms ({(1000 / tickRateMs).toFixed(0)} Hz)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="25"
              value={tickRateMs}
              onChange={(e) => setTickRateMs(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Cyclic task interval in the Node.js backend scheduler. Default is 100ms (10Hz).
            </p>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-300 font-medium">Autonomous Surrounding Traffic AI</span>
              <input
                type="checkbox"
                checked={autoTraffic}
                onChange={(e) => setAutoTraffic(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-300 font-medium">Audio Siren Synthesis (Web Audio API)</span>
              <input
                type="checkbox"
                checked={warningSoundEnabled}
                onChange={(e) => setWarningSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
