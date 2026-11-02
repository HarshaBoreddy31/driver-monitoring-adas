import React, { useState, useEffect } from 'react';
import { X, History, Trash2, RefreshCw, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { WarningEvent } from '../../types';

interface WarningHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WarningHistoryModal: React.FC<WarningHistoryModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<WarningEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'DANGER' | 'CAUTION'>('ALL');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.fetchEvents(100);
      if (res.success && res.events) {
        setEvents(res.events);
      }
    } catch (e) {
      console.error('Failed to load warning history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  const handleClear = async () => {
    if (confirm('Clear all stored warning history events from SQLite?')) {
      await api.clearEvents();
      setEvents([]);
    }
  };

  if (!isOpen) return null;

  const filteredEvents = events.filter((ev) => {
    if (filter === 'DANGER') return ev.newState === 'DANGER';
    if (filter === 'CAUTION') return ev.newState === 'CAUTION';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Warning Event History (SQLite DB)</h2>
              <p className="text-xs text-slate-400 font-mono">
                Persistent event audit log with deterministic timestamping
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadEvents}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh Events"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClear}
              className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/60 border border-transparent hover:border-rose-900 transition"
              title="Clear SQLite Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 text-xs">
          <span className="text-slate-400 font-medium">Filter:</span>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filter === 'ALL'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilter('DANGER')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filter === 'DANGER'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-rose-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Danger ({events.filter((e) => e.newState === 'DANGER').length})
          </button>
          <button
            onClick={() => setFilter('CAUTION')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filter === 'CAUTION'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Caution ({events.filter((e) => e.newState === 'CAUTION').length})
          </button>
        </div>

        {/* Event List Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-sm">
              {loading ? 'Querying SQLite database...' : 'No warning events recorded yet.'}
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      ev.newState === 'DANGER'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : ev.newState === 'CAUTION'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {ev.newState === 'DANGER' ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : ev.newState === 'CAUTION' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ev.vehicleName}</span>
                      <span className="text-xs font-mono text-slate-400 capitalize">
                        ({ev.relativePosition})
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ev.previousState} &rarr; {ev.newState}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap gap-x-3">
                      <span>Distance: <b className="text-white">{ev.distance.toFixed(1)}m</b></span>
                      <span>Rel Speed: <b className="text-white">{(ev.relativeVelocity * 3.6).toFixed(0)} km/h</b></span>
                      {ev.timeToCollision !== null && (
                        <span>TTC: <b className="text-rose-400">{ev.timeToCollision.toFixed(1)}s</b></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-500 shrink-0">
                  {new Date(ev.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
