import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaypointModelProps {
  name?: string;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

const WaypointModel: React.FC<WaypointModelProps> = ({ name, onPointerOver, onPointerOut }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 旋转动画
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  
  return (
    <group name={name}>
      <mesh 
        ref={meshRef}
        position={[0, 0.5, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
        <meshStandardMaterial color="#FFB84D" />
      </mesh>
      {/* 发光效果 */}
      <pointLight
        position={[0, 1, 0]}
        color="#FFB84D"
        intensity={0.5}
        distance={3}
      />
    </group>
  );
};

export default WaypointModel; 