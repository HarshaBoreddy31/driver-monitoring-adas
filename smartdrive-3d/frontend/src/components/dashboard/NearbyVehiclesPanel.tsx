import React, { useState } from 'react';
import {
  Car,
  Truck,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  Shield,
  Crosshair,
} from 'lucide-react';
import { Vehicle } from '../../types';

interface NearbyVehiclesPanelProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string | null) => void;
  dangerThreshold: number;
  cautionThreshold: number;
}

export const NearbyVehiclesPanel: React.FC<NearbyVehiclesPanelProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  dangerThreshold,
  cautionThreshold,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Sort vehicles by Euclidean distance ascending (closest first)
  const sortedVehicles = [...vehicles].sort((a, b) => a.distance - b.distance);

  const getStatusBadge = (status: Vehicle['safetyStatus']) => {
    switch (status) {
      case 'DANGER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            DANGER
          </span>
        );
      case 'CAUTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            CAUTION
          </span>
        );
      case 'SAFE':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            SAFE
          </span>
        );
    }
  };

  const formatRelPosition = (pos: string) => {
    return pos.replace('-', ' ').toUpperCase();
  };

  return (
    <div
      className={`fixed top-16 right-3 z-20 transition-all duration-300 flex items-start ${
        isCollapsed ? 'translate-x-[calc(100%-2.5rem)]' : 'translate-x-0'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mt-4 p-1.5 bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80 rounded-l-lg shadow-xl backdrop-blur-md"
        title={isCollapsed ? 'Expand Radar Panel' : 'Collapse Radar Panel'}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Main Glass Panel */}
      <div className="w-80 md:w-96 max-h-[calc(100vh-6rem)] overflow-y-auto bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-3 text-white flex flex-col gap-2">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Surrounding Radar ({vehicles.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Range: 100m</span>
        </div>

        {/* Source Telemetry Indicator */}
        <div className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span className="text-indigo-400 font-semibold">Simulated ADAS Model</span>
          <span className="text-cyan-400">Backend Authoritative (10Hz)</span>
        </div>

        {/* Threshold Legend */}
        <div className="flex flex-col gap-1 text-[10px] font-mono py-1 px-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 font-semibold">Front (Same):</span>
            <div className="flex items-center gap-2">
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &le;{dangerThreshold}m Danger
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> &le;{cautionThreshold}m Warning
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> &gt;10m Safe
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/60 pt-1">
            <span className="text-slate-400 font-semibold">Side Lanes:</span>
            <div className="flex items-center gap-2">
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &le;0.5m Danger
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> &le;1.0m Warning
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> &gt;1.0m Safe
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="space-y-1.5 overflow-y-auto pr-1">
          {sortedVehicles.map((v) => {
            const isSelected = selectedVehicleId === v.id;
            const isClosing = v.relativeVelocity > 0.3;
            const isOpening = v.relativeVelocity < -0.3;

            return (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(isSelected ? null : v.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-950'
                    : v.safetyStatus === 'DANGER'
                    ? 'bg-rose-950/40 border-rose-700/60 hover:bg-rose-900/40'
                    : v.safetyStatus === 'CAUTION'
                    ? 'bg-amber-950/30 border-amber-700/50 hover:bg-amber-900/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Header row: Name, Type, Status */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {v.type === 'truck' ? (
                      <Truck className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Car className="w-4 h-4 text-cyan-400" />
                    )}
                    <span className="font-semibold text-xs text-white">{v.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">L{v.lane}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusBadge(v.safetyStatus)}
                  </div>
                </div>

                {/* Metric Euclidean Distance & Relative Position */}
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-base font-mono font-black text-white flex items-baseline gap-1">
                    <span
                      className={
                        v.safetyStatus === 'DANGER'
                          ? 'text-rose-400'
                          : v.safetyStatus === 'CAUTION'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {v.distance.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">m</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300 font-medium">
                    {formatRelPosition(v.relativePosition)}
                  </span>
                </div>

                {/* Coordinates & Velocity Details */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 pt-1 border-t border-slate-800/50">
                  <div>
                    <span className="text-slate-500">Lon/Lat: </span>
                    <span>
                      {v.longitudinalDistance >= 0 ? '+' : ''}
                      {v.longitudinalDistance.toFixed(1)}m / {v.lateralDistance >= 0 ? '+' : ''}
                      {v.lateralDistance.toFixed(1)}m
                    </span>
                  </div>
                  <div className="text-right flex items-center justify-end gap-1">
                    <span className="text-slate-500">&Delta;v: </span>
                    <span
                      className={`font-semibold ${
                        isClosing ? 'text-rose-400' : isOpening ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {v.relativeVelocity > 0 ? '+' : ''}
                      {(v.relativeVelocity * 3.6).toFixed(0)} km/h
                    </span>
                    {isClosing ? (
                      <ArrowUpRight className="w-3 h-3 text-rose-400" />
                    ) : isOpening ? (
                      <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Minus className="w-3 h-3 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Time-To-Collision Indicator */}
                {v.timeToCollision !== null && (
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50 text-rose-300">
                    <span>Time to Collision (TTC):</span>
                    <span className="font-bold text-rose-200">
                      {v.timeToCollision.toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
