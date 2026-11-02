import React from 'react';
import {
  Gauge,
  Volume2,
  VolumeX,
  Camera,
  Cpu,
  History,
  Settings,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Radio,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { CameraViewMode, OurVehicle, SafetyStatus } from '../../types';

interface HeaderBarProps {
  ourVehicle?: OurVehicle;
  dangerCount: number;
  cautionCount: number;
  nearestVehicle?: {
    id: string;
    name: string;
    distance: number;
    relativePosition: string;
    safetyStatus: SafetyStatus;
  } | null;
  isConnected: boolean;
  latencyMs: number;
  cameraMode: CameraViewMode;
  onCameraChange: (mode: CameraViewMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenOSModal: () => void;
  onOpenDemoModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  ourVehicle,
  dangerCount,
  cautionCount,
  nearestVehicle,
  isConnected,
  latencyMs,
  cameraMode,
  onCameraChange,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenHistory,
  onOpenOSModal,
  onOpenDemoModal,
}) => {
  const speedKmh = ourVehicle ? Math.round(ourVehicle.speed * 3.6) : 0;
  const speedMs = ourVehicle ? ourVehicle.speed.toFixed(1) : '0.0';

  return (
    <header className="w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-3 shadow-2xl z-30 select-none">
      {/* Brand & System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                SMARTDRIVE 3D
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 tracking-wider">
                ADAS v2.0
              </span>
              <span className="hidden xl:inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                SIMULATED DATA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500 animate-ping'
                }`}
              />
              {isConnected ? `Real-Time Link (${latencyMs}ms)` : 'Connecting...'}
            </p>
          </div>
        </div>

        {/* Speedometer Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
          <div className="p-1 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
            <Gauge className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-black text-lg text-white tracking-tight">{speedKmh}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">km/h</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">{speedMs} m/s</div>
          </div>
        </div>

        {/* Hazard Pill Badge */}
        {dangerCount > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-600/70 text-rose-400 text-xs font-semibold animate-pulse shadow-lg shadow-rose-950">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>{dangerCount} DANGER HAZARD{dangerCount > 1 ? 'S' : ''}</span>
          </div>
        ) : cautionCount > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-600/70 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{cautionCount} CAUTION</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ALL CORRIDORS CLEAR</span>
          </div>
        )}
      </div>

      {/* Nearest Vehicle Telemetry Highlight */}
      {nearestVehicle && (
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Closest Target:</span>
          <span className="font-semibold text-white">{nearestVehicle.name}</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              nearestVehicle.safetyStatus === 'DANGER'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : nearestVehicle.safetyStatus === 'CAUTION'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {nearestVehicle.distance.toFixed(1)} m
          </span>
          <span className="text-slate-500 capitalize">({nearestVehicle.relativePosition})</span>
        </div>
      )}

      {/* Controls & Modals Trigger Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Camera Views Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => onCameraChange('chase')}
            title="Chase Perspective View"
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              cameraMode === 'chase'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Chase
          </button>
          <button
            onClick={() => onCameraChange('cockpit')}
            title="Cockpit Driver View"
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              cameraMode === 'cockpit'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Cockpit
          </button>
          <button
            onClick={() => onCameraChange('topDown')}
            title="Bird's Eye Top-Down View"
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              cameraMode === 'topDown'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Top-Down
          </button>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Warning Sirens' : 'Mute Warning Sirens'}
          className={`p-2 rounded-lg border transition-all ${
            isMuted
              ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              : 'bg-cyan-950/60 border-cyan-800/60 text-cyan-400 hover:bg-cyan-900/60'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* 1-Click Faculty Demo Preset */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 border border-amber-500/40 text-white text-xs font-semibold shadow-md transition-all"
          title="Faculty Presentation Live Scenarios"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span className="hidden sm:inline">Scenarios</span>
        </button>

        {/* OS Architecture Concepts */}
        <button
          onClick={onOpenOSModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold transition-all shadow-md"
          title="Operating Systems Architectural Concepts & Diagrams"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">OS Core</span>
        </button>

        {/* Warning History Log */}
        <button
          onClick={onOpenHistory}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          title="View Persistent Warning History Log"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Settings Configuration */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          title="Configure System Thresholds & Calibration"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
