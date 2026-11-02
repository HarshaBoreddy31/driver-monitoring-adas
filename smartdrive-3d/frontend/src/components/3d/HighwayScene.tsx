import React from 'react';
import { Canvas } from '@react-three/fiber';
import { RoadHighway } from './RoadHighway';
import { OurReferenceVehicle } from './OurReferenceVehicle';
import { ProceduralVehicle } from './ProceduralVehicle';
import { DistanceCallout3D } from './DistanceCallout3D';
import { DetectionRay3D } from './DetectionRay3D';
import { CameraManager } from './CameraManager';
import { SimulationState, CameraViewMode, OurVehicle, Vehicle } from '../../types';

export interface HighwaySceneProps {
  simulationState?: SimulationState | null;
  ourVehicle?: OurVehicle;
  vehicles?: Vehicle[];
  cameraMode?: CameraViewMode;
  viewMode?: CameraViewMode;
  selectedVehicleId?: string | null;
  onSelectVehicle?: (id: string | null) => void;
  showDetectionRays?: boolean;
  showDistanceLabels?: boolean;
}

const defaultOurVehicle: OurVehicle = {
  id: 'our-vehicle',
  name: 'Our Vehicle',
  x: 0,
  y: 0,
  lane: 3,
  speed: 25,
  targetSpeed: 25,
  acceleration: 0,
  brakeActive: false,
  emergencyBrakeActive: false,
};

export const HighwayScene: React.FC<HighwaySceneProps> = ({
  simulationState,
  ourVehicle: propOurVehicle,
  vehicles: propVehicles,
  cameraMode = 'chase',
  viewMode,
  selectedVehicleId = null,
  showDetectionRays = true,
  showDistanceLabels = true,
}) => {
  const activeOurVehicle = propOurVehicle || simulationState?.ourVehicle || defaultOurVehicle;
  const activeVehicles = propVehicles || simulationState?.vehicles || [];
  const activeCameraMode = viewMode || cameraMode || 'chase';
  const laneWidth = simulationState?.settings?.laneWidth || 3.6;

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 7.5, 14.5], fov: 50, near: 0.1, far: 400 }}
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
      >
        {/* Dynamic Smooth Camera Controller */}
        <CameraManager viewMode={activeCameraMode} ourVehicle={activeOurVehicle} />

        {/* Deep Horizon Atmospheric Fog */}
        <color attach="background" args={['#070a13']} />
        <fog attach="fog" args={['#070a13', 45, 220]} />

        {/* Lighting Setup */}
        <ambientLight intensity={0.55} color="#94a3b8" />
        <directionalLight
          position={[25, 45, 20]}
          intensity={1.2}
          color="#f8fafc"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={10}
          shadow-camera-far={120}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={60}
          shadow-camera-bottom={-30}
          shadow-bias={-0.0005}
        />
        <pointLight position={[0, 12, -10]} intensity={0.4} color="#38bdf8" distance={40} />

        {/* 1. Realistic Multi-Lane Highway with Scrolling Lane Markings */}
        <RoadHighway speedMs={activeOurVehicle.speed} laneWidth={laneWidth} />

        {/* 2. Our Reference Vehicle */}
        <OurReferenceVehicle vehicle={activeOurVehicle} />

        {/* 3. Surrounding Vehicles */}
        {activeVehicles.map((v) => (
          <group key={v.id}>
            <ProceduralVehicle vehicle={v} isSelected={v.id === selectedVehicleId} />

            {/* 3D Directional Detection Rays connecting our car to target */}
            {showDetectionRays && <DetectionRay3D ourVehicle={activeOurVehicle} vehicle={v} />}

            {/* 3D Distance Callout Badges above target */}
            {showDistanceLabels && <DistanceCallout3D vehicle={v} />}
          </group>
        ))}
      </Canvas>
    </div>
  );
};
