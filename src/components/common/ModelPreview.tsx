import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import DroneModel from '../../models/DroneModel';
import DockingStationModel from '../../models/DockingStationModel';
import StationPointModel from '../../models/StationPointModel';
import ShelfModel from '../../models/ShelfModel';
import BuildingModel from '../../models/BuildingModel';

interface ModelPreviewProps {
  placementMode: string;
  onPlace: (position: [number, number, number]) => void;
  onExit: () => void;
  isRunning?: boolean;
}

const ModelPreview: React.FC<ModelPreviewProps> = ({ placementMode, onPlace, onExit, isRunning }) => {
  const { camera, raycaster, gl } = useThree();
  const mouse = useRef(new THREE.Vector2());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionPoint = useRef(new THREE.Vector3());
  const previewRef = useRef<THREE.Group>(null);
  
  // 处理鼠标移动和点击
  useEffect(() => {
    if (isRunning || !placementMode) return;
    
    const canvas = gl.domElement;
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    
    const handleClick = (event: MouseEvent) => {
      if (placementMode && previewRef.current) {
        // 立即阻止事件传播和默认行为
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const position: [number, number, number] = [
          previewRef.current.position.x,
          previewRef.current.position.y,
          previewRef.current.position.z
        ];
        
        // 放置模型
        onPlace(position);
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    // 使用捕获阶段确保优先处理
    canvas.addEventListener('click', handleClick, true);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick, true);
    };
  }, [gl, placementMode, onPlace, isRunning]);
  
  // 更新预览位置
  useEffect(() => {
    if (!placementMode || !previewRef.current || isRunning) return;
    
    const animate = () => {
      if (!previewRef.current || !placementMode) return;
      
      raycaster.setFromCamera(mouse.current, camera);
      
      if (raycaster.ray.intersectPlane(groundPlane.current, intersectionPoint.current)) {
        previewRef.current.position.copy(intersectionPoint.current);
        previewRef.current.position.y = 0;
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [placementMode, camera, raycaster, isRunning]);
  
  // 处理ESC键退出
  useEffect(() => {
    if (!placementMode) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExit();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [placementMode, onExit]);
  
  if (!placementMode || isRunning) return null;
  
  const renderPreviewModel = () => {
    const commonProps = {
      name: `preview-${placementMode}`,
      onPointerOver: () => {
        if (previewRef.current) {
          previewRef.current.scale.setScalar(1.1);
        }
      },
      onPointerOut: () => {
        if (previewRef.current) {
          previewRef.current.scale.setScalar(1.0);
        }
      }
    };
    
    switch (placementMode) {
      case 'drone':
        return <DroneModel {...commonProps} hovering={false} propellersActive={false} />;
      case 'dockingStation':
        return <DockingStationModel {...commonProps} />;
      case 'waypoint':
        return <StationPointModel {...commonProps} />;
      case 'shelf':
        return <ShelfModel {...commonProps} />;
      case 'building':
        return <BuildingModel {...commonProps} />;
      default:
        return null;
    }
  };
  
  return (
    <group ref={previewRef} position={[0, 0, 0]}>
      <group scale={[1, 1, 1]}>
        {renderPreviewModel()}
      </group>
    </group>
  );
};

export default ModelPreview; 