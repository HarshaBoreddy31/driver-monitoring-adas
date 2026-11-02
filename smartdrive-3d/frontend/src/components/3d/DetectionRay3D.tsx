import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Vehicle, OurVehicle } from '../../types';

interface DetectionRay3DProps {
  ourVehicle: OurVehicle;
  vehicle: Vehicle;
}

export const DetectionRay3D: React.FC<DetectionRay3DProps> = ({ ourVehicle, vehicle }) => {
  const { safetyStatus } = vehicle;

  const color =
    safetyStatus === 'DANGER' ? '#ef4444' : safetyStatus === 'CAUTION' ? '#f59e0b' : '#10b981';

  const opacity = safetyStatus === 'DANGER' ? 0.9 : safetyStatus === 'CAUTION' ? 0.6 : 0.25;

  const points = useMemo<[number, number, number][]>(() => {
    // Connect our vehicle's bumper to target vehicle's contact point
    const ourBumperZ = vehicle.y >= 0 ? -2.4 : 2.4; // Front or rear bumper
    const targetBumperZ = vehicle.y >= 0 ? -vehicle.y + 2.3 : -vehicle.y - 2.3;

    return [
      [ourVehicle.x, 0.4, ourBumperZ],
      [vehicle.x, 0.4, targetBumperZ],
    ];
  }, [ourVehicle.x, vehicle.x, vehicle.y]);

  return (
    <group>
      {/* 3D Directional Detection Ray Line */}
      <Line
        points={points}
        color={color}
        lineWidth={safetyStatus === 'DANGER' ? 3 : 2}
        transparent
        opacity={opacity}
        dashed={safetyStatus !== 'DANGER'}
        dashScale={1.5}
        dashSize={1}
        gapSize={0.5}
      />

      {/* Pulsing Target Ground Point Indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[vehicle.x, 0.05, -vehicle.y]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color={color} transparent opacity={opacity + 0.15} />
      </mesh>
    </group>
  );
};
