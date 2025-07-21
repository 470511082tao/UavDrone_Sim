import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DroneModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onClick?: (event: React.MouseEvent) => void;
  color?: string;
  selected?: boolean;
  hovering?: boolean;
  propellersActive?: boolean;
  name?: string;
}

const DroneModel: React.FC<DroneModelProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onClick,
  color = '#3498db',
  selected = false,
  hovering = false,
  propellersActive = false,
  name
}) => {
  // 创建对螺旋桨的引用
  const propeller1Ref = useRef<THREE.Group>(null);
  const propeller2Ref = useRef<THREE.Group>(null);
  const propeller3Ref = useRef<THREE.Group>(null);
  const propeller4Ref = useRef<THREE.Group>(null);
  
  // 无人机主体引用
  const droneBodyRef = useRef<THREE.Group>(null);
  
  // 状态指示灯引用
  const statusLightRef = useRef<THREE.PointLight>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);
  const [lightColor, setLightColor] = useState<string>(selected ? "#ffcc00" : "#00ff00");
  const [lightIntensity, setLightIntensity] = useState<number>(selected ? 0.5 : 0.2);
  
  // 当选中状态改变时更新灯光
  useEffect(() => {
    if (selected) {
      setLightColor("#ffcc00");
      setLightIntensity(0.5);
    } else {
      setLightColor("#00ff00");
      setLightIntensity(0.2);
    }
  }, [selected]);
  
  // 动画更新
  useFrame((state, delta) => {
    // 只有在propellersActive为true时才旋转螺旋桨
    if (propellersActive) {
      // 旋转螺旋桨，不同螺旋桨旋转方向和速度稍有不同，增加真实感
      if (propeller1Ref.current) {
        propeller1Ref.current.rotation.y += 0.5 * delta * 12;
      }
      if (propeller2Ref.current) {
        propeller2Ref.current.rotation.y -= 0.5 * delta * 11;
      }
      if (propeller3Ref.current) {
        propeller3Ref.current.rotation.y += 0.5 * delta * 11.5;
      }
      if (propeller4Ref.current) {
        propeller4Ref.current.rotation.y -= 0.5 * delta * 11.8;
      }
    }
    
    // 如果处于悬停状态，添加轻微的上下移动和轻微摇晃
    // 注意：这里只设置相对偏移，不影响主要位置（由外层group的position控制）
    if (hovering && droneBodyRef.current) {
      droneBodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      droneBodyRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.015;
      droneBodyRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 1.3) * 0.015;
    } else if (droneBodyRef.current) {
      // 如果不悬停，重置相对偏移
      droneBodyRef.current.position.y = 0;
      droneBodyRef.current.rotation.x = 0;
      droneBodyRef.current.rotation.z = 0;
    }
    
    // 状态指示灯闪烁效果
    if (statusLightRef.current && selected) {
      statusLightRef.current.intensity = 0.3 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
    }
    
    // 选中光圈的呼吸效果
    if (selectionRingRef.current && selected) {
      const material = selectionRingRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      selectionRingRef.current.scale.set(
        1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.05,
        1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.05,
        1.0
      );
    }
  });
  
  // 选中效果的材质
  const highlightMaterial = new THREE.MeshStandardMaterial({
    color: '#ffcc00',
    emissive: '#ff9900',
    emissiveIntensity: 0.2,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // 普通材质
  const normalMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.6,
    roughness: 0.3
  });

  // 螺旋桨材质 - 半透明效果
  const propellerMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    metalness: 0.1,
    roughness: 0.8,
    transparent: true,
    opacity: 0.8
  });
  

  // 摄像头镜头材质
  const lensMaterial = new THREE.MeshStandardMaterial({
    color: "#111111",
    metalness: 0.9,
    roughness: 0.2
  });

  // 电机材质
  const motorMaterial = new THREE.MeshStandardMaterial({
    color: "#555555",
    metalness: 0.7,
    roughness: 0.3
  });

  return (
    <group 
      position={position}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
      onClick={onClick}
      name={name}
    >
      {/* 调整位置，使原点精确位于支脚底部 */}
      <group ref={droneBodyRef} position={[0, 0, 0]}>
      {/* 机身 - 主体部分 */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[1.0, 0.15, 1.0]} />
      </mesh>
      
      {/* 机身中央隆起部分 - 电子设备舱 */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.6, 0.15, 0.6]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* 机身中心顶部的导航舱 */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.25, 0.1, 0.4]} />
      </mesh>
      
      {/* 飞控舱半球形透明罩 */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
        <meshPhysicalMaterial transparent opacity={0.4} transmission={0.9} thickness={0.05} color="#a8d5ff" />
      </mesh>
      
      {/* 摄像头机头部分 */}
      <group position={[0, 0.95, 0.3]}>
        {/* 摄像头基座 */}
        <mesh castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 12]} />
        </mesh>
        
        {/* 摄像头主体 */}
        <mesh position={[0, 0, 0.1]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
          <boxGeometry args={[0.15, 0.15, 0.2]} />
        </mesh>
        
        {/* 摄像头镜头 */}
        <mesh position={[0, 0, 0.2]} rotation={[0, 0, 0]} material={lensMaterial}>
          <cylinderGeometry args={[0.04, 0.06, 0.05, 16]} />
        </mesh>
      </group>
      
      {/* 四个机臂 */}
      {/* 前左机臂 */}
      <mesh position={[-0.5, 0.8, -0.5]} rotation={[0, Math.PI/4, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.8, 0.08, 0.08]} />
      </mesh>
      
      {/* 前右机臂 */}
      <mesh position={[0.5, 0.8, -0.5]} rotation={[0, -Math.PI/4, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.8, 0.08, 0.08]} />
      </mesh>
      
      {/* 后左机臂 */}
      <mesh position={[-0.5, 0.8, 0.5]} rotation={[0, -Math.PI/4, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.8, 0.08, 0.08]} />
      </mesh>
      
      {/* 后右机臂 */}
      <mesh position={[0.5, 0.8, 0.5]} rotation={[0, Math.PI/4, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.8, 0.08, 0.08]} />
      </mesh>
      
      {/* 四个电机和螺旋桨 */}
      {/* 前左 */}
      <group position={[-0.8, 0.88, -0.8]}>
        {/* 电机 */}
        <mesh castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        </mesh>
        
        {/* 电机上方支架 */}
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
        </mesh>
        
        {/* 螺旋桨 */}
        <group ref={propeller1Ref} position={[0, 0.09, 0]}>
          <mesh castShadow receiveShadow material={propellerMaterial}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
          <mesh castShadow receiveShadow material={propellerMaterial} rotation={[0, Math.PI/2, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
        </group>
      </group>
      
      {/* 前右 */}
      <group position={[0.8, 0.88, -0.8]}>
        {/* 电机 */}
        <mesh castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        </mesh>
        
        {/* 电机上方支架 */}
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
        </mesh>
        
        {/* 螺旋桨 */}
        <group ref={propeller2Ref} position={[0, 0.09, 0]}>
          <mesh castShadow receiveShadow material={propellerMaterial}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
          <mesh castShadow receiveShadow material={propellerMaterial} rotation={[0, Math.PI/2, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
        </group>
      </group>
      
      {/* 后左 */}
      <group position={[-0.8, 0.88, 0.8]}>
        {/* 电机 */}
        <mesh castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        </mesh>
        
        {/* 电机上方支架 */}
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
        </mesh>
        
        {/* 螺旋桨 */}
        <group ref={propeller3Ref} position={[0, 0.09, 0]}>
          <mesh castShadow receiveShadow material={propellerMaterial}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
          <mesh castShadow receiveShadow material={propellerMaterial} rotation={[0, Math.PI/2, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
        </group>
      </group>
      
      {/* 后右 */}
      <group position={[0.8, 0.88, 0.8]}>
        {/* 电机 */}
        <mesh castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        </mesh>
        
        {/* 电机上方支架 */}
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow material={motorMaterial}>
          <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
        </mesh>
        
        {/* 螺旋桨 */}
        <group ref={propeller4Ref} position={[0, 0.09, 0]}>
          <mesh castShadow receiveShadow material={propellerMaterial}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
          <mesh castShadow receiveShadow material={propellerMaterial} rotation={[0, Math.PI/2, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.05]} />
          </mesh>
        </group>
      </group>
      
      {/* 机身底部的着陆支架 */}
      {/* 前左支架 */}
      <mesh position={[-0.4, 0.4, -0.4]} rotation={[0, 0, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.08, 0.8, 0.08]} />
      </mesh>
      
      {/* 前右支架 */}
      <mesh position={[0.4, 0.4, -0.4]} rotation={[0, 0, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.08, 0.8, 0.08]} />
      </mesh>
      
      {/* 后左支架 */}
      <mesh position={[-0.4, 0.4, 0.4]} rotation={[0, 0, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.08, 0.8, 0.08]} />
      </mesh>
      
      {/* 后右支架 */}
      <mesh position={[0.4, 0.4, 0.4]} rotation={[0, 0, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.08, 0.8, 0.08]} />
      </mesh>
      
      {/* 前支架横杆 */}
      <mesh position={[0, 0.05, -0.4]} rotation={[0, 0, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
      </mesh>
      
      {/* 后支架横杆 */}
      <mesh position={[0, 0.05, 0.4]} rotation={[0, 0, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
      </mesh>
      
      {/* 左支架横杆 */}
      <mesh position={[-0.4, 0.05, 0]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
      </mesh>
      
      {/* 右支架横杆 */}
      <mesh position={[0.4, 0.05, 0]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
      </mesh>
      
      {/* 状态指示灯 */}
      <pointLight
        ref={statusLightRef}
        position={[0, 1.0, 0]}
        intensity={lightIntensity}
        color={lightColor}
        distance={1.5}
      />
      
      {/* 尾部状态灯 */}
      <mesh position={[0, 0.95, -0.5]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial 
          color="#ff3300"
          emissive="#ff3300"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* 如果被选中，添加选中指示器 */}
      {selected && (
        <>
          <mesh ref={selectionRingRef} position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[1.3, 1.5, 32]} />
            <meshBasicMaterial color="#2e86ff" transparent opacity={0.6} />
          </mesh>
        </>
      )}
      </group>
    </group>
  );
};

export default DroneModel; 