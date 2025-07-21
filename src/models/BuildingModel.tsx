import React, { useMemo } from 'react';
import * as THREE from 'three';

interface BuildingModelProps {
  name?: string;
  selected?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

const BuildingModel: React.FC<BuildingModelProps> = ({ 
  name, 
  selected = false,
  onPointerOver,
  onPointerOut
}) => {
  
  // 选中时的蓝色呼吸光圈材质
  const ringMaterial = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    return material;
  }, []);

  return (
    <group name={name}>
      {/* 地面 */}
      <mesh 
        position={[0, 0.05, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial color="#F0F0F0" />
      </mesh>

      {/* 四面墙壁 */}
      {/* 前墙 (z轴负方向) */}
      <group>
        {/* 前墙左半部分 */}
        <mesh position={[-3, 1.5, -5]}>
          <boxGeometry args={[4, 3, 0.2]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 前墙右半部分 */}
        <mesh position={[3, 1.5, -5]}>
          <boxGeometry args={[4, 3, 0.2]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 门框上方 */}
        <mesh position={[0, 2.5, -5]}>
          <boxGeometry args={[2, 1, 0.2]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 玻璃门 */}
        <mesh position={[0, 1, -4.95]}>
          <boxGeometry args={[2, 2, 0.1]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* 后墙 (z轴正方向) */}
      <group>
        {/* 后墙左半部分 */}
        <mesh position={[-3, 1.5, 5]}>
          <boxGeometry args={[4, 3, 0.2]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 后墙右半部分 */}
        <mesh position={[3, 1.5, 5]}>
          <boxGeometry args={[4, 3, 0.2]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 门框上方 */}
        <mesh position={[0, 2.5, 5]}>
          <boxGeometry args={[2, 1, 0.2]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 门 */}
        <mesh position={[0, 1, 4.95]}>
          <boxGeometry args={[2, 2, 0.1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>

      {/* 左墙 */}
      <group>
        <mesh position={[-5, 1.5, -2]}>
          <boxGeometry args={[0.2, 3, 6]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        <mesh position={[-5, 1.5, 2]}>
          <boxGeometry args={[0.2, 3, 6]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 窗户 */}
        <mesh position={[-4.95, 1.5, 0]}>
          <boxGeometry args={[0.1, 1.5, 2]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* 右墙 */}
      <group>
        <mesh position={[5, 1.5, -2]}>
          <boxGeometry args={[0.2, 3, 6]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        <mesh position={[5, 1.5, 2]}>
          <boxGeometry args={[0.2, 3, 6]} />
          <meshStandardMaterial color="#E8E8E8" />
        </mesh>
        {/* 窗户 */}
        <mesh position={[4.95, 1.5, 0]}>
          <boxGeometry args={[0.1, 1.5, 2]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* 选中时的呼吸光圈 */}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6, 7, 32]} />
          <primitive object={ringMaterial} />
        </mesh>
      )}
    </group>
  );
};

export default BuildingModel; 