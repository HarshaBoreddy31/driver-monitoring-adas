import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DangerAlertBanner } from '../components/dashboard/DangerAlertBanner';
import { HeaderBar } from '../components/dashboard/HeaderBar';
import { NearbyVehiclesPanel } from '../components/dashboard/NearbyVehiclesPanel';
import { Vehicle, OurVehicle } from '../types';

describe('Stage 5: Frontend Dashboard UI Components Unit Tests', () => {
  const mockOurVehicle: OurVehicle = {
    id: 'our-vehicle',
    name: 'Reference Vehicle (Our Car)',
    x: 0,
    y: 0,
    lane: 3,
    speed: 25.0, // 90 km/h
    targetSpeed: 25.0,
    acceleration: 0,
    brakeActive: false,
    emergencyBrakeActive: false,
  };

  const mockVehicles: Vehicle[] = [
    {
      id: 'v1',
      name: 'Lead SUV',
      type: 'suv',
      color: '#ef4444',
      lane: 3,
      targetLane: 3,
      x: 0,
      y: 14.5,
      speed: 15.0,
      targetSpeed: 15.0,
      acceleration: 0,
      direction: 'same',
      length: 4.8,
      width: 1.9,
      distance: 14.5,
      longitudinalDistance: 14.5,
      lateralDistance: 0,
      relativeVelocity: -10.0,
      relativePosition: 'front',
      safetyStatus: 'DANGER',
      timeToCollision: 1.45,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'v2',
      name: 'Sedan Left',
      type: 'sedan',
      color: '#38bdf8',
      lane: 2,
      targetLane: 2,
      x: -3.6,
      y: 28.0,
      speed: 24.0,
      targetSpeed: 24.0,
      acceleration: 0,
      direction: 'same',
      length: 4.5,
      width: 1.8,
      distance: 28.23,
      longitudinalDistance: 28.0,
      lateralDistance: -3.6,
      relativeVelocity: -1.0,
      relativePosition: 'front-left',
      safetyStatus: 'CAUTION',
      timeToCollision: 28.0,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'v3',
      name: 'Cruiser Far',
      type: 'sedan',
      color: '#10b981',
      lane: 4,
      targetLane: 4,
      x: 3.6,
      y: 60.0,
      speed: 25.0,
      targetSpeed: 25.0,
      acceleration: 0,
      direction: 'same',
      length: 4.5,
      width: 1.8,
      distance: 60.11,
      longitudinalDistance: 60.0,
      lateralDistance: 3.6,
      relativeVelocity: 0,
      relativePosition: 'front-right',
      safetyStatus: 'SAFE',
      timeToCollision: null,
      updatedAt: new Date().toISOString(),
    },
  ];

  it('DangerAlertBanner renders urgent collision alert when danger count > 0', () => {
    const handleBrake = vi.fn();
    render(
      <DangerAlertBanner
        dangerCount={1}
        cautionCount={0}
        nearestDangerVehicle={mockVehicles[0]}
        onEmergencyBrake={handleBrake}
        brakeActive={false}
      />
    );

    expect(screen.getByText(/COLLISION HAZARD DETECTED/i)).toBeDefined();
    expect(screen.getByText(/Lead SUV/i)).toBeDefined();
    expect(screen.getByText(/14.5/i)).toBeDefined();
    expect(screen.getByText(/TTC:/i)).toBeDefined();
  });

  it('DangerAlertBanner renders nothing when all corridors are clear', () => {
    const { container } = render(
      <DangerAlertBanner
        dangerCount={0}
        cautionCount={0}
        nearestDangerVehicle={null}
        onEmergencyBrake={vi.fn()}
        brakeActive={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('HeaderBar renders speedometer with 90 km/h and simulated data badge', () => {
    render(
      <HeaderBar
        ourVehicle={mockOurVehicle}
        dangerCount={1}
        cautionCount={0}
        nearestVehicle={{
          id: 'v1',
          name: 'Lead SUV',
          distance: 14.5,
          relativePosition: 'front',
          safetyStatus: 'DANGER',
        }}
        isConnected={true}
        latencyMs={8}
        cameraMode="chase"
        onCameraChange={vi.fn()}
        isMuted={false}
        onToggleMute={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenOSModal={vi.fn()}
        onOpenDemoModal={vi.fn()}
      />
    );

    // Speed 25 m/s = 90 km/h
    expect(screen.getByText('90')).toBeDefined();
    expect(screen.getByText('25.0 m/s')).toBeDefined();
    expect(screen.getByText(/SMARTDRIVE 3D/i)).toBeDefined();
    expect(screen.getByText(/SIMULATED DATA/i)).toBeDefined();
  });

  it('NearbyVehiclesPanel renders sorted vehicle list with distances', () => {
    render(
      <NearbyVehiclesPanel
        vehicles={mockVehicles}
        selectedVehicleId={null}
        onSelectVehicle={vi.fn()}
        dangerThreshold={5}
        cautionThreshold={10}
      />
    );

    expect(screen.getByText(/Surrounding Radar/i)).toBeDefined();
    expect(screen.getByText(/Lead SUV/i)).toBeDefined();
    expect(screen.getByText('14.5')).toBeDefined();
    expect(screen.getByText(/Sedan Left/i)).toBeDefined();
    expect(screen.getByText('28.2')).toBeDefined();
    expect(screen.getByText(/Cruiser Far/i)).toBeDefined();
    expect(screen.getByText('60.1')).toBeDefined();
  });
});
