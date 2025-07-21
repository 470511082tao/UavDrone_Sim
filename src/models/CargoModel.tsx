import React, { useRef } from 'react';
import * as THREE from 'three';

interface CargoModelProps {
  position: [number, number, number];
  name?: string;
}

const CargoModel: React.FC<CargoModelProps> = ({ 
  position, 
  name 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Mesh>(null);

  return (
    <group 
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      name={name}
    >
      {/* 主体纸箱 - 改为1米×1米×1米 */}
      <mesh ref={boxRef} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>


    </group>
  );
};

export default CargoModel; 