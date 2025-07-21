import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ShelfModelProps {
  name?: string;
  selected?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

const ShelfModel: React.FC<ShelfModelProps> = ({ 
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
      {/* 主体货架结构 */}
      <group>
        {/* 四根支柱 */}
        {[-0.9, 0.9].map((x) =>
          [-0.2, 0.2].map((z) => (
            <mesh 
              key={`pillar-${x}-${z}`} 
              position={[x, 1, z]}
              onPointerOver={onPointerOver}
              onPointerOut={onPointerOut}
            >
              <boxGeometry args={[0.1, 2, 0.1]} />
              <meshStandardMaterial color="#87CEEB" />
            </mesh>
          ))
        )}
        
        {/* 4层层板 */}
        {[0.3, 0.75, 1.2, 1.65].map((y, index) => (
          <mesh 
            key={`shelf-${index}`} 
            position={[0, y, 0]}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
          >
            <boxGeometry args={[2, 0.05, 0.5]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        ))}
      </group>

      {/* 选中时的呼吸光圈 */}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <primitive object={ringMaterial} />
        </mesh>
      )}
    </group>
  );
};

export default ShelfModel; 