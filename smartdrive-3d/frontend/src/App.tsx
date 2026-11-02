import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { useAudioAlert } from './hooks/useAudioAlert';
import { HighwayScene } from './components/3d/HighwayScene';
import { HeaderBar } from './components/dashboard/HeaderBar';
import { DangerAlertBanner } from './components/dashboard/DangerAlertBanner';
import { NearbyVehiclesPanel } from './components/dashboard/NearbyVehiclesPanel';
import { ControlsToolbar } from './components/dashboard/ControlsToolbar';
import { DistanceGraph } from './components/dashboard/DistanceGraph';
import { WarningHistoryModal } from './components/dashboard/WarningHistoryModal';
import { SettingsModal } from './components/dashboard/SettingsModal';
import { OSArchitectureModal } from './components/dashboard/OSArchitectureModal';
import { FacultyDemoModal } from './components/dashboard/FacultyDemoModal';
import { CameraViewMode, Vehicle } from './types';
import { api } from './services/api';

export default function App() {
  const {
    state,
    isConnected,
    latencyMs,
    start,
    pause,
    resume,
    reset,
    setSpeed,
    setLane,
    applyBrake,
    triggerScenario,
  } = useSocket();

  const {
    isMuted,
    toggleMute,
    triggerSoundForStatus,
  } = useAudioAlert();

  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOSModalOpen, setIsOSModalOpen] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // Monitor safety state and trigger sound
  useEffect(() => {
    if (!state) return;
    if (state.activeWarnings.dangerCount > 0) {
      triggerSoundForStatus('DANGER');
    } else if (state.activeWarnings.cautionCount > 0) {
      triggerSoundForStatus('CAUTION');
    }
  }, [state, triggerSoundForStatus]);

  // Handle emergency brake button
  const handleEmergencyBrake = useCallback(() => {
    applyBrake(true, true);
    setTimeout(() => {
      applyBrake(false);
    }, 1500);
  }, [applyBrake]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input is focused
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        applyBrake(true, true);
      } else if (e.key === '1') {
        setLane(1);
      } else if (e.key === '2') {
        setLane(2);
      } else if (e.key === '3') {
        setLane(3);
      } else if (e.key === '4') {
        setLane(4);
      } else if (e.key === '5') {
        setLane(5);
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V') {
        // Cycle camera mode: chase -> cockpit -> topDown -> chase
        setCameraMode((prev) => (prev === 'chase' ? 'cockpit' : prev === 'cockpit' ? 'topDown' : 'chase'));
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && state?.ourVehicle) {
        setLane(Math.max(1, state.ourVehicle.lane - 1));
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && state?.ourVehicle) {
        setLane(Math.min(5, state.ourVehicle.lane + 1));
      } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && state?.ourVehicle) {
        setSpeed(Math.min(40, state.ourVehicle.speed + 2));
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && state?.ourVehicle) {
        setSpeed(Math.max(0, state.ourVehicle.speed - 2));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        applyBrake(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [applyBrake, state, setLane, setSpeed, toggleMute]);

  // Find nearest vehicle in danger
  const nearestDangerVehicle =
    state?.vehicles.find((v) => v.safetyStatus === 'DANGER') || null;

  const dangerThreshold = state?.settings.dangerDistance || 15;
  const cautionThreshold = state?.settings.cautionDistance || 30;

  const handleUpdateSettings = async (updated: any) => {
    try {
      await api.updateSettings(updated);
    } catch (e) {
      console.error('Failed to update settings', e);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <HighwayScene
          ourVehicle={state?.ourVehicle}
          vehicles={state?.vehicles || []}
          cameraMode={cameraMode}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={setSelectedVehicleId}
        />
      </div>

      {/* Top HUD Header */}
      <HeaderBar
        ourVehicle={state?.ourVehicle}
        dangerCount={state?.activeWarnings.dangerCount || 0}
        cautionCount={state?.activeWarnings.cautionCount || 0}
        nearestVehicle={state?.activeWarnings.nearestVehicle}
        isConnected={isConnected}
        latencyMs={latencyMs}
        cameraMode={cameraMode}
        onCameraChange={setCameraMode}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenOSModal={() => setIsOSModalOpen(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* Collision Risk Emergency Flashing Banner */}
      <DangerAlertBanner
        dangerCount={state?.activeWarnings.dangerCount || 0}
        cautionCount={state?.activeWarnings.cautionCount || 0}
        nearestDangerVehicle={nearestDangerVehicle}
        onEmergencyBrake={handleEmergencyBrake}
        brakeActive={state?.ourVehicle.emergencyBrakeActive || false}
      />

      {/* Right Side Radar Panel */}
      <NearbyVehiclesPanel
        vehicles={state?.vehicles || []}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        dangerThreshold={dangerThreshold}
        cautionThreshold={cautionThreshold}
      />

      {/* Live Distance Trend Recharts Graph */}
      <DistanceGraph
        vehicles={state?.vehicles || []}
        dangerThreshold={dangerThreshold}
        cautionThreshold={cautionThreshold}
      />

      {/* Bottom Floating Control Dock */}
      <ControlsToolbar
        isRunning={state?.isRunning || false}
        isPaused={state?.isPaused || false}
        ourVehicle={state?.ourVehicle}
        settings={state?.settings}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onReset={reset}
        onSpeedChange={setSpeed}
        onLaneChange={setLane}
        onBrake={applyBrake}
        onTriggerScenario={triggerScenario}
      />

      {/* SQLite Warning History Modal */}
      <WarningHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={state?.settings}
        onSave={handleUpdateSettings}
      />

      {/* OS Concepts & Architecture Modal */}
      <OSArchitectureModal
        isOpen={isOSModalOpen}
        onClose={() => setIsOSModalOpen(false)}
      />

      {/* Faculty Presentation Demo Scenarios Modal */}
      <FacultyDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onTriggerScenario={triggerScenario}
        activeScenario={state?.settings.activeScenario}
      />
    </div>
  );
}
