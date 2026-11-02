import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoadHighwayProps {
  speedMs: number;
  laneWidth?: number;
}

export const RoadHighway: React.FC<RoadHighwayProps> = ({ speedMs, laneWidth = 3.6 }) => {
  const roadMarkingsRef = useRef<THREE.Group>(null);
  const scrollOffsetRef = useRef<number>(0);

  // Animate lane markings moving backward to create realistic forward velocity
  useFrame((_, delta) => {
    if (roadMarkingsRef.current) {
      scrollOffsetRef.current = (scrollOffsetRef.current + speedMs * delta) % 8.0;
      roadMarkingsRef.current.position.z = scrollOffsetRef.current;
    }
  });

  const ROAD_LENGTH = 320;
  const ROAD_WIDTH = laneWidth * 5 + 4.0; // 5 lanes + shoulders

  return (
    <group>
      {/* 1. Ground Terrain Landscape */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#0b1120" roughness={0.9} />
      </mesh>

      {/* 2. Main Asphalt Road Bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* 3. Road Shoulders / Curbs */}
      <mesh position={[-ROAD_WIDTH / 2 - 0.5, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.2, ROAD_LENGTH]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2 + 0.5, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.2, ROAD_LENGTH]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* 4. Left and Right Guardrails */}
      <mesh position={[-ROAD_WIDTH / 2 - 1.2, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 0.6, ROAD_LENGTH]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2 + 1.2, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 0.6, ROAD_LENGTH]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 5. Solid Edge Boundary Lines (Continuous) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-laneWidth * 2.5, 0.01, 0]}>
        <planeGeometry args={[0.25, ROAD_LENGTH]} />
        <meshBasicMaterial color="#facc15" /> {/* Yellow Left Shoulder */}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[laneWidth * 2.5, 0.01, 0]}>
        <planeGeometry args={[0.25, ROAD_LENGTH]} />
        <meshBasicMaterial color="#ffffff" /> {/* White Right Shoulder */}
      </mesh>

      {/* 6. Dynamic Scrolling Dashed Lane Lines */}
      <group ref={roadMarkingsRef}>
        {[-laneWidth * 1.5, -laneWidth * 0.5, laneWidth * 0.5, laneWidth * 1.5].map((laneX, laneIdx) => (
          <group key={`lane-${laneIdx}`}>
            {Array.from({ length: Math.ceil(ROAD_LENGTH / 8) + 4 }).map((_, dashIdx) => {
              const zPos = -ROAD_LENGTH / 2 + dashIdx * 8;
              return (
                <mesh
                  key={`dash-${laneIdx}-${dashIdx}`}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[laneX, 0.012, zPos]}
                >
                  <planeGeometry args={[0.18, 3.2]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>
    </group>
  );
};
