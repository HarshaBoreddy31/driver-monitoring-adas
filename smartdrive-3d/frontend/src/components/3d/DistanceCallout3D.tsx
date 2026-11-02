import React from 'react';
import { Html } from '@react-three/drei';
import { Vehicle } from '../../types';

interface DistanceCallout3DProps {
  vehicle: Vehicle;
}

export const DistanceCallout3D: React.FC<DistanceCallout3DProps> = ({ vehicle }) => {
  const { safetyStatus, distance, relativePosition, relativeVelocity, timeToCollision } = vehicle;

  const statusStyles = {
    DANGER: {
      border: 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]',
      bg: 'bg-red-950/90 text-red-200',
      badge: 'bg-red-600 text-white',
      text: 'text-red-400',
    },
    CAUTION: {
      border: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      bg: 'bg-amber-950/90 text-amber-200',
      badge: 'bg-amber-600 text-white',
      text: 'text-amber-400',
    },
    SAFE: {
      border: 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      bg: 'bg-slate-900/90 text-emerald-200',
      badge: 'bg-emerald-600 text-white',
      text: 'text-emerald-400',
    },
  }[safetyStatus];

  const formattedPosition = relativePosition
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('-');

  const heightOffset = vehicle.type === 'truck' ? 4.2 : 2.6;

  return (
    <group position={[vehicle.x, heightOffset, -vehicle.y]}>
      <Html center distanceFactor={28} zIndexRange={[100, 0]}>
        <div
          className={`px-3 py-1.5 rounded-xl backdrop-blur-md border ${statusStyles.border} ${statusStyles.bg} transition-all duration-300 pointer-events-none select-none text-center min-w-[140px]`}
        >
          {/* Top Title: Position Label */}
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className={`inline-block w-2 h-2 rounded-full ${statusStyles.badge} animate-pulse`} />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-100">
              {formattedPosition}
            </span>
          </div>

          {/* Large Authoritative Distance in Meters */}
          <div className="font-tech text-lg font-bold tracking-tight text-white flex items-center justify-center gap-1">
            <span>{distance.toFixed(1)}</span>
            <span className="text-xs font-normal text-slate-300">m</span>
          </div>

          {/* Subtitle: Relative Velocity / TTC when closing in */}
          {relativeVelocity < -0.5 && (
            <div className="text-[9px] font-mono mt-0.5 text-amber-300 flex items-center justify-center gap-1">
              <span>Closing:</span>
              <span className="font-semibold">{Math.abs(relativeVelocity).toFixed(1)} m/s</span>
              {timeToCollision !== null && (
                <span className="text-red-400 font-bold ml-1">TTC {timeToCollision.toFixed(1)}s</span>
              )}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
