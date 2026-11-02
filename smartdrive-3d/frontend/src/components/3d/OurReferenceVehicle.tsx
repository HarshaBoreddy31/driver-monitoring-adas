import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OurVehicle } from '../../types';

interface OurReferenceVehicleProps {
  vehicle: OurVehicle;
}

export const OurReferenceVehicle: React.FC<OurReferenceVehicleProps> = ({ vehicle }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const radarSweepRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Smooth lateral position tracking
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, vehicle.x, 22, delta);

      // Pitch tilt based on acceleration / braking
      const pitchTarget = vehicle.emergencyBrakeActive ? 0.08 : vehicle.brakeActive ? 0.04 : -vehicle.acceleration * 0.005;
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, pitchTarget, 10, delta);

      // Wheel rotation
      const wheelRotation = (vehicle.speed * delta) / 0.34;
      wheelsRef.current.forEach((w) => {
        if (w) w.rotation.x += wheelRotation;
      });

      // Radar scan pulse
      if (radarSweepRef.current) {
        radarSweepRef.current.scale.x = 1.0 + Math.sin(Date.now() * 0.005) * 0.15;
        radarSweepRef.current.scale.y = 1.0 + Math.sin(Date.now() * 0.005) * 0.15;
      }
    }
  });

  const width = 1.95;
  const length = 4.75;
  const height = 1.42;

  return (
    <group ref={groupRef} position={[vehicle.x, 0, 0]}>
      {/* 1. Vehicle Drop Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[width + 0.6, length + 0.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.65} />
      </mesh>

      {/* 2. Forward Radar Sensor Arc Wave on Ground */}
      <mesh ref={radarSweepRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -length * 0.7]}>
        <ringGeometry args={[length * 0.8, length * 1.5, 32, 1, Math.PI * 0.25, Math.PI * 0.5]} />
        <meshBasicMaterial color="#00f2fe" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* 3. Aerodynamic Sports Chassis Body */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.48, length]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Cyan Cyber Racing Stripes & Accents */}
      <mesh position={[0, 0.67, 0]}>
        <boxGeometry args={[0.22, 0.02, length * 0.95]} />
        <meshStandardMaterial color="#00f2fe" emissive="#00f2fe" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-width * 0.48, 0.35, 0]}>
        <boxGeometry args={[0.04, 0.15, length * 0.8]} />
        <meshStandardMaterial color="#00f2fe" emissive="#00f2fe" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[width * 0.48, 0.35, 0]}>
        <boxGeometry args={[0.04, 0.15, length * 0.8]} />
        <meshStandardMaterial color="#00f2fe" emissive="#00f2fe" emissiveIntensity={1.2} />
      </mesh>

      {/* 4. Sleek Aerodynamic Cabin */}
      <mesh position={[0, 0.95, -length * 0.08]} castShadow>
        <boxGeometry args={[width * 0.84, 0.55, length * 0.52]} />
        <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.95} />
      </mesh>

      {/* 5. Powerful LED Headlights */}
      <mesh position={[-width * 0.38, 0.45, -length * 0.51]}>
        <boxGeometry args={[0.26, 0.12, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[width * 0.38, 0.45, -length * 0.51]}>
        <boxGeometry args={[0.26, 0.12, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={2.0} />
      </mesh>

      {/* 6. Active Taillights / Brake Lights */}
      <mesh position={[-width * 0.38, 0.45, length * 0.51]}>
        <boxGeometry args={[0.28, 0.12, 0.04]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={vehicle.brakeActive || vehicle.emergencyBrakeActive ? 4.0 : 1.2}
        />
      </mesh>
      <mesh position={[width * 0.38, 0.45, length * 0.51]}>
        <boxGeometry args={[0.28, 0.12, 0.04]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={vehicle.brakeActive || vehicle.emergencyBrakeActive ? 4.0 : 1.2}
        />
      </mesh>

      {/* 7. Wheels */}
      {[-1, 1].map((sideX) =>
        [-1, 1].map((sideZ) => {
          const wheelX = sideX * (width * 0.48);
          const wheelZ = sideZ * (length * 0.32);
          const wheelRadius = 0.34;

          return (
            <group
              key={`our-wheel-${sideX}-${sideZ}`}
              position={[wheelX, wheelRadius, wheelZ]}
              ref={(el) => {
                if (el && !wheelsRef.current.includes(el)) wheelsRef.current.push(el);
              }}
            >
              {/* Tire */}
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[wheelRadius, wheelRadius, 0.25, 20]} />
                <meshStandardMaterial color="#090d16" roughness={0.7} />
              </mesh>
              {/* Cyan Turbine Alloy Rim */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[wheelRadius * 0.72, wheelRadius * 0.72, 0.27, 16]} />
                <meshStandardMaterial color="#00f2fe" metalness={0.9} roughness={0.2} emissive="#00f2fe" emissiveIntensity={0.4} />
              </mesh>
            </group>
          );
        })
      )}
    </group>
  );
};
