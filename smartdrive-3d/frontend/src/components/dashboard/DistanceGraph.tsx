import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Vehicle } from '../../types';

interface DistanceGraphProps {
  vehicles: Vehicle[];
  dangerThreshold: number;
  cautionThreshold: number;
}

interface HistoryPoint {
  time: string;
  [key: string]: number | string;
}

export const DistanceGraph: React.FC<DistanceGraphProps> = ({
  vehicles,
  dangerThreshold,
  cautionThreshold,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dataPoints, setDataPoints] = useState<HistoryPoint[]>([]);
  const lastSampleTimeRef = useRef<number>(0);

  // Sample closest 3 vehicles every 500ms
  useEffect(() => {
    const now = Date.now();
    if (now - lastSampleTimeRef.current < 500) return;
    lastSampleTimeRef.current = now;

    if (!vehicles || vehicles.length === 0) return;

    const sorted = [...vehicles].sort((a, b) => a.distance - b.distance).slice(0, 3);
    const timeStr = new Date().toLocaleTimeString([], {
      hour12: false,
      minute: '2-digit',
      second: '2-digit',
    });

    const newPoint: HistoryPoint = { time: timeStr };
    sorted.forEach((v) => {
      newPoint[v.name] = parseFloat(v.distance.toFixed(1));
    });

    setDataPoints((prev) => [...prev.slice(-25), newPoint]);
  }, [vehicles]);

  const colors = ['#06b6d4', '#f59e0b', '#ec4899', '#a855f7'];

  return (
    <div className="fixed bottom-20 left-4 z-20 transition-all">
      {/* Floating graph toggle */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white shadow-xl hover:border-cyan-500/50 transition-all text-xs font-semibold"
        >
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Live Distance Telemetry</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-3 text-white flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 px-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Proximity Trends (m)
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 transition"
              title="Minimize Graph"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fontSize: 9 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 9 }}
                  domain={[0, 70]}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    fontSize: '11px',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine
                  y={dangerThreshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'DANGER', fill: '#ef4444', fontSize: 9, position: 'right' }}
                />
                <ReferenceLine
                  y={cautionThreshold}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: 'CAUTION', fill: '#f59e0b', fontSize: 9, position: 'right' }}
                />

                {/* Extract dynamic vehicle keys */}
                {dataPoints.length > 0 &&
                  Object.keys(dataPoints[dataPoints.length - 1])
                    .filter((k) => k !== 'time')
                    .map((key, idx) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
