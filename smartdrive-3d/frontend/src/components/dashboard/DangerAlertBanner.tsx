import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { SafetyStatus, Vehicle } from '../../types';

interface DangerAlertBannerProps {
  dangerCount: number;
  cautionCount: number;
  nearestDangerVehicle: Vehicle | null;
  onEmergencyBrake: () => void;
  brakeActive: boolean;
}

export const DangerAlertBanner: React.FC<DangerAlertBannerProps> = ({
  dangerCount,
  cautionCount,
  nearestDangerVehicle,
  onEmergencyBrake,
  brakeActive,
}) => {
  if (dangerCount === 0 && cautionCount === 0) {
    return null;
  }

  const isDanger = dangerCount > 0;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl pointer-events-auto">
      <div
        className={`px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 transition-all ${
          isDanger
            ? 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-rose-900/50 animate-pulse'
            : 'bg-amber-950/85 border-amber-500/80 text-amber-100 shadow-amber-900/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isDanger ? 'bg-rose-600/80 text-white' : 'bg-amber-500/80 text-slate-950'
            }`}
          >
            {isDanger ? (
              <AlertOctagon className="w-5 h-5 animate-spin-slow" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wide">
                {isDanger
                  ? `COLLISION HAZARD DETECTED (${dangerCount} IN DANGER ZONE)`
                  : `PROXIMITY CAUTION (${cautionCount} APPROACHING)`}
              </span>
              {nearestDangerVehicle?.timeToCollision !== null &&
                nearestDangerVehicle?.timeToCollision !== undefined && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-rose-200 border border-rose-400/30">
                    TTC: {nearestDangerVehicle.timeToCollision.toFixed(1)}s
                  </span>
                )}
            </div>
            {nearestDangerVehicle ? (
              <p className="text-xs text-rose-200/90 font-mono">
                Target <span className="font-bold text-white">{nearestDangerVehicle.name}</span> is{' '}
                <span className="font-bold text-white underline">
                  {nearestDangerVehicle.distance.toFixed(1)} m
                </span>{' '}
                ({nearestDangerVehicle.relativePosition.toUpperCase()})
              </p>
            ) : (
              <p className="text-xs text-amber-200/90">Maintain safe buffer distance and check mirrors.</p>
            )}
          </div>
        </div>

        {isDanger && (
          <button
            onClick={onEmergencyBrake}
            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-md ${
              brakeActive
                ? 'bg-white text-rose-700 animate-pulse'
                : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{brakeActive ? 'BRAKING' : 'E-BRAKE'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
