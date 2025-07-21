import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';

interface DockingStationModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onClick?: (event: React.MouseEvent) => void;
  color?: string;
  selected?: boolean;
  name?: string;
  liftPosition?: number; // 升降板位置控制参数，0-1之间，0为底部，1为顶部
}

const DockingStationModel: React.FC<DockingStationModelProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onClick,
  color = '#2ecc71',
  selected = false,
  name,
  liftPosition = 1 // 默认在顶部
}) => {
  // 基座引用
  const baseRef = useRef<THREE.Group>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);
  const liftPlatformRef = useRef<THREE.Group>(null);
  
  // 加载FC标志纹理
  const fcLogoTexture = useLoader(THREE.TextureLoader, '/FClogo.png');
  
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
    metalness: 0.4,
    roughness: 0.4
  });
  
  // 带Logo的材质
  const logoMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.4,
    roughness: 0.4
  });
  
  // 格口材质
  const lockerMaterial = new THREE.MeshStandardMaterial({
    color: '#bdc3c7',
    metalness: 0.5,
    roughness: 0.5
  });
  
  // 格口门材质
  const lockerDoorMaterial = new THREE.MeshStandardMaterial({
    color: '#ecf0f1', 
    metalness: 0.4,
    roughness: 0.4
  });

  // 接驳柜尺寸（单位：米）
  const stationDimensions = {
    length: 3, // z轴，宽度为3米
    width: 6,  // x轴，长度为6米
    height: 2.7 // y轴，高度为2.7米
  };

  // 地面基座厚度
  const baseHeight = 0.2;
  
  // 墙壁厚度
  const wallThickness = 0.2;
  
  // 顶部孔洞定义
  const holeSize = 2.0; // 正方形孔边长2米
  const rightMargin = 0.5; // 孔洞右边缘距离接驳柜右边缘的距离
  
  // 计算孔洞的中心位置
  const holeX = stationDimensions.width/2 - rightMargin - holeSize/2;
  const holeZ = 0;
  
  // 货架参数
  const shelfWidth = 3.0; // 货架宽度 (沿x轴方向延伸)
  const shelfDepth = 1.5; // 货架深度 (沿z轴方向)
  const shelfThickness = 0.05; // 货架板厚度
  const shelfLegWidth = 0.04; // 货架支腿宽度
  const compartmentHeight = 1; // 隔层高度
  const numShelves = 2; // 两层货架
  
  // 货架位置 - 在接驳柜内部
  const shelfX = -stationDimensions.width/5; // 位于接驳柜左侧区域，但不太靠边
  const shelfZ = 0; // z轴居中放置
  const shelfStartY = baseHeight + 0.5; // 从地面基座上方略高一点的位置开始
  
  // 货物位置坐标定义 - 每层2个，共4个
  const cargoPositions = [
    // 底层货物位置
    [-shelfWidth/4, shelfStartY + shelfThickness, 0] as [number, number, number], // 底层左侧
    [shelfWidth/4, shelfStartY + shelfThickness, 0] as [number, number, number],  // 底层右侧
    
    // 上层货物位置
    [-shelfWidth/4, shelfStartY + compartmentHeight + shelfThickness, 0] as [number, number, number], // 上层左侧
    [shelfWidth/4, shelfStartY + compartmentHeight + shelfThickness, 0] as [number, number, number]   // 上层右侧
  ];
  
  // 快递柜格口参数
  const lockerWidth = 0.4; // 每个格口的宽度
  const smallLockerHeight = 0.3; // 小格口的高度
  const largeLockerHeight = 0.5; // 大格口的高度
  const lockerDepth = 0.05; // 格口门的厚度
  const columns = 14; // 总列数
  const rowsPerColumn = 8; // 每列8个格口
  
  // 取件显示屏
  const screenWidth = 0.4; // 屏幕宽度
  const screenHeight = 0.7; // 屏幕高度

  // 升降板参数
  const liftPlatformSize = holeSize; // 与孔洞大小相同
  const liftPlatformThickness = 0.1; // 升降板厚度
  
  // 计算升降板当前位置
  const maxLiftHeight = stationDimensions.height;
  const minLiftHeight = 0.5; // 最低位置
  const currentLiftHeight = minLiftHeight + (maxLiftHeight - minLiftHeight) * liftPosition;
  
  // 添加调试输出
  useEffect(() => {
    console.log('DockingStationModel - 升降板位置更新:', { 
      liftPosition, 
      currentLiftHeight,
      maxHeight: maxLiftHeight,
      minHeight: minLiftHeight
    });
  }, [liftPosition, currentLiftHeight, maxLiftHeight, minLiftHeight]);
  
  // 更新升降板位置和选中动画
  useFrame((state) => {
    // 升降板位置动画
    if (liftPlatformRef.current) {
      const targetY = baseHeight + currentLiftHeight;
      // 平滑过渡
      liftPlatformRef.current.position.y = THREE.MathUtils.lerp(
        liftPlatformRef.current.position.y,
        targetY,
        0.1
      );
    }
    
    // 选中光圈的呼吸效果
    if (selectionRingRef.current && selected) {
      const material = selectionRingRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      
      // 光圈大小的轻微呼吸效果
      const pulseScale = 1.0 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      selectionRingRef.current.scale.set(pulseScale, pulseScale, 1.0);
    }
  });

  // 升降板材质
  const liftPlatformMaterial = new THREE.MeshStandardMaterial({
    color: '#7f8c8d',
    metalness: 0.6,
    roughness: 0.3
  });
  
  // 升降柱材质
  const liftColumnMaterial = new THREE.MeshStandardMaterial({
    color: '#95a5a6',
    metalness: 0.7,
    roughness: 0.3
  });

  // 货架材质
  const shelfMaterial = new THREE.MeshStandardMaterial({
    color: '#34495e',
    metalness: 0.4,
    roughness: 0.5
  });
  
  const shelfLegMaterial = new THREE.MeshStandardMaterial({
    color: '#2c3e50',
    metalness: 0.5,
    roughness: 0.4
  });

  // 顶部位置计算
  const topY = stationDimensions.height + baseHeight;

  return (
    <group 
      ref={baseRef} 
      position={position}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
      onClick={onClick}
      name={name}
    >
      {/* 地面基座，略大于柜体 */}
      <mesh position={[0, baseHeight/2, 0]} castShadow receiveShadow 
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[stationDimensions.width + 0.4, baseHeight, stationDimensions.length + 0.4]} />
      </mesh>
      
      {/* 基座装饰边缘 */}
      <mesh position={[0, baseHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[stationDimensions.width + 0.6, 0.05, stationDimensions.length + 0.6]} />
        <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* 前墙 */}
      <mesh position={[0, stationDimensions.height/2 + baseHeight, stationDimensions.length/2 - wallThickness/2]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[stationDimensions.width, stationDimensions.height, wallThickness]} />
      </mesh>
      
      {/* 后墙 */}
      <mesh position={[0, stationDimensions.height/2 + baseHeight, -stationDimensions.length/2 + wallThickness/2]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[stationDimensions.width, stationDimensions.height, wallThickness]} />
      </mesh>
      
      {/* FC Logo贴图 - 位于整个顶部，更明显位置 */}
      <mesh 
        position={[-1.5, topY + 0.02, 0]} 
        rotation={[-Math.PI/2, 0, 0]}
        scale={[1.2, 1.2, 1.2]}
      >
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial map={fcLogoTexture} transparent={true} />
      </mesh>
      
      {/* 顶部实现 - 使用四个面板围绕一个精确的正方形孔洞 */}
      {(() => {
        // 顶部面板的y坐标
        const topY = stationDimensions.height + baseHeight - wallThickness/2;
        
        // 计算孔洞的中心位置 - 偏向右侧
        const holeX = stationDimensions.width/2 - rightMargin - holeSize/2;
        const holeZ = 0; // 孔洞在z方向居中
        
        // 计算孔洞的边界
        const holeLeft = holeX - holeSize/2;
        const holeFront = holeZ + holeSize/2;
        const holeBack = holeZ - holeSize/2;
        
        return (
          <>
            {/* 左侧主面板 */}
            <mesh 
              position={[-stationDimensions.width/2 + (holeLeft + stationDimensions.width/2)/2, topY, 0]} 
              castShadow 
              receiveShadow
              material={selected ? highlightMaterial : normalMaterial}
            >
              <boxGeometry args={[holeLeft + stationDimensions.width/2, wallThickness, stationDimensions.length]} />
            </mesh>
            
            {/* 右侧面板 */}
            <mesh 
              position={[stationDimensions.width/2 - rightMargin/2, topY, 0]} 
              castShadow 
              receiveShadow
              material={selected ? highlightMaterial : normalMaterial}
            >
              <boxGeometry args={[rightMargin, wallThickness, stationDimensions.length]} />
            </mesh>
            
            {/* 前侧连接面板 */}
            <mesh 
              position={[holeX, topY, stationDimensions.length/2 - (stationDimensions.length/2 - holeFront)/2]} 
              castShadow 
              receiveShadow
              material={selected ? highlightMaterial : normalMaterial}
            >
              <boxGeometry args={[holeSize, wallThickness, stationDimensions.length/2 - holeFront]} />
            </mesh>
            
            {/* 后侧连接面板 */}
            <mesh 
              position={[holeX, topY, -stationDimensions.length/2 + (stationDimensions.length/2 + holeBack)/2]} 
              castShadow 
              receiveShadow
              material={selected ? highlightMaterial : normalMaterial}
            >
              <boxGeometry args={[holeSize, wallThickness, stationDimensions.length/2 + holeBack]} />
            </mesh>
          </>
        );
      })()}
      
      {/* 左侧支柱 - 前 */}
      <mesh position={[-stationDimensions.width/2 + wallThickness/2, stationDimensions.height/2 + baseHeight, stationDimensions.length/2 - wallThickness/2]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, stationDimensions.height, wallThickness]} />
      </mesh>
      
      {/* 左侧支柱 - 后 */}
      <mesh position={[-stationDimensions.width/2 + wallThickness/2, stationDimensions.height/2 + baseHeight, -stationDimensions.length/2 + wallThickness/2]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, stationDimensions.height, wallThickness]} />
      </mesh>
      
      {/* 右侧支柱 - 前 */}
      <mesh position={[stationDimensions.width/2 - wallThickness/2, stationDimensions.height/2 + baseHeight, stationDimensions.length/2 - wallThickness/2]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, stationDimensions.height, wallThickness]} />
      </mesh>
      
      {/* 右侧支柱 - 后 */}
      <mesh position={[stationDimensions.width/2 - wallThickness/2, stationDimensions.height/2 + baseHeight, -stationDimensions.length/2 + wallThickness/2]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, stationDimensions.height, wallThickness]} />
      </mesh>
      
      {/* 左侧横杆 - 上 */}
      <mesh position={[-stationDimensions.width/2 + wallThickness/2, stationDimensions.height + baseHeight - wallThickness/2, 0]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, wallThickness, stationDimensions.length - 2*wallThickness]} />
      </mesh>
      
      {/* 左侧横杆 - 下 */}
      <mesh position={[-stationDimensions.width/2 + wallThickness/2, baseHeight + wallThickness/2, 0]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, wallThickness, stationDimensions.length - 2*wallThickness]} />
      </mesh>
      
      {/* 右侧横杆 - 上 */}
      <mesh position={[stationDimensions.width/2 - wallThickness/2, stationDimensions.height + baseHeight - wallThickness/2, 0]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, wallThickness, stationDimensions.length - 2*wallThickness]} />
      </mesh>
      
      {/* 右侧横杆 - 下 */}
      <mesh position={[stationDimensions.width/2 - wallThickness/2, baseHeight + wallThickness/2, 0]} castShadow receiveShadow
        material={selected ? highlightMaterial : normalMaterial}>
        <boxGeometry args={[wallThickness, wallThickness, stationDimensions.length - 2*wallThickness]} />
      </mesh>
      
      {/* 快递柜格口 */}
      {Array.from({ length: columns }).map((_, colIndex) => {
        // 跳过取件显示屏位置的格口
        if (colIndex === columns - 1) return null;
        
        const startX = -stationDimensions.width/2 + wallThickness + lockerWidth/2 + colIndex * lockerWidth;
        
        return Array.from({ length: rowsPerColumn }).map((_, rowIndex) => {
          // 设置格口大小：底部第一个是大格口(即最后一个格口，rowIndex=7)
          const isLargeLocker = rowIndex === rowsPerColumn - 1;
          const height = isLargeLocker ? largeLockerHeight : smallLockerHeight;
          
          // 计算垂直位置，从底部开始向上摆放
          let startY = baseHeight + height/2; // 底部第一个格口的位置
          
          // 如果不是底部第一个格口，需要加上之前格口的高度
          if (rowIndex < rowsPerColumn - 1) {
            // 底部有一个大格口，其余都是小格口
            startY = baseHeight + largeLockerHeight + smallLockerHeight * rowIndex + smallLockerHeight/2;
          }
          
          return (
            <group key={`locker-${colIndex}-${rowIndex}`} position={[startX, startY, stationDimensions.length/2 + 0.01]}>
              {/* 格口框架 */}
              <mesh castShadow receiveShadow material={lockerMaterial}>
                <boxGeometry args={[lockerWidth * 0.95, height * 0.95, 0.03]} />
              </mesh>
              
              {/* 格口门 */}
              <mesh position={[0, 0, 0.02]} castShadow receiveShadow material={lockerDoorMaterial}>
                <boxGeometry args={[lockerWidth * 0.85, height * 0.85, lockerDepth]} />
              </mesh>
              
              {/* 门把手 */}
              <mesh position={[-lockerWidth * 0.3, 0, 0.04]}>
                <circleGeometry args={[0.02, 16]} />
                <meshBasicMaterial color="#2c3e50" />
              </mesh>
              
              {/* 格口编号显示 */}
              <mesh position={[0, -height * 0.25, 0.04]}>
                <planeGeometry args={[lockerWidth * 0.4, 0.05]} />
                <meshBasicMaterial color="white" />
              </mesh>
            </group>
          );
        });
      })}
      
      {/* 取件显示屏区 */}
      <group position={[stationDimensions.width/2 - screenWidth/2 - wallThickness, stationDimensions.height/2 + baseHeight, stationDimensions.length/2 + 0.02]}>
        {/* 显示屏外框 */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[screenWidth + 0.1, screenHeight + 0.1, 0.05]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.5} roughness={0.5} />
        </mesh>
        
        {/* 显示屏 */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[screenWidth, screenHeight]} />
          <meshBasicMaterial color="#111927" />
        </mesh>
        
        {/* 显示内容 */}
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[screenWidth * 0.9, screenHeight * 0.8]} />
          <meshBasicMaterial color="#2980b9" transparent opacity={0.8} />
        </mesh>
        
        {/* 提示文字区域 */}
        <mesh position={[0, -screenHeight/3, 0.032]}>
          <planeGeometry args={[screenWidth * 0.7, screenHeight * 0.15]} />
          <meshBasicMaterial color="#3498db" />
        </mesh>
      </group>
      
      {/* 顶部左下角指示灯 - 已移动位置 */}
      <mesh 
        position={[-stationDimensions.width/2 + 0.3, stationDimensions.height + baseHeight + 0.2, -stationDimensions.length/2 + 0.3]} 
        castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
        <meshStandardMaterial color="#7f8c8d" metalness={0.7} roughness={0.2} />
      </mesh>
      
      <mesh 
        position={[-stationDimensions.width/2 + 0.3, stationDimensions.height + baseHeight + 0.35, -stationDimensions.length/2 + 0.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={selected ? "#ffcc00" : "#e74c3c"} 
          emissive={selected ? "#ffcc00" : "#e74c3c"}
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* 指示灯照明 - 已移动位置 */}
      <pointLight 
        position={[-stationDimensions.width/2 + 0.3, stationDimensions.height + baseHeight + 0.35, -stationDimensions.length/2 + 0.3]}
        distance={4}
        intensity={0.5}
        color={selected ? "#ffcc00" : "#e74c3c"}
      />
      
      {/* 如果被选中，添加选中指示器 */}
      {selected && (
        <mesh ref={selectionRingRef} position={[0, 0.001, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[Math.max(stationDimensions.width, stationDimensions.length)/2 + 0.2, 
                             Math.max(stationDimensions.width, stationDimensions.length)/2 + 0.5, 32]} />
          <meshBasicMaterial color="#2e86ff" transparent opacity={0.6} />
        </mesh>
      )}
      
      {/* 升降板和升降机构 */}
      <group ref={liftPlatformRef} position={[holeX, baseHeight + currentLiftHeight, holeZ]}>
        {/* 升降板 - 平板形状，没有凸起部分 */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[liftPlatformSize, liftPlatformThickness, liftPlatformSize]} />
          <primitive object={liftPlatformMaterial} />
        </mesh>
        
        {/* 升降机构 - 四根支柱 */}
        {[
          [liftPlatformSize/2 - 0.15, -currentLiftHeight/2, liftPlatformSize/2 - 0.15] as [number, number, number],
          [liftPlatformSize/2 - 0.15, -currentLiftHeight/2, -liftPlatformSize/2 + 0.15] as [number, number, number],
          [-liftPlatformSize/2 + 0.15, -currentLiftHeight/2, liftPlatformSize/2 - 0.15] as [number, number, number],
          [-liftPlatformSize/2 + 0.15, -currentLiftHeight/2, -liftPlatformSize/2 + 0.15] as [number, number, number]
        ].map((pos, index) => (
          <mesh 
            key={`lift-column-${index}`} 
            position={pos} 
            castShadow 
            receiveShadow
          >
            <cylinderGeometry args={[0.08, 0.08, currentLiftHeight, 8]} />
            <primitive object={liftColumnMaterial} />
          </mesh>
        ))}
        
        {/* 横向连接支架 - 下部 */}
        <mesh position={[0, -currentLiftHeight + 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[liftPlatformSize - 0.3, 0.1, liftPlatformSize - 0.3]} />
          <primitive object={liftColumnMaterial} />
        </mesh>
        
        {/* 底部连接底座 */}
        <mesh position={[0, -currentLiftHeight, 0]} castShadow receiveShadow>
          <boxGeometry args={[liftPlatformSize - 0.1, 0.15, liftPlatformSize - 0.1]} />
          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      
      {/* 货架结构 - 在接驳柜左侧区域 */}
      <group position={[shelfX, 0, shelfZ]}>
        {/* 第一层货架(底层) */}
        <mesh position={[0, shelfStartY, 0]} castShadow receiveShadow>
          <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
          <primitive object={shelfMaterial} />
        </mesh>
        
        {/* 第二层货架(上层) */}
        <mesh position={[0, shelfStartY + compartmentHeight, 0]} castShadow receiveShadow>
          <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
          <primitive object={shelfMaterial} />
        </mesh>
        
        {/* 货架支腿 - 均匀分布在左右两侧 */}
        {[
          // 左侧支腿
          [-shelfWidth/2 + shelfLegWidth/2, shelfStartY + compartmentHeight/2, shelfDepth/2 - shelfLegWidth/2] as [number, number, number],
          [-shelfWidth/2 + shelfLegWidth/2, shelfStartY + compartmentHeight/2, -shelfDepth/2 + shelfLegWidth/2] as [number, number, number],
          
          // 右侧支腿
          [shelfWidth/2 - shelfLegWidth/2, shelfStartY + compartmentHeight/2, shelfDepth/2 - shelfLegWidth/2] as [number, number, number],
          [shelfWidth/2 - shelfLegWidth/2, shelfStartY + compartmentHeight/2, -shelfDepth/2 + shelfLegWidth/2] as [number, number, number],
          
          // 左侧中间支腿
          [-shelfWidth/4, shelfStartY + compartmentHeight/2, shelfDepth/2 - shelfLegWidth/2] as [number, number, number],
          [-shelfWidth/4, shelfStartY + compartmentHeight/2, -shelfDepth/2 + shelfLegWidth/2] as [number, number, number],
          
          // 右侧中间支腿
          [shelfWidth/4, shelfStartY + compartmentHeight/2, shelfDepth/2 - shelfLegWidth/2] as [number, number, number],
          [shelfWidth/4, shelfStartY + compartmentHeight/2, -shelfDepth/2 + shelfLegWidth/2] as [number, number, number]
        ].map((pos, index) => (
          <mesh 
            key={`shelf-leg-${index}`} 
            position={pos}
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[shelfLegWidth, compartmentHeight, shelfLegWidth]} />
            <primitive object={shelfLegMaterial} />
          </mesh>
        ))}
        
        {/* 货物位置标记 - 4个货物位置 */}
        {cargoPositions.map((pos, index) => (
          <group key={`cargo-position-${index}`} position={pos}>
            {/* 底板标记 - 略微凸起的平台 */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.02, 1.2]} />
              <meshStandardMaterial color="#34495e" opacity={0.6} transparent metalness={0.3} roughness={0.5} />
            </mesh>
            
            {/* 位置编号标记 */}
            <mesh position={[0, 0.015, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[0.3, 0.3]} />
              <meshBasicMaterial color="#ecf0f1" opacity={0.8} transparent />
            </mesh>
            
            {/* 位置编号文字（使用几何形状简单表示） */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[0.2, 0.2]} />
              <meshBasicMaterial color="#2c3e50" />
            </mesh>
            
            {/* 四个角落的定位点 */}
            {[
              [0.5, 0.01, 0.5], 
              [0.5, 0.01, -0.5], 
              [-0.5, 0.01, 0.5], 
              [-0.5, 0.01, -0.5]
            ].map((cornerPos, cornerIndex) => (
              <mesh 
                key={`corner-${cornerIndex}`} 
                position={cornerPos as [number, number, number]}
              >
                <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
                <meshBasicMaterial color="#3498db" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
};

export default DockingStationModel; 