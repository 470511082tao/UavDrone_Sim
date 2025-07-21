import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface StationPointModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onClick?: (event: React.MouseEvent) => void;
  color?: string;
  selected?: boolean;
  name?: string;
  stationNumber?: number;
  stationType?: string;
}

const StationPointModel: React.FC<StationPointModelProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onClick,
  color = '#e74c3c',
  selected = false,
  name,
  stationNumber = 1,
  stationType = '普通站点'
}) => {
  // 选中光环引用
  const selectionRingRef = useRef<THREE.Mesh>(null);
  
  // 旗杆材质
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: '#7f8c8d',
    metalness: 0.6,
    roughness: 0.3
  });

  // 只为选中光环添加呼吸效果
  useFrame((state) => {
    if (selectionRingRef.current && selected) {
      const material = selectionRingRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      
      // 光环大小的轻微呼吸效果
      const pulseScale = 1.0 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      selectionRingRef.current.scale.set(pulseScale, pulseScale, 1.0);
    }
  });

  return (
    <group 
      position={position}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
      onClick={onClick}
      name={name}
    >
      {/* 底座圆柱体 */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.06, 16]} />
        <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* 旗杆 */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={poleMaterial}>
        <cylinderGeometry args={[0.03, 0.04, 0.9, 8]} />
      </mesh>
      
      {/* 旗帜 - 静态 */}
      <mesh position={[0.2, 0.8, 0]} rotation={[0, 0, 0]} castShadow>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial 
          color={selected ? '#ffcc00' : color}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>
      
      {/* 站点号码显示 */}
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {stationNumber}
      </Text>
      
      {/* 如果被选中，添加选中指示器 */}
      {selected && (
        <mesh ref={selectionRingRef} position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="#2e86ff" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

export default StationPointModel; 