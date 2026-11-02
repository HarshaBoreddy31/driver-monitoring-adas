import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { OurVehicle, SimulationSettings } from '../../types';

interface ControlsToolbarProps {
  isRunning: boolean;
  isPaused: boolean;
  ourVehicle?: OurVehicle;
  settings?: SimulationSettings;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSpeedChange: (speedMs: number) => void;
  onLaneChange: (lane: number) => void;
  onBrake: (active: boolean, emergency?: boolean) => void;
  onTriggerScenario: (scenario: string) => void;
}

const LANE_INFO: Record<number, { name: string; position: string }> = {
  1: { name: 'Far Left', position: '-7.2m' },
  2: { name: 'Left Lane', position: '-3.6m' },
  3: { name: 'Center Lane', position: '0.0m' },
  4: { name: 'Right Lane', position: '+3.6m' },
  5: { name: 'Far Right', position: '+7.2m' },
};

export const ControlsToolbar: React.FC<ControlsToolbarProps> = ({
  isRunning,
  isPaused,
  ourVehicle,
  settings,
  onStart,
  onPause,
  onResume,
  onReset,
  onSpeedChange,
  onLaneChange,
  onBrake,
  onTriggerScenario,
}) => {
  const currentSpeed = ourVehicle ? ourVehicle.speed : 25;
  const currentLane = ourVehicle ? Math.max(1, Math.min(5, Math.round(ourVehicle.lane))) : 3;
  const isBraking = ourVehicle ? ourVehicle.brakeActive || ourVehicle.emergencyBrakeActive : false;
  const laneMeta = LANE_INFO[currentLane] || { name: 'Center', position: '0.0m' };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[98%] max-w-5xl bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 px-4 text-white shadow-2xl flex flex-col gap-2">
      {/* Primary Control Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Simulation Playback Controls */}
        <div className="flex items-center gap-1.5 border-r border-slate-800/80 pr-3">
          {isRunning && !isPaused ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-all active:scale-95"
              title="Pause Simulation Clock"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={isRunning ? onResume : onStart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all active:scale-95"
              title="Start or Resume Simulation Clock"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Resume' : 'Start'}</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Reset Simulation to Initial State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lane Selector & Steering Controls (Always Visible & Prominent) */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1 shadow-inner">
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-bold mr-1">
            <Compass className="w-3.5 h-3.5" />
            <span>LANE:</span>
          </div>

          <button
            onClick={() => onLaneChange(Math.max(1, currentLane - 1))}
            disabled={currentLane <= 1}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-0.5 active:scale-95"
            title="Steer Left (A or ←)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px]">A</span>
          </button>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((lane) => {
              const isActive = currentLane === lane;
              return (
                <button
                  key={lane}
                  onClick={() => onLaneChange(lane)}
                  className={`w-7 h-7 text-xs font-extrabold rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 text-slate-950 shadow-md shadow-cyan-500/50 scale-105 border border-cyan-300 ring-2 ring-cyan-500/30'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={`Lane ${lane}: ${LANE_INFO[lane]?.name} (${LANE_INFO[lane]?.position})`}
                >
                  {lane}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onLaneChange(Math.min(5, currentLane + 1))}
            disabled={currentLane >= 5}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-0.5 active:scale-95"
            title="Steer Right (D or →)"
          >
            <span className="hidden md:inline text-[10px]">D</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Active Lane Badge */}
          <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-800 text-[11px] font-mono">
            <span className="text-cyan-400 font-bold">{laneMeta.name}</span>
            <span className="text-slate-500">({laneMeta.position})</span>
          </div>
        </div>

        {/* Speed Control Slider & Throttle */}
        <div className="flex items-center gap-2 min-w-[190px] flex-1 max-w-xs">
          <Gauge className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="w-full">
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-0.5">
              <span>Throttle: {Math.round(currentSpeed * 3.6)} km/h</span>
              <span>{currentSpeed.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={currentSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Emergency Brake Trigger */}
        <button
          onMouseDown={() => onBrake(true, true)}
          onMouseUp={() => onBrake(false)}
          onTouchStart={() => onBrake(true, true)}
          onTouchEnd={() => onBrake(false)}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
            isBraking
              ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
              : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300'
          }`}
          title="Hold Space or Click to Apply Emergency Brakes"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{isBraking ? 'BRAKING' : 'E-BRAKE'}</span>
        </button>

        {/* Scenario Dropdown */}
        <div className="flex items-center gap-1.5">
          <select
            value={settings?.activeScenario || 'free_flow'}
            onChange={(e) => onTriggerScenario(e.target.value)}
            className="bg-slate-900 border border-slate-700/90 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium"
          >
            <option value="free_flow">Normal Traffic</option>
            <option value="lead_braking">Scenario: Lead Braking</option>
            <option value="aggressive_tailgate">Scenario: Tailgater</option>
            <option value="blindspot_cut_in">Scenario: Blindspot Cut-In</option>
            <option value="multi_hazard">Scenario: Multi-Hazard</option>
          </select>
        </div>
      </div>

      {/* Sub-bar: Hotkeys Legend & Active Status */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 uppercase font-semibold">Controls:</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">A</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">D</kbd> or <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">←</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">→</kbd> Steer</span>
          <span>•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">1</kbd>-<kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">5</kbd> Direct Lane</span>
          <span>•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">W</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">S</kbd> Throttle</span>
          <span>•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-rose-300 font-bold">Space</kbd> Brake</span>
          <span>•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">C</kbd> Camera</span>
          <span>•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">M</kbd> Mute</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-semibold">Our Vehicle: Lane {currentLane} ({laneMeta.name})</span>
        </div>
      </div>
    </div>
  );
};
