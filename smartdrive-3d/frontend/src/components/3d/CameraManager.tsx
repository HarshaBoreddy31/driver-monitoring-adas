import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraViewMode, OurVehicle } from '../../types';

interface CameraManagerProps {
  viewMode: CameraViewMode;
  ourVehicle: OurVehicle;
}

export const CameraManager: React.FC<CameraManagerProps> = ({ viewMode, ourVehicle }) => {
  const { camera } = useThree();
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, -25));

  useFrame((_, delta) => {
    let targetPos = new THREE.Vector3(0, 7.5, 15);
    let targetLook = new THREE.Vector3(0, 1.5, -25);

    if (viewMode === 'chase') {
      // 3rd Person Dynamic Chase View - locked directly behind our vehicle's active lane
      targetPos.set(ourVehicle.x, 7.0, 14.0);
      targetLook.set(ourVehicle.x, 1.4, -26);
    } else if (viewMode === 'cockpit') {
      // Hood / Cockpit Driver Dashcam View - placed on our vehicle
      targetPos.set(ourVehicle.x, 1.38, -0.8);
      targetLook.set(ourVehicle.x, 1.32, -45);
    } else if (viewMode === 'topDown') {
      // Top-Down Orthographic-style ADAS Radar View
      targetPos.set(ourVehicle.x * 0.4, 48, -2);
      targetLook.set(ourVehicle.x * 0.4, 0, -2);
    }

    // Smooth camera position damping
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.x, 6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.y, 6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.z, 6, delta);

    // Smooth lookAt target damping
    currentLookAtRef.current.x = THREE.MathUtils.damp(currentLookAtRef.current.x, targetLook.x, 8, delta);
    currentLookAtRef.current.y = THREE.MathUtils.damp(currentLookAtRef.current.y, targetLook.y, 8, delta);
    currentLookAtRef.current.z = THREE.MathUtils.damp(currentLookAtRef.current.z, targetLook.z, 8, delta);

    camera.lookAt(currentLookAtRef.current);
  });

  return null;
};
