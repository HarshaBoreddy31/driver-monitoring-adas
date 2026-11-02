import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Layers,
  Activity,
  HardDrive,
  Workflow,
  Radio,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';

interface OSArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OSMetrics {
  uptimeSeconds: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  eventQueue: {
    size: number;
    capacity: number;
    highWatermark: number;
    totalEnqueued: number;
    totalDequeued: number;
    totalDropped: number;
    dropPolicy: string;
  };
  simulation: {
    isRunning: boolean;
    isPaused: boolean;
    tickCount: number;
    activeVehicles: number;
  };
}

export const OSArchitectureModal: React.FC<OSArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'metrics'>('concepts');
  const [metrics, setMetrics] = useState<OSMetrics | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMetrics = async () => {
      try {
        const data = await api.fetchOsMetrics();
        if (data.success) {
          setMetrics(data.metrics);
        }
      } catch (e) {
        // Ignored
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/40">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Operating Systems Core Architecture & Theory
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Academic mapping of ADAS simulation to core OS primitives
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('concepts')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  activeTab === 'concepts'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OS Concepts
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  activeTab === 'metrics'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live OS Telemetry
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'concepts' ? (
            <div className="space-y-4 text-xs">
              {/* Concept 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-300 text-sm">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>1. Periodic Cyclic Real-Time Task Scheduling</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Real-time automotive safety systems cannot rely on ad-hoc polling. The backend
                  engine operates on a deterministic <b>10 Hz (100ms) cyclic executive timer loop</b>
                  . In each tick period, the scheduler executes three sequential task phases:
                  Kinematic Integration &rarr; Authoritative Distance Geometry &rarr; Warning State
                  Evaluation.
                </p>
              </div>

              {/* Concept 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm">
                  <Workflow className="w-4 h-4 text-cyan-400" />
                  <span>2. Producer-Consumer Architecture with Bounded Queue</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The simulation engine acts as a <b>Producer</b> emitting safety threshold
                  breaches, while the persistence layer (SQLite) and Socket.IO dispatcher act as
                  <b> Consumers</b>. Events pass through a custom{' '}
                  <code className="text-cyan-300 font-mono">BoundedEventQueue</code> (capacity 100)
                  with high-watermark tracking and drop policies to prevent unbounded memory growth
                  during transient traffic storms.
                </p>
              </div>

              {/* Concept 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>3. State Machine with Hysteresis & Deadband Suppression</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  To avoid high-frequency warning oscillation (thrashing) when a vehicle hovers right
                  at the 15m or 30m boundary, the warning engine incorporates a <b>1.0m hysteresis
                  deadband</b>. A transition from DANGER to CAUTION requires exceeding 16.0m, preventing
                  chatter and alarm fatigue. Duplicate events on identical consecutive ticks are
                  suppressed.
                </p>
              </div>

              {/* Concept 4 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>4. Critical Sections, Atomic State Transitions, and Concurrency</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Node.js executes JavaScript on a single-threaded event loop, but concurrent
                  asynchronous I/O (WebSocket broadcasts, HTTP requests, file I/O) can introduce
                  race conditions. In-memory vehicle positions are updated atomically in a dedicated
                  synchronous execution phase before client read operations occur.
                </p>
              </div>

              {/* Concept 5 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>5. Inter-Process & Network Communication (IPC / WebSockets)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Real-time telemetry streaming uses persistent bi-directional WebSockets (Socket.IO)
                  with binary compression fallback. Initial synchronization transmits the entire
                  state snapshot, followed by high-frequency delta broadcasts and discrete priority
                  alerts (<code className="text-emerald-300 font-mono">warning:triggered</code>).
                </p>
              </div>

              {/* Concept 6 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>6. Persistent Storage Subsystem & Write Buffering</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Warning events are persisted to SQLite using native Node.js 24{' '}
                  <code className="text-blue-300 font-mono">DatabaseSync</code> with WAL
                  (Write-Ahead Logging) journaling for atomic, non-blocking crash recovery. An
                  in-memory FIFO fallback ring buffer guarantees zero lost events if disk I/O stalls.
                </p>
              </div>

              {/* Concept 7 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-purple-300 text-sm">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>7. Graceful Shutdown & POSIX Signal Trapping</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The backend registers OS signal handlers for <b>SIGINT</b> and <b>SIGTERM</b>.
                  Upon termination, it flushes pending queue buffers to disk, cleanly terminates
                  client WebSocket links, stops the simulation interval timer, and exits with code 0.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bounded Queue Card */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Workflow className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                          OS Bounded Event Queue
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                        {metrics.eventQueue.size} / {metrics.eventQueue.capacity} items
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (metrics.eventQueue.size / metrics.eventQueue.capacity) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>
                        High Watermark:{' '}
                        <b className="text-white">{metrics.eventQueue.highWatermark}</b>
                      </div>
                      <div>
                        Total Enqueued:{' '}
                        <b className="text-emerald-400">{metrics.eventQueue.totalEnqueued}</b>
                      </div>
                      <div>
                        Total Dequeued:{' '}
                        <b className="text-indigo-400">{metrics.eventQueue.totalDequeued}</b>
                      </div>
                      <div>
                        Total Dropped:{' '}
                        <b className={metrics.eventQueue.totalDropped > 0 ? 'text-rose-400' : 'text-slate-400'}>
                          {metrics.eventQueue.totalDropped}
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Engine & Memory Card */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                          Process & Memory Telemetry
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-400">
                        Uptime: {metrics.uptimeSeconds.toFixed(0)}s
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>
                        Heap Used:{' '}
                        <b className="text-white">
                          {(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB
                        </b>
                      </div>
                      <div>
                        Heap Total:{' '}
                        <b className="text-white">
                          {(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB
                        </b>
                      </div>
                      <div>
                        Process RSS:{' '}
                        <b className="text-white">
                          {(metrics.memoryUsage.rss / 1024 / 1024).toFixed(1)} MB
                        </b>
                      </div>
                      <div>
                        Tick Counter:{' '}
                        <b className="text-cyan-400">{metrics.simulation.tickCount}</b>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  Connecting to OS metrics API...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
