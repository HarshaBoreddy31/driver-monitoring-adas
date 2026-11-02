import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vehicle } from '../../types';

interface ProceduralVehicleProps {
  vehicle: Vehicle;
  isSelected?: boolean;
}

export const ProceduralVehicle: React.FC<ProceduralVehicleProps> = ({ vehicle, isSelected = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const proximityRingRef = useRef<THREE.Mesh>(null);
  const secondaryWaveRef = useRef<THREE.Mesh>(null);

  // Smooth position interpolation and proximity zone animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetZ = -vehicle.y;
      const targetX = vehicle.x;

      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 12, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 12, delta);

      // Rotate wheels based on vehicle speed
      const wheelRotation = (vehicle.speed * delta) / 0.35;
      wheelsRef.current.forEach((w) => {
        if (w) w.rotation.x += wheelRotation;
      });
    }

    // Animate proximity warning zone expansion & pulsing
    if (proximityRingRef.current && vehicle.safetyStatus !== 'SAFE') {
      const pulseSpeed = vehicle.safetyStatus === 'DANGER' ? 8.0 : 3.5;
      const scale = 1.0 + 0.12 * Math.sin(state.clock.elapsedTime * pulseSpeed);
      proximityRingRef.current.scale.set(scale, scale, 1.0);
    }

    // Secondary shockwave ring for DANGER status
    if (secondaryWaveRef.current && vehicle.safetyStatus === 'DANGER') {
      const wavePhase = (state.clock.elapsedTime * 2.0) % 1.0;
      const waveScale = 1.0 + wavePhase * 0.8;
      secondaryWaveRef.current.scale.set(waveScale, waveScale, 1.0);
      const mat = secondaryWaveRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1.0 - wavePhase) * 0.45;
      }
    }
  });

  const { type, color, safetyStatus, length, width } = vehicle;
  const isTruck = type === 'truck';
  const isSuv = type === 'suv';

  // Dimensions
  const carHeight = isTruck ? 3.0 : isSuv ? 1.75 : 1.45;
  const bodyHeight = carHeight * 0.55;
  const cabinHeight = carHeight * 0.45;

  // Status Colors
  const statusColor =
    safetyStatus === 'DANGER' ? '#ef4444' : safetyStatus === 'CAUTION' ? '#f59e0b' : '#10b981';

  const emissiveColor =
    safetyStatus === 'DANGER' ? '#7f1d1d' : safetyStatus === 'CAUTION' ? '#78350f' : '#000000';

  const emissiveIntensity = safetyStatus === 'DANGER' ? 0.6 : safetyStatus === 'CAUTION' ? 0.3 : 0.0;

  return (
    <group ref={groupRef} position={[vehicle.x, 0, -vehicle.y]}>
      {/* 1. Vehicle Drop Shadow on Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[width + 0.5, length + 0.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>

      {/* 2. Primary Animated Proximity Hazard Zone on Road Surface */}
      {safetyStatus !== 'SAFE' && (
        <group position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh ref={proximityRingRef}>
            <ringGeometry args={[width * 0.9, width * 1.45, 32]} />
            <meshBasicMaterial
              color={statusColor}
              transparent
              opacity={safetyStatus === 'DANGER' ? 0.75 : 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Secondary expanding warning pulse ring (DANGER only) */}
          {safetyStatus === 'DANGER' && (
            <mesh ref={secondaryWaveRef}>
              <ringGeometry args={[width * 1.2, width * 1.7, 32]} />
              <meshBasicMaterial
                color="#ef4444"
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      )}

      {/* 3. Main Car Body Chassis (Glows with warning status) */}
      <mesh position={[0, bodyHeight / 2 + 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, bodyHeight, length]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>

      {/* 4. Aerodynamic Cabin Glass GreenHouse */}
      <mesh position={[0, bodyHeight + cabinHeight / 2 + 0.2, isTruck ? length * 0.25 : -0.1]} castShadow>
        <boxGeometry args={[width * 0.88, cabinHeight, isTruck ? length * 0.4 : length * 0.52]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 5. Headlights (Front Face, -Z) */}
      <mesh position={[-width * 0.35, bodyHeight / 2 + 0.25, -length / 2 - 0.01]}>
        <boxGeometry args={[0.25, 0.12, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[width * 0.35, bodyHeight / 2 + 0.25, -length / 2 - 0.01]}>
        <boxGeometry args={[0.25, 0.12, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 6. Active Brake LED Tail Lights (Rear Face, +Z) */}
      <mesh position={[-width * 0.35, bodyHeight / 2 + 0.25, length / 2 + 0.01]}>
        <boxGeometry args={[0.25, 0.12, 0.02]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[width * 0.35, bodyHeight / 2 + 0.25, length / 2 + 0.01]}>
        <boxGeometry args={[0.25, 0.12, 0.02]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* 7. Wheels & Rotating Rims */}
      {[-length * 0.32, length * 0.32].map((zPos, zIdx) =>
        [-width / 2 - 0.04, width / 2 + 0.04].map((xPos, xIdx) => {
          const wheelRadius = isTruck ? 0.45 : 0.32;
          const wheelWidth = isTruck ? 0.25 : 0.18;
          return (
            <group
              key={`wheel-${zIdx}-${xIdx}`}
              ref={(el) => {
                if (el) wheelsRef.current[zIdx * 2 + xIdx] = el;
              }}
              position={[xPos, wheelRadius, zPos]}
            >
              {/* Rubber Tire */}
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 16]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
              </mesh>
              {/* Rim Hubcap */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 12]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          );
        })
      )}

      {/* 8. Selection Target Crosshairs / Bounding Marker */}
      {isSelected && (
        <mesh position={[0, carHeight + 0.4, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.3, 0.6, 4]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}
    </group>
  );
};
