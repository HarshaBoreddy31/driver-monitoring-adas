import React from 'react';
import {
  X,
  Sparkles,
  AlertOctagon,
  ArrowDownToLine,
  ArrowRightLeft,
  Flame,
  CheckCircle2,
  Play,
} from 'lucide-react';

interface FacultyDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerScenario: (scenario: string) => void;
  activeScenario?: string;
}

export const FacultyDemoModal: React.FC<FacultyDemoModalProps> = ({
  isOpen,
  onClose,
  onTriggerScenario,
  activeScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'lead_braking',
      title: 'Scenario 1: Lead Vehicle Emergency Braking',
      tag: 'Front Hazard',
      tagColor: 'bg-rose-950 text-rose-400 border-rose-800',
      icon: <AlertOctagon className="w-5 h-5 text-rose-500" />,
      desc: 'The vehicle ahead in our lane drops speed rapidly from 30 m/s to 6 m/s. Demonstrates frontal collision detection, shrinking Euclidean distance, critical Time-to-Collision (TTC < 2.0s), and audible alarm escalation.',
    },
    {
      id: 'aggressive_tailgate',
      title: 'Scenario 2: High-Speed Tailgater Approach',
      tag: 'Rear Threat',
      tagColor: 'bg-amber-950 text-amber-400 border-amber-800',
      icon: <ArrowDownToLine className="w-5 h-5 text-amber-500" />,
      desc: 'An aggressive sports car approaches rapidly from behind at 38 m/s (137 km/h). Demonstrates rearward threat tracking, negative longitudinal distance handling, closing speed calculation, and safe rear buffer warnings.',
    },
    {
      id: 'blindspot_cut_in',
      title: 'Scenario 3: Blindspot Cut-In & Lane Swerve',
      tag: 'Lateral Threat',
      tagColor: 'bg-cyan-950 text-cyan-400 border-cyan-800',
      icon: <ArrowRightLeft className="w-5 h-5 text-cyan-400" />,
      desc: 'An adjacent vehicle cuts abruptly into our lane just 12m ahead. Demonstrates dynamic multi-axis Euclidean distance calculation, lateral separation tracking, and sudden danger state triggering.',
    },
    {
      id: 'multi_hazard',
      title: 'Scenario 4: Multi-Hazard Congestion Crisis',
      tag: 'Multi-Target',
      tagColor: 'bg-purple-950 text-purple-400 border-purple-800',
      icon: <Flame className="w-5 h-5 text-purple-400" />,
      desc: 'Simultaneous lead braking and aggressive tailgating. Demonstrates ADAS threat prioritization, queue throughput under load, and multi-vehicle 3D visualization rendering.',
    },
    {
      id: 'free_flow',
      title: 'Scenario 5: Free-Flowing Highway Baseline',
      tag: 'Normal',
      tagColor: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      desc: 'Restores all vehicles to standard highway cruising speeds with nominal 35m+ buffers. All radar corridors return to SAFE status.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Faculty Demo & Viva Presentation Scenarios</h2>
              <p className="text-xs text-slate-400 font-mono">
                1-click live demonstration of ADAS collision warning behaviors
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

        {/* Scenarios List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {scenarios.map((sc) => {
            const isActive = activeScenario === sc.id;
            return (
              <div
                key={sc.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                      {sc.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{sc.title}</h3>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${sc.tagColor}`}
                        >
                          {sc.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{sc.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onTriggerScenario(sc.id);
                      onClose();
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isActive ? 'Active' : 'Trigger'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
