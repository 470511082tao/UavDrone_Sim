import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, TransformControls } from '@react-three/drei';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import DroneModel from '@/models/DroneModel';
import DockingStationModel from '@/models/DockingStationModel';
import StationPointModel from '@/models/StationPointModel';
import CargoModel from '@/models/CargoModel';
import PropertiesPanel from './PropertiesPanel';
import TopToolbar, { EditMode } from './TopToolbar';
import SearchBar from './SearchBar'; // 导入SearchBar组件
import RunButton from './RunButton'; // 导入RunButton组件
import * as TWEEN from '@tweenjs/tween.js'; // 修正TWEEN导入

// 定义放置模式类型
export type PlacementMode = '' | 'drone' | 'dockingStation' | 'stationPoint';

// 防抖函数，用于优化频繁调用

// 无人机数据接口
interface DroneData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
  hovering: boolean;
  propellersActive: boolean;
  modelName: string;
  modelNumber: string;
  cargoId?: string; // 添加货物ID字段
}

// 货物数据接口
interface CargoData {
  id: string;
  position: [number, number, number];
  droneId: string; // 关联的无人机ID
  selected: boolean;
}

// 接驳柜数据接口
interface DockingStationData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
  modelName: string;
  modelNumber: string;
  liftPosition?: number; // 升降板位置，0-1之间，0为底部，1为顶部
  boundStationId?: string; // 绑定的站点ID
  shelfOccupancy?: boolean[]; // 货架占用状态，4个位置：[底层左, 底层右, 上层左, 上层右]
}

// 站点数据接口
interface StationPointData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
  modelName: string;
  modelNumber: string;
  stationNumber: number;
  stationType: string;
}

// 模型预览组件 - 跟随鼠标移动
const ModelPreview: React.FC<{
  placementMode: PlacementMode;
  onPlace: (position: [number, number, number]) => void;
  onExit?: () => void; // 添加退出回调函数
  isRunning?: boolean; // 添加运行态参数
}> = ({ placementMode, onPlace, onExit, isRunning }) => {
  const { camera, raycaster, gl } = useThree();
  const mouse = useRef(new THREE.Vector2());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionPoint = useRef(new THREE.Vector3());
  const previewRef = useRef<THREE.Group>(null);
  
  // 处理鼠标移动
  useEffect(() => {
    // 如果处于运行态或没有放置模式，不处理
    if (isRunning || !placementMode) return;
    
    const canvas = gl.domElement;
    
    const handleMouseMove = (event: MouseEvent) => {
      // 计算鼠标在归一化设备坐标中的位置
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    
    const handleClick = (event: MouseEvent) => {
      if (placementMode && previewRef.current) {
        // 获取当前预览模型的位置
        const position: [number, number, number] = [
          previewRef.current.position.x,
          previewRef.current.position.y,
          previewRef.current.position.z
        ];
        
        // 放置模型
        onPlace(position);
        
        // 阻止事件传播，防止选择其他对象
        event.stopPropagation();
      }
    };
    
    // 添加事件监听器
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    return () => {
      // 移除事件监听器
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl, placementMode, onPlace, isRunning]);
  
  // 添加ESC键监听
  useEffect(() => {
    // 如果不在添加模式或没有退出回调或处于运行态，不添加监听
    if (!placementMode || !onExit || isRunning) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // 按下ESC键时退出添加模式
        onExit();
      }
    };
    
    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown);
    
    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [placementMode, onExit, isRunning]);
  
  // 每帧更新预览模型位置
  useFrame(() => {
    if (placementMode && previewRef.current && !isRunning) {
      // 设置射线的起始点和方向
      raycaster.setFromCamera(mouse.current, camera);
      
      // 计算射线与地面的交点
      raycaster.ray.intersectPlane(groundPlane.current, intersectionPoint.current);
      
      // 更新预览模型位置
      previewRef.current.position.copy(intersectionPoint.current);
      
      // 添加悬浮效果
      previewRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.1 + 0.2;
    }
  });
  
  // 如果没有激活放置模式或处于运行态，则不渲染任何内容
  if (!placementMode || isRunning) {
    return null;
  }
  
  // 根据放置模式渲染不同的预览模型
  return (
    <group ref={previewRef}>
      {placementMode === 'drone' && (
        <DroneModel 
          position={[0, 0, 0]} 
          color="#3498db" 
          propellersActive={false}
          hovering={false}
          selected={false}
          scale={[1, 1, 1]}
        />
      )}
      {placementMode === 'dockingStation' && (
        <DockingStationModel 
          position={[0, 0, 0]} 
          color="#2ecc71"
          selected={false}
          scale={[1, 1, 1]}
        />
      )}
      {placementMode === 'stationPoint' && (
        <StationPointModel 
          position={[0, 0, 0]} 
          color="#e74c3c"
          selected={false}
          scale={[1, 1, 1]}
          stationNumber={1}
        />
      )}
    </group>
  );
};

// 场景内容组件，将处理场景中的3D内容
const SceneContent: React.FC<{
  drones: DroneData[];
  dockingStations: DockingStationData[];
  stationPoints: StationPointData[];
  cargos: CargoData[];
  onObjectSelect: (id: string, type: 'drone' | 'dockingStation' | 'stationPoint' | 'cargo') => void;
  placementMode: PlacementMode;
  onPlaceModel: (position: [number, number, number]) => void;
  onExitPlacement?: () => void; // 添加退出放置模式的回调
  editMode: EditMode;
  selectedObjectId: string | null;
  selectedObjectType: 'drone' | 'dockingStation' | 'stationPoint' | 'cargo' | null;
  onObjectTransform: (id: string, type: 'drone' | 'dockingStation' | 'stationPoint' | 'cargo', position?: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number]) => void;
  isRunning: boolean; // 新增：是否处于运行态
}> = ({ 
  drones, 
  dockingStations,
  stationPoints,
  cargos,
  onObjectSelect, 
  placementMode, 
  onPlaceModel,
  onExitPlacement,
  editMode,
  selectedObjectId,
  selectedObjectType,
  onObjectTransform,
  isRunning // 新增参数
}) => {
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);
  const { scene } = useThree();
  const [isTransformEnabled, setIsTransformEnabled] = useState(true);

  // 找到选中对象并附加变换控件的函数
  const findAndAttachObject = useCallback(() => {
    if (!selectedObjectId || !selectedObjectType || !transformControlsRef.current) return;
    
    // 如果是选择模式，总是分离控件并返回
    if (editMode === 'select') {
      transformControlsRef.current.detach();
      return;
    }
    
    // 如果变换控件被禁用或处于运行态，分离控件并返回
    if (!isTransformEnabled || isRunning) {
      transformControlsRef.current.detach();
      return;
    }
    
    const objectName = `${selectedObjectType}-${selectedObjectId}`;
    let found = false;
    
    // 在场景中查找对象
    scene.traverse((object) => {
      if (object.name === objectName) {
        selectedObjectRef.current = object;
        found = true;
        
        // 如果不是选择模式并且变换控件已启用，则附加控件
        transformControlsRef.current.detach();
        transformControlsRef.current.attach(object);
        transformControlsRef.current.setMode(editMode === 'move' ? 'translate' : editMode === 'rotate' ? 'rotate' : editMode === 'scale' ? 'scale' : 'translate');
      }
    });
    
    if (!found) {
      console.warn('未找到对象:', objectName);
    }
  }, [selectedObjectId, selectedObjectType, editMode, isTransformEnabled, scene, isRunning]); // 添加isRunning依赖

  // 在选中对象、编辑模式或启用状态变化时查找并附加对象
  useEffect(() => {
    if (!transformControlsRef.current) return;
    
    // 如果没有选中对象，确保分离控件
    if (!selectedObjectId || !selectedObjectType) {
      transformControlsRef.current.detach();
      return;
    }
    
    // 如果处于运行态，不附加变换控件
    if (isRunning) {
      transformControlsRef.current.detach();
      return;
    }
    
    findAndAttachObject();
  }, [findAndAttachObject, selectedObjectId, selectedObjectType, isRunning]); // 添加isRunning依赖

  // 处理变换完成事件
  const handleTransformChange = useCallback(() => {
    if (selectedObjectRef.current && selectedObjectId && selectedObjectType) {
      const object = selectedObjectRef.current;
      const position: [number, number, number] = [
        object.position.x,
        object.position.y,
        object.position.z
      ];
      const rotation: [number, number, number] = [
        object.rotation.x,
        object.rotation.y,
        object.rotation.z
      ];
      const scale: [number, number, number] = [
        object.scale.x,
        object.scale.y,
        object.scale.z
      ];

      onObjectTransform(selectedObjectId, selectedObjectType, position, rotation, scale);
    }
  }, [selectedObjectId, selectedObjectType, onObjectTransform]);

  // 设置TransformControls行为，确保它不会阻止其他控制器
  useEffect(() => {
    if (!transformControlsRef.current) return;

    // 使用正确的事件名称和处理逻辑
    const handleDraggingChanged = (event: any) => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !event.value;
      }
    };

    transformControlsRef.current.addEventListener('dragging-changed', handleDraggingChanged);
    
    // 清理事件监听器
    return () => {
      if (transformControlsRef.current) {
        transformControlsRef.current.removeEventListener('dragging-changed', handleDraggingChanged);
      }
    };
  }, []);

  // 添加键盘事件监听器，使用Shift键临时切换变换控制器状态
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        // 按下Shift键时，临时禁用变换控制器
        setIsTransformEnabled(false);
        if (transformControlsRef.current && selectedObjectRef.current) {
          transformControlsRef.current.detach();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        // 释放Shift键时，重新启用变换控制器
        setIsTransformEnabled(true);
        findAndAttachObject(); // 重新附加控件
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [findAndAttachObject]);

  return (
    <>
      {/* 基本照明 */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} />
      <hemisphereLight intensity={0.8} color="#a6d1ff" groundColor="#614e3c" />
      
      {/* 场景辅助对象 */}
      <OrbitControls 
        ref={orbitControlsRef}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={5}
        maxDistance={50}
        enabled={!placementMode} // 只在放置模式下禁用
        makeDefault // 将此控制器设为默认，避免与其他控制器冲突
      />
      
      {/* TransformControls 总是渲染，但是否附加对象由逻辑控制 */}
      <TransformControls
        ref={transformControlsRef}
        mode={editMode === 'move' ? 'translate' : editMode === 'rotate' ? 'rotate' : editMode === 'scale' ? 'scale' : 'translate'}
        onMouseUp={handleTransformChange}
        onObjectChange={handleTransformChange}
        size={0.7} // 控件大小
        rotationSnap={Math.PI / 24} // 旋转吸附（15度）
        enabled={isTransformEnabled && editMode !== 'select' && !isRunning} // 在运行态禁用变换控件
        space="world" // 使用世界坐标系
        visible={editMode !== 'select' && selectedObjectId !== null && !isRunning} // 在运行态不显示变换控件
      />
      
      {/* 坐标轴 */}
      <axesHelper args={[5]} />
      
      {/* 透明网格地面 */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#3a6ea5" transparent opacity={0.1} />
      </mesh>
      
      {/* 网格 - 双层网格增加深度感 */}
      <Grid 
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#4d71b3"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#6d9eff"
        infiniteGrid
        fadeDistance={50}
        fadeStrength={1.5}
      />
      
      <Grid 
        position={[0, 0.02, 0]}
        cellSize={10}
        cellThickness={1.5}
        cellColor="#3d5e91"
        sectionSize={30}
        sectionThickness={2}
        sectionColor="#78a9ff"
        infiniteGrid
        fadeDistance={60}
        fadeStrength={1}
      />
      
      {/* 天空 */}
      <Sky 
        distance={450000} 
        sunPosition={[10, 5, 10]} 
        inclination={0.4}
        azimuth={0.25}
        turbidity={10}
        rayleigh={1}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      
      {/* 渲染无人机模型 */}
      {drones.map(drone => (
        <DroneModel
          key={drone.id}
          position={drone.position}
          rotation={drone.rotation}
          scale={drone.scale}
          color={drone.color}
          selected={drone.selected}
          hovering={drone.hovering}
          propellersActive={drone.propellersActive}
          onClick={() => onObjectSelect(drone.id, 'drone')}
          name={`drone-${drone.id}`} // 添加名称便于查找对象
        />
      ))}
      
      {/* 渲染接驳柜模型 */}
      {dockingStations.map(station => (
        <DockingStationModel
          key={station.id}
          position={station.position}
          rotation={station.rotation}
          scale={station.scale}
          color={station.color}
          selected={station.selected}
          onClick={() => onObjectSelect(station.id, 'dockingStation')}
          name={`dockingStation-${station.id}`} // 添加名称便于查找对象
          liftPosition={station.liftPosition} // 添加升降板位置参数
        />
      ))}
      
      {/* 渲染站点模型 */}
      {stationPoints.map(point => (
        <StationPointModel
          key={point.id}
          position={point.position}
          rotation={point.rotation}
          scale={point.scale}
          color={point.color}
          selected={point.selected}
          onClick={() => onObjectSelect(point.id, 'stationPoint')}
          name={`stationPoint-${point.id}`} // 添加名称便于查找对象
        />
      ))}
      
      {/* 渲染货物模型 */}
      {cargos.map(cargo => {
        // 修复货物位置计算逻辑
        let cargoPosition: [number, number, number];
        
        if (cargo.droneId && cargo.droneId !== '') {
          // 货物跟随无人机 - 使用droneId查找关联的无人机
          const associatedDrone = drones.find(d => d.id === cargo.droneId);
          cargoPosition = associatedDrone 
            ? [associatedDrone.position[0], associatedDrone.position[1] + 0.4, associatedDrone.position[2]] as [number, number, number]
            : cargo.position; // 如果找不到无人机，使用货物的固定位置，不要再改动这里的0.4的代码
        } else {
          // 货物已卸载或没有关联无人机，使用固定位置
          cargoPosition = cargo.position;
        }
        
        return (
          <CargoModel
            key={cargo.id}
            position={cargoPosition}
            name={`cargo-${cargo.id}`}
          />
        );
      })}
      
      {/* 模型预览 */}
      <ModelPreview 
        placementMode={placementMode} 
        onPlace={onPlaceModel} 
        onExit={onExitPlacement}
        isRunning={isRunning} // 传递运行态状态
      />
    </>
  );
};

// 主场景组件
interface SceneProps {
  // 添加放置模式相关的props
  placementMode?: PlacementMode;
  onPlaceModel?: (position: [number, number, number]) => void;
  onExitPlacement?: () => void; // 添加退出放置模式的回调
  isRunningCallback?: (isRunning: boolean) => void; // 添加运行状态回调
}

const Scene: React.FC<SceneProps> = ({ 
  placementMode = '', 
  onPlaceModel,
  onExitPlacement,
  isRunningCallback
}) => {
  // 添加编辑模式状态
  const [editMode, setEditMode] = useState<EditMode>('select');
  const [drones, setDrones] = useState<DroneData[]>([]);
  const [dockingStations, setDockingStations] = useState<DockingStationData[]>([]);
  const [stationPoints, setStationPoints] = useState<StationPointData[]>([]);
  const [cargos, setCargos] = useState<CargoData[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<'drone' | 'dockingStation' | 'stationPoint' | 'cargo' | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showShiftTip, setShowShiftTip] = useState(false);
  // 添加正在编辑名称的状态，用于阻止删除键冲突
  const [isEditingName, setIsEditingName] = useState(false);
  // 添加接驳柜资产ID计数器
  const [assetIdCounter, setAssetIdCounter] = useState(1);
  const [droneAssetIdCounter, setDroneAssetIdCounter] = useState(1);
  const [stationPointIdCounter, setStationPointIdCounter] = useState(1); // 添加站点资产ID计数器
  
  const [propertiesPanelData, setPropertiesPanelData] = useState<{
    title: string;
    items: {label: string; value: string | number; options?: string[];}[];
    type: 'drone' | 'dockingStation' | null;
  }>({
    title: '',
    items: [],
    type: null
  });

  // 新增：运行态状态
  const [isRunning, setIsRunning] = useState(false);
  
  // 新增：保存原始资产状态
  const [originalDrones, setOriginalDrones] = useState<DroneData[]>([]);
  const [originalDockingStations, setOriginalDockingStations] = useState<DockingStationData[]>([]);
  const [originalStationPoints, setOriginalStationPoints] = useState<StationPointData[]>([]);
  const [originalCargos, setOriginalCargos] = useState<CargoData[]>([]);
  
  // 新增：动画状态标志
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 新增：初始化标志，防止重复加载
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 新增：动画优化 - 使用ref来存储动画相关的状态，避免闭包问题
  const animationRef = useRef({
    isAnimating: false,
    selectedDroneId: null as string | null,
    lastStateUpdate: 0,
    lastPanelUpdate: 0
  });
  
  // 新增：优化的动画更新函数，使用useCallback避免重复创建
  const updateDronePosition = useCallback((droneId: string, newY: number) => {
    setDrones(prev => prev.map(drone => {
      if (drone.id === droneId) {
        const newPosition: [number, number, number] = [
          drone.position[0],
          newY,
          drone.position[2]
        ];
        
        return {
          ...drone,
          position: newPosition
        };
      }
      return drone;
    }));
  }, []);
  
  // 新增：简单的货物位置计算函数
  const getCargoPositions = useCallback(() => {
    return cargos.map(cargo => {
      const drone = drones.find(d => d.cargoId === cargo.id);
      if (drone) {
        // 货物始终在无人机下方0.4米，不要再改动这里的代码
        return {
          ...cargo,
          position: [
            drone.position[0],
            drone.position[1] +0.4,
            drone.position[2]
          ] as [number, number, number]
        };
      }
      return cargo;
    });
  }, [cargos, drones]);
  
  // 新增：优化的属性面板更新函数
  const updatePanelHeight = useCallback((height: number, status: string) => {
    setPropertiesPanelData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.label === '高度') {
          return { ...item, value: height.toFixed(2) };
        }
        if (item.label === '位置 Y') {
          return { ...item, value: height.toFixed(2) };
        }
        if (item.label === '状态') {
          return { ...item, value: status };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  }, []);
  
  // 组件挂载后发送初始运行状态
  useEffect(() => {
    if (isRunningCallback) {
      isRunningCallback(isRunning);
    }
  }, [isRunningCallback]);
  
  // 在组件挂载时从localStorage加载场景数据
  useEffect(() => {
    // 如果已经初始化过，不重新加载
    if (isInitialized) {
      return;
    }
    
    // 从URL获取当前项目ID
    const pathParts = window.location.pathname.split('/');
    const projIdIndex = pathParts.indexOf('editor') + 1;
    const projectId = projIdIndex < pathParts.length ? pathParts[projIdIndex] : null;
    
    if (!projectId) return;
    
    // 从本地存储加载场景数据
    const sceneData = localStorage.getItem(`scene_${projectId}`);
    if (sceneData) {
      try {
        const { drones: savedDrones, dockingStations: savedDockingStations, stationPoints: savedStationPoints } = JSON.parse(sceneData);
        
        // 获取项目号
        const projectNum = getCurrentProjectNumber();
        
        // 只有当savedDrones是有效数组时才设置，否则使用空数组
        if (savedDrones && Array.isArray(savedDrones)) {
          // 确保初始状态下没有选中的对象，并更新无人机资产ID格式
          const initialDrones = savedDrones.map(drone => {
            // 检查是否已经是新格式的资产ID
            const hasNewFormat = drone.modelNumber.startsWith(`UAV${projectNum}`);
            
            return {
              ...drone,
              selected: false,
              // 如果不是新格式，保持原样
              modelNumber: hasNewFormat ? drone.modelNumber : drone.modelNumber
            };
          });
          setDrones(initialDrones);
          
          // 找出最大的无人机资产ID序号
          const uavPrefix = `UAV${projectNum}`;
          const maxDroneIdNum = Math.max(
            ...initialDrones
              .filter(drone => drone.modelNumber.startsWith(uavPrefix))
              .map(drone => {
                const match = drone.modelNumber.match(new RegExp(`${uavPrefix}(\\d+)`));
                return match ? parseInt(match[1]) : 0;
              }),
            0 // 确保至少为0
          );
          
          // 设置无人机资产ID计数器为最大序号+1
          setDroneAssetIdCounter(Math.max(maxDroneIdNum + 1, droneAssetIdCounter));
        } else {
          // 显式设置空数组，确保清除之前的状态
          setDrones([]);
        }
        
        // 只有当savedDockingStations是有效数组时才设置，否则使用空数组
        if (savedDockingStations && Array.isArray(savedDockingStations)) {
          // 确保初始状态下没有选中的对象，并将接驳柜颜色统一设为绿色
          const initialStations = savedDockingStations.map(station => ({
            ...station,
            selected: false,
            color: '#2ecc71' // 统一设置为绿色
          }));
          setDockingStations(initialStations);
        } else {
          // 显式设置空数组，确保清除之前的状态
          setDockingStations([]);
        }

        // 只有当savedStationPoints是有效数组时才设置，否则使用空数组
        if (savedStationPoints && Array.isArray(savedStationPoints)) {
          // 确保初始状态下没有选中的对象
          const initialPoints = savedStationPoints.map(point => ({
            ...point,
            selected: false,
            color: '#e74c3c' // 统一设置为红色
          }));
          setStationPoints(initialPoints);
        } else {
          // 显式设置空数组，确保清除之前的状态
          setStationPoints([]);
        }
        
        // 确保没有选中的对象
        setSelectedObjectId(null);
        setSelectedObjectType(null);
        setShowPanel(false);
        
      } catch (error) {
        console.error('加载场景数据失败:', error);
        // 发生错误时，重置为空数组
        setDrones([]);
        setDockingStations([]);
        setStationPoints([]);
      }
    } else {
      // 没有存储数据时，确保设置为空数组
      setDrones([]);
      setDockingStations([]);
      setStationPoints([]);
    }
    
    // 标记为已初始化
    setIsInitialized(true);
  }, []); // 保持空依赖项，只在组件挂载时执行一次

  // 处理选中对象逻辑
  const handleObjectSelect = useCallback((id: string, type: 'drone' | 'dockingStation' | 'stationPoint' | 'cargo') => {
    if (isRunning) {
      // 运行态下，选择对象也显示属性面板
      // 设置选中对象
      setSelectedObjectId(id);
      setSelectedObjectType(type);
      
      // 更新选中状态
      if (type === 'drone') {
        setDrones(drones.map(drone => ({
          ...drone,
          selected: drone.id === id
        })));
        setDockingStations(dockingStations.map(station => ({
          ...station,
          selected: false
        })));
        setStationPoints(stationPoints.map(point => ({
          ...point,
          selected: false
        })));
      } else if (type === 'dockingStation') {
        setDockingStations(dockingStations.map(station => ({
          ...station,
          selected: station.id === id
        })));
        setDrones(drones.map(drone => ({
          ...drone,
          selected: false
        })));
        setStationPoints(stationPoints.map(point => ({
          ...point,
          selected: false
        })));
      } else if (type === 'stationPoint') {
        setStationPoints(stationPoints.map(point => ({
          ...point,
          selected: point.id === id
        })));
        setDrones(drones.map(drone => ({
          ...drone,
          selected: false
        })));
        setDockingStations(dockingStations.map(station => ({
          ...station,
          selected: false
        })));
      } else if (type === 'cargo') {
        setCargos(cargos.map(cargo => ({
          ...cargo,
          selected: cargo.id === id
        })));
        setDrones(drones.map(drone => ({
          ...drone,
          selected: false
        })));
        setDockingStations(dockingStations.map(station => ({
          ...station,
          selected: false
        })));
        setStationPoints(stationPoints.map(point => ({
          ...point,
          selected: false
        })));
      }
      
      // 显示属性面板
      updatePropertiesPanel(id, type);
      setShowPanel(true);
      
      return;
    }
    
    // 编辑态下原有逻辑保持不变
    // 找到所选对象的数据
    let objectData;
    if (type === 'drone') {
      objectData = drones.find(drone => drone.id === id);
    } else if (type === 'dockingStation') {
      objectData = dockingStations.find(station => station.id === id);
    } else if (type === 'stationPoint') {
      objectData = stationPoints.find(point => point.id === id);
    } else if (type === 'cargo') {
      objectData = cargos.find(cargo => cargo.id === id);
    }
    
    if (!objectData) return;
    
    // 设置选中状态
    setSelectedObjectId(id);
    setSelectedObjectType(type);
    
    // 取消之前选中对象的选择状态
    updateSelectionState(id, type);
    
    // 显示属性面板
    updatePropertiesPanel(id, type);
    setShowPanel(true);
  }, [drones, dockingStations, stationPoints, cargos, isRunning]);

  // 更新选择状态
  const updateSelectionState = (selectedId: string, selectedType: 'drone' | 'dockingStation' | 'stationPoint' | 'cargo') => {
    // 更新无人机选择状态
    setDrones(drones.map(drone => ({
      ...drone,
      selected: drone.id === selectedId && selectedType === 'drone'
    })));
    
    // 更新接驳柜选择状态
    setDockingStations(dockingStations.map(station => ({
      ...station,
      selected: station.id === selectedId && selectedType === 'dockingStation'
    })));
    
    // 更新站点选择状态
    setStationPoints(stationPoints.map(point => ({
      ...point,
      selected: point.id === selectedId && selectedType === 'stationPoint'
    })));
    
    // 直接保存场景，不使用防抖函数
    saveSceneToStorage();
  };

  // 关闭属性面板
  const handleClosePanel = () => {
    // 清除所有选中状态
    setDrones(prev => prev.map(drone => ({
      ...drone,
      selected: false
    })));
    
    setDockingStations(prev => prev.map(station => ({
      ...station,
      selected: false
    })));
    
    setStationPoints(prev => prev.map(point => ({
      ...point,
      selected: false
    })));
    
    setSelectedObjectId(null);
    setSelectedObjectType(null);
    setShowPanel(false);
    
    // 直接保存场景，不使用防抖函数
    saveSceneToStorage();
  };

  // 切换螺旋桨状态
  const handleTogglePropellers = () => {
    if (selectedObjectId && selectedObjectType === 'drone') {
      // 先找到当前选中的无人机
      const drone = drones.find(d => d.id === selectedObjectId);
      if (!drone) return;
      
      // 更新无人机列表
      setDrones(prev => prev.map(d => {
        if (d.id === selectedObjectId) {
          return {
            ...d,
            propellersActive: !d.propellersActive
          };
        }
        return d;
      }));
      
      // 更新属性面板，直接调用updatePropertiesPanel重新生成属性面板
      setTimeout(() => {
        if (selectedObjectId) {
          updatePropertiesPanel(selectedObjectId, 'drone');
        }
      }, 0);
      
      // 直接保存场景
      saveSceneToStorage();
    }
  };
  
  // 切换悬停状态
  const handleToggleHovering = () => {
    if (selectedObjectId && selectedObjectType === 'drone') {
      // 先找到当前选中的无人机
      const drone = drones.find(d => d.id === selectedObjectId);
      if (!drone) return;
      
      // 更新无人机列表
      setDrones(prev => prev.map(d => {
        if (d.id === selectedObjectId) {
          return {
            ...d,
            hovering: !d.hovering
          };
        }
        return d;
      }));
      
      // 更新属性面板，直接调用updatePropertiesPanel重新生成属性面板
      setTimeout(() => {
        if (selectedObjectId) {
          updatePropertiesPanel(selectedObjectId, 'drone');
        }
      }, 0);
      
      // 直接保存场景
      saveSceneToStorage();
    }
  };
  
  // 处理编辑模式变更
  const handleEditModeChange = (mode: EditMode) => {
    setEditMode(mode);
  };
  
  // 添加一个直接保存场景数据的函数
  const saveSceneDataDirectly = (sceneData: { drones: DroneData[], dockingStations: DockingStationData[], stationPoints?: StationPointData[] }, message?: string) => {
    // 如果处于运行态，不保存场景数据
    if (isRunning) {
      console.log('运行态下不保存场景修改');
      return;
    }
    
    // 从URL获取当前项目ID
    const pathParts = window.location.pathname.split('/');
    const projIdIndex = pathParts.indexOf('editor') + 1;
    const projectId = projIdIndex < pathParts.length ? pathParts[projIdIndex] : null;
    
    if (!projectId) return;
    
    // 保存场景数据
    console.log('直接保存场景数据:', 
      sceneData.drones.length, '个无人机,', 
      sceneData.dockingStations.length, '个接驳站,',
      sceneData.stationPoints?.length || 0, '个站点');
    localStorage.setItem(`scene_${projectId}`, JSON.stringify(sceneData));
    
    // 更新项目的lastUpdated时间
    const PROJECTS_KEY = 'uav_drone_sim_projects';
    const storedProjects = localStorage.getItem(PROJECTS_KEY);
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      const updatedProjects = projects.map((p: any) => {
        if (p.id === projectId) {
          return { ...p, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
    }
  };
  
  // 自动保存场景数据到localStorage
  const saveSceneToStorage = (message?: string) => {
    // 如果处于运行态，不保存场景数据
    if (isRunning) {
      console.log('运行态下不保存场景修改');
      return;
    }
    
    // 从URL获取当前项目ID
    const pathParts = window.location.pathname.split('/');
    const projIdIndex = pathParts.indexOf('editor') + 1;
    const projectId = projIdIndex < pathParts.length ? pathParts[projIdIndex] : null;
    
    if (!projectId) return;
    
    // 保存场景数据
    const sceneData = { drones, dockingStations, stationPoints };
    console.log('保存场景数据:', 
      drones.length, '个无人机,', 
      dockingStations.length, '个接驳站,',
      stationPoints.length, '个站点');
    localStorage.setItem(`scene_${projectId}`, JSON.stringify(sceneData));
    
    // 更新项目的lastUpdated时间
    const PROJECTS_KEY = 'uav_drone_sim_projects';
    const storedProjects = localStorage.getItem(PROJECTS_KEY);
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      const updatedProjects = projects.map((p: any) => {
        if (p.id === projectId) {
          return { ...p, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
    }
  };
  
  // 添加处理名称更新的函数
  const handleUpdateName = (newName: string) => {
    // 在运行状态下不允许修改名称
    if (isRunning) return;
    
    if (!selectedObjectId || !selectedObjectType) return;
    
    // 更新状态，表示已完成名称编辑
    setIsEditingName(false);
    
    if (selectedObjectType === 'drone') {
      setDrones(drones.map(drone => {
        if (drone.id === selectedObjectId) {
          return {
            ...drone,
            modelName: newName
          };
        }
        return drone;
      }));
    } else if (selectedObjectType === 'dockingStation') {
      setDockingStations(dockingStations.map(station => {
        if (station.id === selectedObjectId) {
          return {
            ...station,
            modelName: newName
          };
        }
        return station;
      }));
    } else if (selectedObjectType === 'stationPoint') {
      setStationPoints(stationPoints.map(point => {
        if (point.id === selectedObjectId) {
          return {
            ...point,
            modelName: newName
          };
        }
        return point;
      }));
    }
    
    // 更新属性面板标题
    setPropertiesPanelData(prev => ({
      ...prev,
      title: newName
    }));
    
    // 保存更改
    saveSceneToStorage();
  };

  const handlePlaceModelInternal = (position: [number, number, number]) => {
    if (placementMode === 'drone') {
      // 创建新无人机
      const droneCount = drones.length + 1;
      const droneId = `drone-${String(droneCount).padStart(2, '0')}`;
      const newDroneId = `drone-${uuidv4().substring(0, 8)}`;
      
      // 获取项目号
      const projectNumber = getCurrentProjectNumber();
      
      // 生成资产ID，格式：UAV + 项目号 + 序号（5位，不足补0）
      const assetId = `UAV${projectNumber}${String(droneAssetIdCounter).padStart(5, '0')}`;
      setDroneAssetIdCounter(prev => prev + 1); // 更新计数器
      
      const newDrone: DroneData = {
        id: newDroneId,
        position: position,
        rotation: [0, 0, 0], // 固定角度，不再使用随机旋转
        scale: [1, 1, 1],
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        selected: true, // 设置为选中状态
        hovering: false,
        propellersActive: false,
        modelName: `无人机-${String(droneCount).padStart(2, '0')}`,
        modelNumber: assetId
      };
      
      // 更新无人机列表，取消选择其他无人机
      setDrones(prev => {
        const updatedDrones = prev.map(d => ({
          ...d,
          selected: false
        })).concat(newDrone);
        
        // 使用更新后的数组立即保存场景，不依赖于状态更新
        setTimeout(() => {
          const sceneData = {
            drones: updatedDrones,
            dockingStations: dockingStations
          };
          saveSceneDataDirectly(sceneData);
        }, 0);
        
        return updatedDrones;
      });
      
      // 取消选择所有接驳柜
      setDockingStations(prev => prev.map(s => ({
        ...s,
        selected: false
      })));
      
      // 更新选中对象状态
      setSelectedObjectId(newDrone.id);
      setSelectedObjectType('drone');
      setShowPanel(true);
      
      // 立即设置属性面板
      setPropertiesPanelData({
        title: newDrone.modelName,
        items: [
          { label: '资产ID', value: newDrone.modelNumber },
          { label: '状态', value: '正常' },
          { label: '电池电量', value: '87%' },
          { label: '位置 X', value: newDrone.position[0].toFixed(2) },
          { label: '位置 Y', value: newDrone.position[1].toFixed(2) },
          { label: '位置 Z', value: newDrone.position[2].toFixed(2) },
          { label: '旋转角度', value: (newDrone.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
          { label: '螺旋桨状态', value: newDrone.propellersActive ? '旋转中' : '静止' },
          { label: '悬停状态', value: newDrone.hovering ? '悬停中' : '静止' },
        ],
        type: 'drone'
      });
      
    } else if (placementMode === 'dockingStation') {
      // 创建新接驳柜
      const stationCount = dockingStations.length + 1;
      const projectNumber = getCurrentProjectNumber();
      
      // 生成资产ID，格式：FCS + 项目号 + 序号（5位，不足补0）
      const assetId = `FCS${projectNumber}${String(assetIdCounter).padStart(5, '0')}`;
      setAssetIdCounter(prev => prev + 1); // 更新计数器
      
      const newStationId = `station-${uuidv4().substring(0, 8)}`;
      const newStation: DockingStationData = {
        id: newStationId,
        position: position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#2ecc71',
        selected: true, // 设置为选中状态
        modelName: `接驳柜-${String(stationCount).padStart(2, '0')}`,
        modelNumber: assetId,
        liftPosition: 1, // 默认升降板在顶部
        shelfOccupancy: [false, false, false, false] // 初始化货架占用状态：[底层左, 底层右, 上层左, 上层右]
      };
      
      // 更新接驳柜列表，取消选择其他接驳柜
      setDockingStations(prev => {
        const updatedStations = prev.map(s => ({
          ...s,
          selected: false
        })).concat(newStation);
        
        // 使用更新后的数组立即保存场景，不依赖于状态更新
        setTimeout(() => {
          const sceneData = {
            drones: drones,
            dockingStations: updatedStations
          };
          saveSceneDataDirectly(sceneData);
        }, 0);
        
        return updatedStations;
      });
      
      // 取消选择所有无人机
      setDrones(prev => prev.map(d => ({
        ...d,
        selected: false
      })));
      
      // 更新选中对象状态
      setSelectedObjectId(newStation.id);
      setSelectedObjectType('dockingStation');
      setShowPanel(true);
      
      // 立即设置属性面板
      // 计算升降板高度值用于显示
      const liftHeight = ((newStation.liftPosition ?? 1) * 2.2).toFixed(2);
      console.log('升降板高度计算:', newStation.liftPosition, '→', liftHeight + '米');
      
      // 获取绑定站点信息
      const boundStation = newStation.boundStationId ? 
        stationPoints.find(point => point.id === newStation.boundStationId) : null;
      const boundStationText = boundStation ? boundStation.modelName : '未绑定';
      
      // 创建站点选项列表（包含"未绑定"选项）
      // 过滤掉已经被其他接驳柜绑定的站点，但保留当前接驳柜已绑定的站点
      const availableStations = stationPoints.filter(point => {
        // 检查是否已被其他接驳柜绑定
        const isAlreadyBound = dockingStations.some(otherStation => 
          otherStation.id !== newStation.id && otherStation.boundStationId === point.id
        );
        // 如果没有被其他接驳柜绑定，或者是当前接驳柜绑定的站点，则可选
        return !isAlreadyBound || point.id === newStation.boundStationId;
      });
      const stationOptions = ['未绑定', ...availableStations.map(point => point.modelName)];
      
      // 计算当前容量 - 根据货架占用状态
      const shelfOccupancy = newStation.shelfOccupancy || [false, false, false, false];
      const occupiedCount = shelfOccupancy.filter(occupied => occupied).length;
      const currentCapacity = `${occupiedCount}/4`;
      
      // 根据占用情况确定货架状态
      const shelfStatus = occupiedCount === 0 ? '空闲' : 
                         occupiedCount === 4 ? '已满' : 
                         `部分占用(${occupiedCount}/4)`;
      
      setPropertiesPanelData({
        title: newStation.modelName,
        items: [
          { label: '资产ID', value: newStation.modelNumber },
          { label: '电源', value: '已连接' },
          { label: '绑定站点', value: boundStationText, options: stationOptions },
          { label: '位置 X', value: newStation.position[0].toFixed(2) },
          { label: '位置 Y', value: newStation.position[1].toFixed(2) },
          { label: '位置 Z', value: newStation.position[2].toFixed(2) },
          { label: '旋转角度', value: (newStation.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
          { label: '升降板状态', value: '顶部' },
          { label: '升降板高度', value: '2.20米' },
          { label: '当前容量', value: currentCapacity },
          { label: '货架层数', value: '2层' },
          { label: '货架状态', value: shelfStatus },
          { label: '货物位置', value: '4个(每层2个)' },
        ],
        type: 'dockingStation'
      });
    } else if (placementMode === 'stationPoint') {
      // 创建新站点
      const pointCount = stationPoints.length + 1;
      const projectNumber = getCurrentProjectNumber();
      
      // 生成资产ID，格式：STP + 项目号 + 序号（5位，不足补0）
      const assetId = `STP${projectNumber}${String(stationPointIdCounter).padStart(5, '0')}`;
      setStationPointIdCounter(prev => prev + 1); // 更新计数器
      
      const newPointId = `point-${uuidv4().substring(0, 8)}`;
      const newPoint: StationPointData = {
        id: newPointId,
        position: position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#e74c3c',
        selected: true, // 设置为选中状态
        modelName: `站点-${String(pointCount).padStart(2, '0')}`,
        modelNumber: assetId,
        stationNumber: pointCount,
        stationType: '起降站点' // 将默认类型修改为"起降站点"
      };
      
      // 更新站点列表，取消选择其他站点
      setStationPoints(prev => {
        const updatedPoints = prev.map(p => ({
          ...p,
          selected: false
        })).concat(newPoint);
        
        // 使用更新后的数组立即保存场景，不依赖于状态更新
        setTimeout(() => {
          const sceneData = {
            drones: drones,
            dockingStations: dockingStations,
            stationPoints: updatedPoints
          };
          saveSceneDataDirectly(sceneData);
        }, 0);
        
        return updatedPoints;
      });
      
      // 取消选择其他对象
      setDrones(prev => prev.map(d => ({
        ...d,
        selected: false
      })));
      
      setDockingStations(prev => prev.map(s => ({
        ...s,
        selected: false
      })));
      
      // 更新选中对象状态
      setSelectedObjectId(newPoint.id);
      setSelectedObjectType('stationPoint');
      setShowPanel(true);
      
      // 立即设置属性面板
      setPropertiesPanelData({
        title: newPoint.modelName,
        items: [
          { label: '资产ID', value: newPoint.modelNumber },
          { label: '站点类型', value: newPoint.stationType, options: ['起降站点', '悬停站点'] },
          { label: '站点编号', value: newPoint.stationNumber.toString() },
          { label: '位置 X', value: newPoint.position[0].toFixed(2) },
          { label: '位置 Y', value: newPoint.position[1].toFixed(2) },
          { label: '位置 Z', value: newPoint.position[2].toFixed(2) },
          { label: '旋转角度', value: (newPoint.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
          { label: '状态', value: '等待中' },
        ],
        type: null
      });
    }
    
    // 如果有外部处理函数，也调用它
    if (onPlaceModel) {
      onPlaceModel(position);
    }
  };

  // 处理对象变换
  const handleObjectTransform = (
    id: string, 
    type: 'drone' | 'dockingStation' | 'stationPoint' | 'cargo', 
    position?: [number, number, number], 
    rotation?: [number, number, number], 
    scale?: [number, number, number]
  ) => {
    if (type === 'drone') {
      setDrones(drones.map(drone => {
        if (drone.id === id) {
          return {
            ...drone,
            position: position || drone.position,
            rotation: rotation || drone.rotation,
            scale: scale || drone.scale
          };
        }
        return drone;
      }));
      
      // 更新属性面板
      if (selectedObjectId === id && selectedObjectType === 'drone') {
        updatePropertiesPanel(id, 'drone');
      }
    } else if (type === 'dockingStation') {
      setDockingStations(dockingStations.map(station => {
        if (station.id === id) {
          return {
            ...station,
            position: position || station.position,
            rotation: rotation || station.rotation,
            scale: scale || station.scale
          };
        }
        return station;
      }));
      
      // 更新属性面板
      if (selectedObjectId === id && selectedObjectType === 'dockingStation') {
        updatePropertiesPanel(id, 'dockingStation');
      }
    } else if (type === 'stationPoint') {
      setStationPoints(stationPoints.map(point => {
        if (point.id === id) {
          return {
            ...point,
            position: position || point.position,
            rotation: rotation || point.rotation,
            scale: scale || point.scale
          };
        }
        return point;
      }));
      
      // 更新属性面板
      if (selectedObjectId === id && selectedObjectType === 'stationPoint') {
        updatePropertiesPanel(id, 'stationPoint');
      }
    }
    
    // 直接保存变更到本地存储
    saveSceneToStorage();
  };

  // 更新属性面板
  const updatePropertiesPanel = useCallback((id: string, type: 'drone' | 'dockingStation' | 'stationPoint' | 'cargo') => {
    // 找到所选对象的数据
    let objectData;
    if (type === 'drone') {
      objectData = drones.find(drone => drone.id === id);
    } else if (type === 'dockingStation') {
      objectData = dockingStations.find(station => station.id === id);
    } else if (type === 'stationPoint') {
      objectData = stationPoints.find(point => point.id === id);
    } else if (type === 'cargo') {
      objectData = cargos.find(cargo => cargo.id === id);
    }
    
    if (!objectData) {
      return;
    }
    
    // 设置属性面板数据
    if (type === 'drone') {
      const drone = objectData as DroneData;
      // 检查无人机是否有货物 - 修复逻辑
      const hasCargo = drone.cargoId && cargos.some(cargo => cargo.id === drone.cargoId);
      const capacity = hasCargo ? '1/1' : '0/1';
      
      setPropertiesPanelData({
        title: drone.modelName,
        items: [
          { label: '资产ID', value: drone.modelNumber },
          { label: '状态', value: '正常' },
          { label: '电池电量', value: '87%' },
          { label: '高度', value: drone.position[1].toFixed(2) },
          { label: '位置 X', value: drone.position[0].toFixed(2) },
          { label: '位置 Y', value: drone.position[1].toFixed(2) },
          { label: '位置 Z', value: drone.position[2].toFixed(2) },
          { label: '旋转角度', value: (drone.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
          { label: '螺旋桨状态', value: drone.propellersActive ? '旋转中' : '静止' },
          { label: '悬停状态', value: drone.hovering ? '悬停中' : '静止' },
          { label: '载货状态', value: capacity },
        ],
        type: 'drone'
      });
    } else if (type === 'dockingStation') {
      const station = objectData as DockingStationData;
      
      // 获取最新的升降板位置值
      const liftPosition = station.liftPosition ?? 1;
      
      // 强制将位置值转换为数字类型
      const liftPositionValue = Number(liftPosition);
      
      // 确定升降板状态文本
      let liftStatusText;
      
      // 严格判断是否为0或1
      if (liftPositionValue === 0) {
        liftStatusText = '底部';
      } else if (liftPositionValue === 1) {
        liftStatusText = '顶部';
      } else if (Math.abs(liftPositionValue) < 0.01) {
        // 非常接近0
        liftStatusText = '底部';
      } else if (Math.abs(liftPositionValue - 1) < 0.01) {
        // 非常接近1
        liftStatusText = '顶部';
      } else {
        // 其他情况
        const percent = Math.round(liftPositionValue * 100);
        liftStatusText = `运动中 (${percent}%)`;
      }
      
      // 获取绑定站点信息
      const boundStation = station.boundStationId ? 
        stationPoints.find(point => point.id === station.boundStationId) : null;
      const boundStationText = boundStation ? boundStation.modelName : '未绑定';
      
      // 创建站点选项列表（包含"未绑定"选项）
      // 过滤掉已经被其他接驳柜绑定的站点，但保留当前接驳柜已绑定的站点
      const availableStations = stationPoints.filter(point => {
        // 检查是否已被其他接驳柜绑定
        const isAlreadyBound = dockingStations.some(otherStation => 
          otherStation.id !== station.id && otherStation.boundStationId === point.id
        );
        // 如果没有被其他接驳柜绑定，或者是当前接驳柜绑定的站点，则可选
        return !isAlreadyBound || point.id === station.boundStationId;
      });
      const stationOptions = ['未绑定', ...availableStations.map(point => point.modelName)];
      
      // 计算当前容量 - 根据货架占用状态
      const shelfOccupancy = station.shelfOccupancy || [false, false, false, false];
      const occupiedCount = shelfOccupancy.filter(occupied => occupied).length;
      const currentCapacity = `${occupiedCount}/4`;
      
      // 根据占用情况确定货架状态
      const shelfStatus = occupiedCount === 0 ? '空闲' : 
                         occupiedCount === 4 ? '已满' : 
                         `部分占用(${occupiedCount}/4)`;
      
      setPropertiesPanelData({
        title: station.modelName,
        items: [
          { label: '资产ID', value: station.modelNumber },
          { label: '电源', value: '已连接' },
          { label: '绑定站点', value: boundStationText, options: stationOptions },
          { label: '位置 X', value: station.position[0].toFixed(2) },
          { label: '位置 Y', value: station.position[1].toFixed(2) },
          { label: '位置 Z', value: station.position[2].toFixed(2) },
          { label: '旋转角度', value: (station.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
          { label: '升降板状态', value: liftStatusText },
          { label: '升降板高度', value: `${(liftPositionValue * 2.2).toFixed(2)}米` },
          { label: '当前容量', value: currentCapacity },
          { label: '货架层数', value: '2层' },
          { label: '货架状态', value: shelfStatus },
          { label: '货物位置', value: '4个(每层2个)' },
        ],
        type: 'dockingStation'
      });
    } else if (type === 'stationPoint') {
      const point = objectData as StationPointData;
      setPropertiesPanelData({
        title: point.modelName,
        items: [
          { label: '资产ID', value: point.modelNumber },
          { label: '站点类型', value: point.stationType, options: ['起降站点', '悬停站点'] },
          { label: '站点编号', value: point.stationNumber.toString() },
          { label: '位置 X', value: point.position[0].toFixed(2) },
          { label: '位置 Y', value: point.position[1].toFixed(2) },
          { label: '位置 Z', value: point.position[2].toFixed(2) },
          { label: '旋转角度', value: (point.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
          { label: '状态', value: '等待中' },
        ],
        type: null
      });
    }
  }, [drones, dockingStations, stationPoints, cargos]);

  // 切换编辑模式时显示提示
  useEffect(() => {
    if (editMode !== 'select' && selectedObjectId) {
      // 显示提示
      setShowShiftTip(true);
      // 3秒后自动隐藏提示
      const timer = setTimeout(() => {
        setShowShiftTip(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowShiftTip(false);
    }
  }, [editMode, selectedObjectId]);
  
  // 添加键盘Delete键事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果当前正在编辑名称，则不处理删除键事件
      if (isEditingName) return;
      
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedObjectId && selectedObjectType) {
        // 如果有选中的对象，则删除它
        if (selectedObjectType === 'drone') {
          // 提前保存被删除对象的ID
          const idToDelete = selectedObjectId;
          
          // 删除无人机并立即保存
          setDrones(prev => {
            const updatedDrones = prev.filter(d => d.id !== idToDelete);
            
            // 使用setTimeout确保状态更新后再保存
            setTimeout(() => {
              // 直接使用新数组执行保存，而不是依赖状态
              const sceneData = { 
                drones: updatedDrones, 
                dockingStations 
              };
              
              // 手动保存到localStorage
              saveSceneDataDirectly(sceneData);
            }, 100);
            
            return updatedDrones;
          });
        } else if (selectedObjectType === 'dockingStation') {
          // 提前保存被删除对象的ID
          const idToDelete = selectedObjectId;
          
          // 删除接驳柜并立即保存
          setDockingStations(prev => {
            const updatedStations = prev.filter(s => s.id !== idToDelete);
            
            setTimeout(() => {
              // 直接使用新数组执行保存，而不是依赖状态
              const sceneData = { 
                drones, 
                dockingStations: updatedStations 
              };
              
              // 手动保存到localStorage
              saveSceneDataDirectly(sceneData);
            }, 100);
            
            return updatedStations;
          });
        } else if (selectedObjectType === 'stationPoint') {
          // 提前保存被删除对象的ID
          const idToDelete = selectedObjectId;
          
          // 删除站点并立即保存
          setStationPoints(prev => {
            const updatedPoints = prev.filter(p => p.id !== idToDelete);
            
            setTimeout(() => {
              // 直接使用新数组执行保存，而不是依赖状态
              const sceneData = { 
                drones, 
                dockingStations, 
                stationPoints: updatedPoints 
              };
              
              // 手动保存到localStorage
              saveSceneDataDirectly(sceneData);
            }, 100);
            
            return updatedPoints;
          });
        } else if (selectedObjectType === 'cargo') {
          // 提前保存被删除对象的ID
          const idToDelete = selectedObjectId;
          
          // 删除货物并立即保存
          setCargos(prev => {
            const updatedCargos = prev.filter(cargo => cargo.id !== idToDelete);
            
            setTimeout(() => {
              // 直接使用新数组执行保存，而不是依赖状态
              const sceneData = { 
                drones, 
                dockingStations, 
                stationPoints, 
                cargos: updatedCargos
              };
              
              // 手动保存到localStorage
              saveSceneDataDirectly(sceneData);
            }, 100);
            
            return updatedCargos;
          });
        }
        
        // 清除选中状态
        setSelectedObjectId(null);
        setSelectedObjectType(null);
        
        // 隐藏属性面板
        setShowPanel(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, selectedObjectType, drones, dockingStations, stationPoints, isEditingName]);

  // 在组件卸载前执行最终保存
  useEffect(() => {
    return () => {
      // 如果有未保存的状态更改，确保它们被保存
      if (drones.length > 0 || dockingStations.length > 0 || stationPoints.length > 0) {
        // 不显示提示语，直接保存
        saveSceneToStorage();
      }
    };
  }, [drones, dockingStations, stationPoints]);

  // 内部处理退出放置模式的函数
  const handleExitPlacement = useCallback(() => {
    if (onExitPlacement) {
      onExitPlacement();
    }
  }, [onExitPlacement]);

  // 获取当前项目号的函数
  const getCurrentProjectNumber = useCallback(() => {
    // 从URL获取当前项目ID
    const pathParts = window.location.pathname.split('/');
    const projIdIndex = pathParts.indexOf('editor') + 1;
    const projectId = projIdIndex < pathParts.length ? pathParts[projIdIndex] : null;
    
    if (!projectId) return 1; // 默认为项目1
    
    // 尝试从localStorage获取项目列表
    const PROJECTS_KEY = 'uav_drone_sim_projects';
    const storedProjects = localStorage.getItem(PROJECTS_KEY);
    if (!storedProjects) return 1;
    
    try {
      const projects = JSON.parse(storedProjects);
      // 查找当前项目在所有项目中的索引+1作为项目号
      const projectIndex = projects.findIndex((p: any) => p.id === projectId);
      return projectIndex >= 0 ? projectIndex + 1 : 1;
    } catch (e) {
      console.error('解析项目数据失败', e);
      return 1; // 出错时默认为项目1
    }
  }, []);

  // 在组件挂载时初始化资产ID计数器
  useEffect(() => {
    // 获取当前项目的接驳柜数量，初始化计数器
    if (dockingStations.length > 0) {
      // 查找当前最大序号
      const projectNum = getCurrentProjectNumber();
      const prefix = `FCS${projectNum}`;
      
      const maxIdNum = Math.max(...dockingStations.map(station => {
        const match = station.modelNumber.match(new RegExp(`${prefix}(\\d+)`));
        return match ? parseInt(match[1]) : 0;
      }));
      
      // 设置计数器为当前最大序号+1
      setAssetIdCounter(prevCounter => Math.max(maxIdNum + 1, prevCounter));
    }
    
    // 获取当前项目的无人机数量，初始化计数器
    if (drones.length > 0) {
      // 查找当前最大序号
      const projectNum = getCurrentProjectNumber();
      const prefix = `UAV${projectNum}`;
      
      const maxIdNum = Math.max(...drones.map(drone => {
        const match = drone.modelNumber.match(new RegExp(`${prefix}(\\d+)`));
        return match ? parseInt(match[1]) : 0;
      }));
      
      // 设置计数器为当前最大序号+1
      setDroneAssetIdCounter(prevCounter => Math.max(maxIdNum + 1, prevCounter));
    }
    
    // 获取当前项目的站点数量，初始化计数器
    if (stationPoints.length > 0) {
      // 查找当前最大序号
      const projectNum = getCurrentProjectNumber();
      const prefix = `STP${projectNum}`;
      
      const maxIdNum = Math.max(...stationPoints.map(point => {
        const match = point.modelNumber.match(new RegExp(`${prefix}(\\d+)`));
        return match ? parseInt(match[1]) : 0;
      }));
      
      // 设置计数器为当前最大序号+1
      setStationPointIdCounter(prevCounter => Math.max(maxIdNum + 1, prevCounter));
    }
  }, [dockingStations, drones, stationPoints, getCurrentProjectNumber]);

  // 处理运行态切换
  const handleToggleRunState = useCallback(() => {
    setIsRunning(prev => {
      const newState = !prev;
      
      if (newState) {
        // 切换到运行态，保存当前资产状态
        setOriginalDrones([...drones]);
        setOriginalDockingStations([...dockingStations]);
        setOriginalStationPoints([...stationPoints]);
        setOriginalCargos([...cargos]);
        
        // 不再清除选中对象和属性面板，而是保留当前选中状态
        // 只有在没有选中对象时才关闭属性面板
        if (!selectedObjectId) {
          setShowPanel(false);
        }
        
        // 通知外部退出放置模式
        if (placementMode && onExitPlacement) {
          onExitPlacement();
        }
      } else {
        // 从运行态切换回编辑态
        // 记录当前选中的对象ID和类型
        const currentSelectedId = selectedObjectId;
        const currentSelectedType = selectedObjectType;
        const wasShowingPanel = showPanel;
        
        // 恢复接驳柜到进入运行态前的完整原始状态
        setDockingStations(prev => {
          return prev.map(current => {
            const original = originalDockingStations.find(orig => orig.id === current.id);
            if (original) {
            return {
                ...original, // 完全恢复到原始状态，包括升降板位置等所有属性
                selected: current.id === currentSelectedId && currentSelectedType === 'dockingStation'
              };
            }
            return {
              ...current,
              selected: current.id === currentSelectedId && currentSelectedType === 'dockingStation'
            };
          });
        });
        
        // 恢复无人机到进入运行态前的完整原始状态，并清除所有cargoId
        setDrones(prev => {
          return prev.map(current => {
            const original = originalDrones.find(orig => orig.id === current.id);
            if (original) {
            return {
                ...original, // 完全恢复到原始状态，包括位置、螺旋桨状态、悬停状态等所有属性
                cargoId: undefined, // 清除货物关联
                selected: current.id === currentSelectedId && currentSelectedType === 'drone'
              };
            }
            return {
              ...current,
              cargoId: undefined, // 清除货物关联
              selected: current.id === currentSelectedId && currentSelectedType === 'drone'
            };
          });
        });
        
        // 恢复站点到进入运行态前的完整原始状态
        setStationPoints(prev => {
          return prev.map(current => {
            const original = originalStationPoints.find(orig => orig.id === current.id);
            if (original) {
              return {
                ...original, // 完全恢复到原始状态，包括站点类型等所有属性
                selected: current.id === currentSelectedId && currentSelectedType === 'stationPoint'
              };
            }
            return {
              ...current,
              selected: current.id === currentSelectedId && currentSelectedType === 'stationPoint'
            };
          });
        });
        
        // 清除所有货物，恢复到编辑状态
        setCargos([]);
        
        // 如果之前有显示面板，恢复后也显示，并确保属性面板显示正确的原始状态
        if (wasShowingPanel && currentSelectedId && currentSelectedType) {
          setTimeout(() => {
            // 确保状态已更新后再更新属性面板，显示恢复后的原始状态
            updatePropertiesPanel(currentSelectedId, currentSelectedType);
          }, 100); // 增加延迟确保状态完全更新
        }
        
        // 重置原始状态存储
        setOriginalDrones([]);
        setOriginalDockingStations([]);
        setOriginalStationPoints([]);
        setOriginalCargos([]);
      }
      
      // 通知外部运行状态变化
      if (isRunningCallback) {
        isRunningCallback(newState);
      }
      
      return newState;
    });
    
    // 重置动画状态，确保没有残留的动画状态（在setIsRunning外部执行）
    setIsAnimating(false);
    animationRef.current.isAnimating = false;
    animationRef.current.selectedDroneId = null;
  }, [placementMode, onExitPlacement, isRunningCallback, drones, dockingStations, stationPoints, originalDrones, originalDockingStations, originalStationPoints, selectedObjectId, selectedObjectType, showPanel, updatePropertiesPanel]);

  // 处理升降板状态切换
  const handleToggleLift = (position: 'up' | 'down') => {
    if (selectedObjectId && selectedObjectType === 'dockingStation') {
      // 先找到当前选中的接驳柜
      const stationIndex = dockingStations.findIndex(s => s.id === selectedObjectId);
      if (stationIndex === -1) return;
      
      const station = dockingStations[stationIndex];
      
      // 获取当前升降板位置，并确保转换为数字类型
      const currentPosition = Number(station.liftPosition ?? 1);
      
      // 如果已经在目标位置，不执行操作
      if ((position === 'up' && currentPosition >= 1) || 
          (position === 'down' && currentPosition <= 0)) {
        return;
      }
      
      // 设置目标位置和步长
      const targetPosition = position === 'up' ? 1 : 0;
      const step = position === 'up' ? 0.02 : -0.02; // 降低步长，使动画更慢
      
      // 运行动画
      let currentPos = currentPosition;
      const animationInterval = setInterval(() => {
        // 计算新位置
        currentPos += step;
        
        // 确保在边界内
        if (position === 'up' && currentPos > 1) currentPos = 1;
        if (position === 'down' && currentPos < 0) currentPos = 0;
        
        // 直接克隆并更新整个数组，确保React捕获到变化
        const newDockingStations = [...dockingStations];
        newDockingStations[stationIndex] = {
          ...newDockingStations[stationIndex],
          liftPosition: currentPos
        };
        
        // 更新状态
        setDockingStations(newDockingStations);
        
        // 强制更新属性面板
        updatePropertiesPanel(selectedObjectId, 'dockingStation');
        
        // 检查是否到达目标位置
        if ((position === 'up' && currentPos >= 1) || 
            (position === 'down' && currentPos <= 0)) {
          clearInterval(animationInterval);
          
          // 确保最终位置是精确值，直接设置为整数0或1
          const finalDockingStations = [...dockingStations];
          finalDockingStations[stationIndex] = {
            ...finalDockingStations[stationIndex],
            liftPosition: targetPosition // 设置为精确的0或1
          };
          setDockingStations(finalDockingStations);
          
          // 手动创建最终的属性面板数据
          const finalStation = finalDockingStations[stationIndex];
          
          // 创建升降板状态显示文本
          const statusText = position === 'up' ? '顶部' : '底部';
          
          // 创建高度显示文本
          const heightText = `${targetPosition === 1 ? '2.20米' : '0.00米'}`;
          
          // 手动更新属性面板数据
          setPropertiesPanelData({
            title: finalStation.modelName,
            items: [
              { label: '资产ID', value: finalStation.modelNumber },
              { label: '电源', value: '已连接' },
              { label: '位置 X', value: finalStation.position[0].toFixed(2) },
              { label: '位置 Y', value: finalStation.position[1].toFixed(2) },
              { label: '位置 Z', value: finalStation.position[2].toFixed(2) },
              { label: '旋转角度', value: (finalStation.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
              { label: '升降板状态', value: statusText },
              { label: '升降板高度', value: heightText },
              { label: '当前容量', value: '0/4' },
              { label: '货架层数', value: '2层' },
              { label: '货架状态', value: '空闲' },
              { label: '货物位置', value: '4个(每层2个)' },
            ],
            type: 'dockingStation'
          });
        }
      }, 80); // 增加更新间隔时间，使动画更平滑和缓慢
    }
  };

  // 处理下降到指定层级
  const handleLiftToLevel = (level: number) => {
    if (selectedObjectId && selectedObjectType === 'dockingStation') {
      // 先找到当前选中的接驳柜
      const stationIndex = dockingStations.findIndex(s => s.id === selectedObjectId);
      if (stationIndex === -1) return;
      
      const station = dockingStations[stationIndex];
      
      // 确保level在有效范围内
      if (level < 1 || level > 2) {
        console.warn('无效的货架层级:', level);
        return;
      }
      
      // 获取当前升降板位置
      const currentPosition = Number(station.liftPosition ?? 1);
      
      // 计算目标位置 - 基于货架的高度
      // 根据DockingStationModel.tsx的设置，货架参数如下：
      // shelfStartY = baseHeight + 0.5 = 0.2 + 0.5 = 0.7米（第1层）
      // 第2层 = shelfStartY + compartmentHeight = 0.7 + 1 = 1.7米
      
      // 升降板位置是基于0-1之间的相对值，其中0是底部，1是顶部
      // 升降板高度在0-2.2米之间，所以位置值需要转换
      
      // 目标高度（米）- 根据用户定义
      // 第1层高度 = shelfStartY = 0.7米
      // 第2层高度 = shelfStartY + 1 = 1.7米
      const shelfStartY = 0; // baseHeight(0.2) + 0.5
      const targetHeight = level === 1 ? shelfStartY : shelfStartY + 1;
      
      // 转换为位置值（0-1之间）
      const targetPosition = targetHeight / 2.2;
      
      // 如果已经在目标位置附近，不执行操作
      if (Math.abs(currentPosition - targetPosition) < 0.05) {
        return;
      }
      
      // 设置步长方向
      const step = currentPosition > targetPosition ? -0.02 : 0.02;
      
      // 运行动画
      let currentPos = currentPosition;
      const animationInterval = setInterval(() => {
        // 计算新位置
        currentPos += step;
        
        // 检查是否到达或超过目标位置
        const reachedTarget = step > 0 
          ? currentPos >= targetPosition 
          : currentPos <= targetPosition;
        
        // 如果到达目标，设置为精确目标值
        if (reachedTarget) {
          currentPos = targetPosition;
        }
        
        // 直接克隆并更新整个数组
        const newDockingStations = [...dockingStations];
        newDockingStations[stationIndex] = {
          ...newDockingStations[stationIndex],
          liftPosition: currentPos
        };
        
        // 更新状态
        setDockingStations(newDockingStations);
        
        // 强制更新属性面板
        updatePropertiesPanel(selectedObjectId, 'dockingStation');
        
        // 检查是否到达目标位置
        if (reachedTarget) {
          clearInterval(animationInterval);
          
          // 确保最终位置是精确值，直接设置为整数0或1
          const finalDockingStations = [...dockingStations];
          finalDockingStations[stationIndex] = {
            ...finalDockingStations[stationIndex],
            liftPosition: targetPosition // 设置为精确的0或1
          };
          setDockingStations(finalDockingStations);
          
          // 手动创建最终的属性面板数据
          const finalStation = finalDockingStations[stationIndex];
          
          // 创建升降板状态显示文本
          const statusText = `第${level}层位置`;
          
          // 创建高度显示文本
          const heightText = `${targetHeight.toFixed(2)}米`;
          
          // 手动更新属性面板数据
          setPropertiesPanelData({
            title: finalStation.modelName,
            items: [
              { label: '资产ID', value: finalStation.modelNumber },
              { label: '电源', value: '已连接' },
              { label: '位置 X', value: finalStation.position[0].toFixed(2) },
              { label: '位置 Y', value: finalStation.position[1].toFixed(2) },
              { label: '位置 Z', value: finalStation.position[2].toFixed(2) },
              { label: '旋转角度', value: (finalStation.rotation[1] * (180/Math.PI)).toFixed(0) + '°' },
              { label: '升降板状态', value: statusText },
              { label: '升降板高度', value: heightText },
              { label: '当前容量', value: '0/4' },
              { label: '货架层数', value: '2层' },
              { label: '货架状态', value: '空闲' },
              { label: '货物位置', value: '4个(每层2个)' },
            ],
            type: 'dockingStation'
          });
        }
      }, 80);
    }
  };

  // 处理站点类型变更
  const handleStationTypeChange = (newType: string) => {
    if (selectedObjectId && selectedObjectType === 'stationPoint') {
      // 立即更新属性面板显示，不等待状态更新
      const currentItems = [...propertiesPanelData.items];
      const typeItemIndex = currentItems.findIndex(item => item.label === '站点类型');
      
      if (typeItemIndex !== -1) {
        currentItems[typeItemIndex] = {
          ...currentItems[typeItemIndex],
          value: newType,
          options: ['起降站点', '悬停站点']
        };
        
        // 立即更新面板数据
        setPropertiesPanelData({
          ...propertiesPanelData,
          items: currentItems
        });
      }
      
      // 更新站点状态
      setStationPoints(prev => {
        const updatedPoints = prev.map(point => {
          if (point.id === selectedObjectId) {
            return {
              ...point,
              stationType: newType
            };
          }
          return point;
        });
        
        // 保存场景数据
        const sceneData = {
          drones,
          dockingStations,
          stationPoints: updatedPoints
        };
        
        saveSceneDataDirectly(sceneData);
        
        return updatedPoints;
      });
    }
  };

  // 处理接驳柜站点绑定变更
  const handleStationBindingChange = (newStationName: string) => {
    if (selectedObjectId && selectedObjectType === 'dockingStation') {
      // 找到对应的站点ID
      const targetStation = newStationName === '未绑定' ? null : 
        stationPoints.find(point => point.modelName === newStationName);
      const newStationId = targetStation ? targetStation.id : undefined;
      
      // 如果选择了一个站点，检查该站点是否已被其他接驳柜绑定
      if (newStationId) {
        const isAlreadyBound = dockingStations.some(station => 
          station.id !== selectedObjectId && station.boundStationId === newStationId
        );
        
        if (isAlreadyBound) {
          // 如果站点已被绑定，显示警告并不执行绑定
          alert(`站点"${newStationName}"已被其他接驳柜绑定，请选择其他站点。`);
          return;
        }
      }
      
      // 立即更新属性面板显示，不等待状态更新
      const currentItems = [...propertiesPanelData.items];
      const bindingItemIndex = currentItems.findIndex(item => item.label === '绑定站点');
      
      if (bindingItemIndex !== -1) {
        // 创建站点选项列表
        const availableStations = stationPoints.filter(point => {
          // 检查是否已被其他接驳柜绑定
          const isAlreadyBound = dockingStations.some(otherStation => 
            otherStation.id !== selectedObjectId && otherStation.boundStationId === point.id
          );
          // 如果没有被其他接驳柜绑定，或者是当前接驳柜绑定的站点，则可选
          const currentStation = dockingStations.find(s => s.id === selectedObjectId);
          return !isAlreadyBound || point.id === currentStation?.boundStationId;
        });
        const stationOptions = ['未绑定', ...availableStations.map(point => point.modelName)];
        
        currentItems[bindingItemIndex] = {
          ...currentItems[bindingItemIndex],
          value: newStationName,
          options: stationOptions
        };
        
        // 立即更新面板数据
        setPropertiesPanelData({
          ...propertiesPanelData,
          items: currentItems
        });
      }
      
      // 更新接驳柜状态
      setDockingStations(prev => {
        const updatedStations = prev.map(station => {
          if (station.id === selectedObjectId) {
            return {
              ...station,
              boundStationId: newStationId
            };
          }
          return station;
        });
        
        // 保存场景数据
        const sceneData = {
          drones,
          dockingStations: updatedStations,
          stationPoints
        };
        
        saveSceneDataDirectly(sceneData);
        
        return updatedStations;
      });
    }
  };

  // 重新实现完整的起飞功能
  const handleTakeOff = (targetStationId: string) => {
    if (!selectedObjectId || selectedObjectType !== 'drone') return;
    
    // 查找目标站点
    const targetStation = stationPoints.find(station => station.id === targetStationId);
    if (!targetStation) {
      console.error('未找到目标站点:', targetStationId);
      return;
    }
    
    // 获取当前无人机
    const selectedDrone = drones.find(d => d.id === selectedObjectId);
    if (!selectedDrone) return;
    
    // 设置动画状态
    setIsAnimating(true);
    animationRef.current.isAnimating = true;
    animationRef.current.selectedDroneId = selectedObjectId;
    
    // 启动无人机螺旋桨
    setDrones(prev => prev.map(drone => {
      if (drone.id === selectedObjectId) {
        return {
          ...drone,
          propellersActive: true
        };
      }
      return drone;
    }));
    
    // 获取起始和目标位置
    const startPosition = selectedDrone.position;
    const targetPosition = targetStation.position;
    const flightHeight = 15; // 飞行高度15米
    
    // 定义速度常量（米/秒）
    const RISE_SPEED = 2;    // 上升速度：2米/秒
    const MOVE_SPEED = 3;   // 平移速度：3米/秒
    const DESCEND_SPEED = 2; // 下降速度：2米/秒
    
    // 计算各阶段的距离和时间
    const riseDistance = Math.abs(flightHeight - startPosition[1]);
    const riseTime = (riseDistance / RISE_SPEED) * 1000; // 转换为毫秒
    
    const horizontalDistance = Math.sqrt(
      Math.pow(targetPosition[0] - startPosition[0], 2) + 
      Math.pow(targetPosition[2] - startPosition[2], 2)
    );
    const moveTime = (horizontalDistance / MOVE_SPEED) * 1000; // 转换为毫秒
    
    const descendDistance = Math.abs(flightHeight - targetPosition[1]);
    const descendTime = (descendDistance / DESCEND_SPEED) * 1000; // 转换为毫秒
    
    // 更新属性面板显示起飞状态
    updatePanelHeight(startPosition[1], `起飞中 - 上升阶段 (0%) - 预计${(riseTime/1000).toFixed(1)}秒`);
    
    // 创建动画位置对象
    const animatedPosition = { 
      x: startPosition[0], 
      y: startPosition[1], 
      z: startPosition[2] 
    };
    
    // 重置时间戳
    animationRef.current.lastStateUpdate = 0;
    animationRef.current.lastPanelUpdate = 0;
    
    // 阶段1：上升到飞行高度
    const risePhase = new TWEEN.Tween(animatedPosition)
      .to({ y: flightHeight }, riseTime)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        const now = Date.now();
        
        // 限制状态更新频率
        if (now - animationRef.current.lastStateUpdate >= 16) {
          updateDronePosition(animationRef.current.selectedDroneId!, animatedPosition.y);
          animationRef.current.lastStateUpdate = now;
        }
        
        // 限制面板更新频率
        if (now - animationRef.current.lastPanelUpdate >= 100) {
          const risePercent = Math.round(((animatedPosition.y - startPosition[1]) / (flightHeight - startPosition[1])) * 100);
          const currentSpeed = RISE_SPEED;
          updatePanelHeight(animatedPosition.y, `起飞中 - 上升阶段 (${risePercent}%) - ${currentSpeed}米/秒`);
          animationRef.current.lastPanelUpdate = now;
        }
      })
      .onComplete(() => {
        // 上升完成，开始平移阶段
        updatePanelHeight(flightHeight, `起飞中 - 平移阶段 (0%) - 预计${(moveTime/1000).toFixed(1)}秒`);
      });
    
    // 阶段2：水平平移到目标位置上方
    const movePhase = new TWEEN.Tween(animatedPosition)
      .to({ x: targetPosition[0], z: targetPosition[2] }, moveTime)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        const now = Date.now();
        
        // 限制状态更新频率
        if (now - animationRef.current.lastStateUpdate >= 16) {
          setDrones(prev => prev.map(drone => {
            if (drone.id === animationRef.current.selectedDroneId) {
              const newPosition: [number, number, number] = [
                animatedPosition.x,
                animatedPosition.y,
                animatedPosition.z
              ];
              return {
                ...drone,
                position: newPosition
              };
            }
            return drone;
          }));
          animationRef.current.lastStateUpdate = now;
        }
        
        // 限制面板更新频率
        if (now - animationRef.current.lastPanelUpdate >= 100) {
          const currentDistance = Math.sqrt(
            Math.pow(animatedPosition.x - startPosition[0], 2) + 
            Math.pow(animatedPosition.z - startPosition[2], 2)
          );
          const movePercent = Math.round((currentDistance / horizontalDistance) * 100);
          const currentSpeed = MOVE_SPEED;
          updatePanelHeight(animatedPosition.y, `起飞中 - 平移阶段 (${Math.min(movePercent, 100)}%) - ${currentSpeed}米/秒`);
          animationRef.current.lastPanelUpdate = now;
        }
      })
      .onComplete(() => {
        // 平移完成，开始下降阶段
        updatePanelHeight(flightHeight, `起飞中 - 下降阶段 (0%) - 预计${(descendTime/1000).toFixed(1)}秒`);
      });
    
    // 阶段3：下降到目标站点
    const descendPhase = new TWEEN.Tween(animatedPosition)
      .to({ y: targetPosition[1] }, descendTime)
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(() => {
        const now = Date.now();
        
        // 限制状态更新频率
        if (now - animationRef.current.lastStateUpdate >= 16) {
          setDrones(prev => prev.map(drone => {
            if (drone.id === animationRef.current.selectedDroneId) {
              const newPosition: [number, number, number] = [
                animatedPosition.x,
                animatedPosition.y,
                animatedPosition.z
              ];
              return {
                ...drone,
                position: newPosition
              };
            }
            return drone;
          }));
          animationRef.current.lastStateUpdate = now;
        }
        
        // 限制面板更新频率
        if (now - animationRef.current.lastPanelUpdate >= 100) {
          const descendPercent = Math.round(((flightHeight - animatedPosition.y) / (flightHeight - targetPosition[1])) * 100);
          const currentSpeed = DESCEND_SPEED;
          updatePanelHeight(animatedPosition.y, `起飞中 - 下降阶段 (${descendPercent}%) - ${currentSpeed}米/秒`);
          animationRef.current.lastPanelUpdate = now;
        }
      })
      .onComplete(() => {
        // 下降完成，根据站点类型设置最终状态
        setDrones(prev => prev.map(drone => {
          if (drone.id === animationRef.current.selectedDroneId) {
            const finalPosition: [number, number, number] = [
              targetPosition[0],
              targetPosition[1],
              targetPosition[2]
            ];
            
            // 根据站点类型设置不同的状态
            if (targetStation.stationType === '起降站点') {
              // 起降站点：停止运动，关闭螺旋桨
              return {
                ...drone,
                position: finalPosition,
                propellersActive: false,
                hovering: false
              };
            } else if (targetStation.stationType === '悬停站点') {
              // 悬停站点：保持悬停和螺旋桨旋转
              return {
                ...drone,
                position: finalPosition,
                propellersActive: true,
                hovering: true
              };
            } else {
              // 默认行为：停止运动
              return {
                ...drone,
                position: finalPosition,
                propellersActive: false,
                hovering: false
              };
            }
          }
          return drone;
        }));
        
        // 计算总飞行时间
        const totalTime = (riseTime + moveTime + descendTime) / 1000;
        
        // 最终更新属性面板
    setTimeout(() => {
          if (targetStation.stationType === '起降站点') {
            updatePanelHeight(targetPosition[1], `已着陆 - 总飞行时间${totalTime.toFixed(1)}秒`);
            setPropertiesPanelData(prev => {
              const updatedItems = prev.items.map(item => {
                if (item.label === '悬停状态') {
                  return { ...item, value: '静止' };
                }
                if (item.label === '螺旋桨状态') {
                  return { ...item, value: '静止' };
                }
                if (item.label === '状态') {
                  return { ...item, value: `已到达${targetStation.modelName}` };
                }
                return item;
              });
              return { ...prev, items: updatedItems };
            });
          } else if (targetStation.stationType === '悬停站点') {
            updatePanelHeight(targetPosition[1], `悬停中 - 总飞行时间${totalTime.toFixed(1)}秒`);
            setPropertiesPanelData(prev => {
              const updatedItems = prev.items.map(item => {
                if (item.label === '悬停状态') {
                  return { ...item, value: '悬停中' };
                }
                if (item.label === '螺旋桨状态') {
                  return { ...item, value: '旋转中' };
                }
                if (item.label === '状态') {
                  return { ...item, value: `悬停于${targetStation.modelName}` };
                }
                return item;
              });
              return { ...prev, items: updatedItems };
            });
          }
          
          // 清除动画状态
          setIsAnimating(false);
          animationRef.current.isAnimating = false;
          animationRef.current.selectedDroneId = null;
        }, 200);
      });
    
    // 链式执行动画：上升 -> 平移 -> 下降
    risePhase.chain(movePhase);
    movePhase.chain(descendPhase);
    
    // 开始动画
    risePhase.start();
    
    // 启动动画循环
    const animate = () => {
      const hasActiveTweens = TWEEN.update();
      if (hasActiveTweens) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  // 添加handleRiseUp函数
  const handleRiseUp = () => {
    if (!selectedObjectId || selectedObjectType !== 'drone') return;
    
    // 设置动画状态
    setIsAnimating(true);
    animationRef.current.isAnimating = true;
    animationRef.current.selectedDroneId = selectedObjectId;
    
    // 启动无人机螺旋桨
    setDrones(prev => prev.map(drone => {
      if (drone.id === selectedObjectId) {
        return {
          ...drone,
          propellersActive: true
        };
      }
      return drone;
    }));
    
    // 获取当前无人机
    const selectedDrone = drones.find(d => d.id === selectedObjectId);
    if (!selectedDrone) return;
    
    // 获取无人机的当前位置
    const startHeight = selectedDrone.position[1];
    const targetHeight = 15;
    
    // 更新属性面板显示上升状态
    updatePanelHeight(startHeight, '上升中 (0%)');
    
    // 创建一个虚拟位置对象用于动画
    const animatedPosition = { y: startHeight };
    
    // 重置时间戳
    animationRef.current.lastStateUpdate = 0;
    animationRef.current.lastPanelUpdate = 0;
    
    // 创建补间动画
    const tween = new TWEEN.Tween(animatedPosition)
      .to({ y: targetHeight }, 10000) // 10秒上升到15米
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        const now = Date.now();
        
        // 优化：限制React状态更新频率到60fps
        if (now - animationRef.current.lastStateUpdate >= 16) {
          updateDronePosition(animationRef.current.selectedDroneId!, animatedPosition.y);
          animationRef.current.lastStateUpdate = now;
        }
        
        // 优化：限制属性面板更新频率到10fps
        if (now - animationRef.current.lastPanelUpdate >= 100) {
          const heightPercent = Math.round(((animatedPosition.y - startHeight) / (targetHeight - startHeight)) * 100);
          updatePanelHeight(animatedPosition.y, `上升中 (${heightPercent}%)`);
          animationRef.current.lastPanelUpdate = now;
        }
      })
      .onComplete(() => {
        // 确保无人机最终位置正确设置
        setDrones(prev => prev.map(drone => {
          if (drone.id === animationRef.current.selectedDroneId) {
            const finalPosition: [number, number, number] = [
              drone.position[0], 
              targetHeight, 
              drone.position[2]
            ];
            return {
              ...drone,
              hovering: true,
              position: finalPosition
            };
          }
          return drone;
        }));
        
        // 最终更新属性面板
        setTimeout(() => {
          updatePanelHeight(targetHeight, '悬停中');
          setPropertiesPanelData(prev => {
            const updatedItems = prev.items.map(item => {
              if (item.label === '悬停状态') {
                return { ...item, value: '悬停中' };
              }
              return item;
            });
            return { ...prev, items: updatedItems };
          });
          
          // 清除动画状态
          setIsAnimating(false);
          animationRef.current.isAnimating = false;
          animationRef.current.selectedDroneId = null;
        }, 200);
      })
      .start();
      
    // 优化：使用更高效的动画循环
    const animate = () => {
      const hasActiveTweens = TWEEN.update();
      if (hasActiveTweens) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  // 添加handleDescend函数
  const handleDescend = () => {
    if (!selectedObjectId || selectedObjectType !== 'drone') return;
    
    // 设置动画状态
    setIsAnimating(true);
    animationRef.current.isAnimating = true;
    animationRef.current.selectedDroneId = selectedObjectId;
    
    // 保持无人机螺旋桨运转
    setDrones(prev => prev.map(drone => {
      if (drone.id === selectedObjectId) {
        return {
          ...drone,
          propellersActive: true
        };
      }
      return drone;
    }));
    
    // 获取当前无人机
    const selectedDrone = drones.find(d => d.id === selectedObjectId);
    if (!selectedDrone) return;
    
    // 获取无人机的当前位置
    const startHeight = selectedDrone.position[1];
    const targetHeight = 0;
    
    // 更新属性面板显示下降状态
    updatePanelHeight(startHeight, '下降中 (0%)');
    
    // 创建一个虚拟位置对象用于动画
    const animatedPosition = { y: startHeight };
    
    // 重置时间戳
    animationRef.current.lastStateUpdate = 0;
    animationRef.current.lastPanelUpdate = 0;
    
    // 创建补间动画
    const tween = new TWEEN.Tween(animatedPosition)
      .to({ y: targetHeight }, 10000) // 10秒下降到0米
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        const now = Date.now();
        
        // 优化：限制React状态更新频率到60fps
        if (now - animationRef.current.lastStateUpdate >= 16) {
          updateDronePosition(animationRef.current.selectedDroneId!, animatedPosition.y);
          animationRef.current.lastStateUpdate = now;
        }
        
        // 优化：限制属性面板更新频率到10fps
        if (now - animationRef.current.lastPanelUpdate >= 100) {
          const heightPercent = Math.round(((startHeight - animatedPosition.y) / (startHeight - targetHeight)) * 100);
          updatePanelHeight(animatedPosition.y, `下降中 (${heightPercent}%)`);
          animationRef.current.lastPanelUpdate = now;
        }
      })
      .onComplete(() => {
        // 确保无人机最终位置正确设置
        setDrones(prev => prev.map(drone => {
          if (drone.id === animationRef.current.selectedDroneId) {
            const finalPosition: [number, number, number] = [
              drone.position[0], 
              targetHeight, 
              drone.position[2]
            ];
            return {
              ...drone,
              hovering: false,
              propellersActive: false,
              position: finalPosition
            };
          }
          return drone;
        }));
        
        // 最终更新属性面板
        setTimeout(() => {
          updatePanelHeight(targetHeight, '着陆');
          setPropertiesPanelData(prev => {
            const updatedItems = prev.items.map(item => {
              if (item.label === '悬停状态') {
                return { ...item, value: '静止' };
              }
              if (item.label === '螺旋桨状态') {
                return { ...item, value: '静止' };
              }
              return item;
            });
            return { ...prev, items: updatedItems };
          });
          
          // 清除动画状态
          setIsAnimating(false);
          animationRef.current.isAnimating = false;
          animationRef.current.selectedDroneId = null;
        }, 200);
      })
      .start();
      
    // 优化：使用更高效的动画循环
    const animate = () => {
      const hasActiveTweens = TWEEN.update();
      if (hasActiveTweens) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  // 处理货物删除
  const handleCargoDelete = useCallback((cargoId: string) => {
    // 找到关联的无人机并清除其货物ID
    setDrones(prev => prev.map(drone => {
      if (drone.cargoId === cargoId) {
        return { ...drone, cargoId: undefined };
      }
      return drone;
    }));
    
    // 删除货物
    setCargos(prev => prev.filter(cargo => cargo.id !== cargoId));
    
    // 如果当前选中的无人机有这个货物，立即更新属性面板
    if (selectedObjectId && selectedObjectType === 'drone') {
      const selectedDrone = drones.find(d => d.id === selectedObjectId);
      if (selectedDrone && selectedDrone.cargoId === cargoId) {
        // 立即更新属性面板显示载货状态为0/1
        setPropertiesPanelData(prevData => ({
          ...prevData,
          items: prevData.items.map(item => {
            if (item.label === '载货状态') {
              return { ...item, value: '0/1' };
            }
            return item;
          })
        }));
      }
    }
  }, [selectedObjectId, selectedObjectType, drones]);

  // 处理从属性面板删除货物
  const handleRemoveCargo = useCallback(() => {
    if (!selectedObjectId || selectedObjectType !== 'drone') return;
    
    const selectedDrone = drones.find(d => d.id === selectedObjectId);
    if (!selectedDrone || !selectedDrone.cargoId) return;
    
    // 检查无人机是否在绑定了接驳柜的站点
    const dronePosition = selectedDrone.position;
    
    // 查找无人机附近的站点（距离阈值为2米）
    const nearbyStation = stationPoints.find(station => {
      const distance = Math.sqrt(
        Math.pow(station.position[0] - dronePosition[0], 2) +
        Math.pow(station.position[2] - dronePosition[2], 2)
      );
      return distance <= 2; // 2米范围内
    });
    
    // 如果找到附近站点，检查是否有接驳柜绑定到这个站点
    const boundDockingStation = nearbyStation ? 
      dockingStations.find(dockingStation => dockingStation.boundStationId === nearbyStation.id) : null;
    
    if (boundDockingStation) {
      // 无人机在绑定了接驳柜的站点，执行自动存储流程
      const cargoToMove = cargos.find(cargo => cargo.id === selectedDrone.cargoId);
      if (cargoToMove) {
        // 检查货架占用状态，找到第一个空位
        const shelfOccupancy = boundDockingStation.shelfOccupancy || [false, false, false, false];
        const emptySlotIndex = shelfOccupancy.findIndex(occupied => !occupied);
        
        if (emptySlotIndex === -1) {
          // 货架已满，无法存储
          alert(`接驳柜 ${boundDockingStation.modelName} 货架已满，无法存储货物！`);
          return;
        }
        
        // 根据空位索引确定目标层级
        // 0,1 = 第1层（底层），2,3 = 第2层（上层）
        const targetLevel = emptySlotIndex < 2 ? 1 : 2;
        const isLeftSide = emptySlotIndex % 2 === 0; // 0,2为左侧，1,3为右侧
        
        // 计算目标层级的升降板位置值
        // 第1层：0.0，第2层：0.5（根据DockingStationModel中的计算）
        const targetLiftPosition = targetLevel === 1 ? 0.0 : 0.5;
        
        // 首先计算货物在升降板上的初始位置（在清除关联之前）
        const currentLiftPosition = boundDockingStation.liftPosition ?? 1;
        const liftHeight = 0.5 + (2.2 * currentLiftPosition); // 升降板实际高度
        const cargoInitialPosition: [number, number, number] = [
          boundDockingStation.position[0] + (6/2 - 0.5 - 2.0/2), // 孔洞X位置
          boundDockingStation.position[1] + 0.2 + liftHeight + 0.3, // 升降板上方0.3米
          boundDockingStation.position[2] // 孔洞Z位置
        ];
        
        // 先设置货物位置到升降板位置，然后再清除关联
        setCargos(prev => prev.map(cargo => {
          if (cargo.id === selectedDrone.cargoId) {
            return {
              ...cargo,
              position: cargoInitialPosition, // 设置到升降板位置
              droneId: '' // 清除与无人机的关联
            };
          }
          return cargo;
        }));
        
        // 保存当前正在处理的货物ID，用于后续精确识别
        const currentCargoId = selectedDrone.cargoId;
        
        // 然后清除无人机的货物关联
        setDrones(prev => prev.map(drone => {
          if (drone.id === selectedObjectId) {
            return { ...drone, cargoId: undefined };
          }
          return drone;
        }));
        
        // 立即更新属性面板显示卸货状态
        setPropertiesPanelData(prevData => ({
          ...prevData,
          items: prevData.items.map(item => {
            if (item.label === '载货状态') {
              return { ...item, value: '0/1' };
            }
            if (item.label === '状态') {
              return { ...item, value: '货物已卸载，准备返航' };
            }
            return item;
          })
        }));
        
        console.log('货物已卸载，无人机立即开始返航');
        
        // 立即开始无人机返回起点流程
        setTimeout(() => {
          console.log('开始无人机自动返回起点');
          
          // 获取当前无人机状态
          const currentDrone = drones.find(d => d.id === selectedObjectId);
          if (!currentDrone) return;
          
          // 获取无人机的原始位置（起点）
          const originalDrone = originalDrones.find(d => d.id === selectedObjectId);
          if (!originalDrone) {
            console.log('未找到无人机的原始位置');
            return;
          }
          
          const startPosition = currentDrone.position;
          const targetPosition = originalDrone.position; // 起点位置
          const flightHeight = 15; // 飞行高度15米
          
          // 定义速度常量（米/秒）
          const RISE_SPEED = 2;    // 上升速度：2米/秒
          const MOVE_SPEED = 3;   // 平移速度：3米/秒
          const DESCEND_SPEED = 2; // 下降速度：2米/秒
          
          // 计算各阶段的距离和时间
          const riseDistance = Math.abs(flightHeight - startPosition[1]);
          const riseTime = (riseDistance / RISE_SPEED) * 1000; // 转换为毫秒
          
          const horizontalDistance = Math.sqrt(
            Math.pow(targetPosition[0] - startPosition[0], 2) + 
            Math.pow(targetPosition[2] - startPosition[2], 2)
          );
          const moveTime = (horizontalDistance / MOVE_SPEED) * 1000; // 转换为毫秒
          
          const descendDistance = Math.abs(flightHeight - targetPosition[1]);
          const descendTime = (descendDistance / DESCEND_SPEED) * 1000;
          
          // 启动无人机螺旋桨
          setDrones(prev => prev.map(drone => {
            if (drone.id === selectedObjectId) {
              return {
                ...drone,
                propellersActive: true
              };
            }
            return drone;
          }));
          
          // 更新属性面板显示返回状态
          if (selectedObjectType === 'drone') {
            setPropertiesPanelData(prevData => ({
              ...prevData,
              items: prevData.items.map(item => {
                if (item.label === '状态') {
                  return { ...item, value: `返回起点中 - 上升阶段 (0%) - 预计${(riseTime/1000).toFixed(1)}秒` };
                }
                return item;
              })
            }));
          }
          
          // 创建动画位置对象
          const animatedPosition = { 
            x: startPosition[0], 
            y: startPosition[1], 
            z: startPosition[2] 
          };
          
          // 阶段1：上升到飞行高度
          const returnRisePhase = new TWEEN.Tween(animatedPosition)
            .to({ y: flightHeight }, riseTime)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
              setDrones(prev => prev.map(drone => {
                if (drone.id === selectedObjectId) {
                  return {
                    ...drone,
                    position: [animatedPosition.x, animatedPosition.y, animatedPosition.z]
                  };
                }
                return drone;
              }));
              
              // 更新属性面板进度
              if (selectedObjectType === 'drone') {
                const risePercent = Math.round(((animatedPosition.y - startPosition[1]) / (flightHeight - startPosition[1])) * 100);
                setPropertiesPanelData(prevData => ({
                  ...prevData,
                  items: prevData.items.map(item => {
                    if (item.label === '状态') {
                      return { ...item, value: `返回起点中 - 上升阶段 (${risePercent}%) - ${RISE_SPEED}米/秒` };
                    }
                    if (item.label === '高度') {
                      return { ...item, value: animatedPosition.y.toFixed(2) };
                    }
                    return item;
                  })
                }));
              }
            })
            .onComplete(() => {
              // 无人机到达最高位置，现在开始升降板下降和货物存储流程
              console.log('无人机到达最高位置，开始升降板下降存储货物');
              
              // 开始升降板下降和货物存储流程
              setTimeout(() => {
                // 再次检查boundDockingStation是否存在
                if (!boundDockingStation) {
                  console.log('接驳柜不存在，无法存储货物');
                  return;
                }
                
                const stationIndex = dockingStations.findIndex(s => s.id === boundDockingStation.id);
                if (stationIndex === -1) return;
                
                // 开始升降板移动动画
                const currentLiftPosition = boundDockingStation.liftPosition ?? 1;
                const step = currentLiftPosition > targetLiftPosition ? -0.02 : 0.02;
                
                let currentPos = currentLiftPosition;
                const liftAnimationInterval = setInterval(() => {
                  // 计算新位置
                  currentPos += step;
                  
                  // 检查是否到达或超过目标位置
                  const reachedTarget = step > 0 
                    ? currentPos >= targetLiftPosition 
                    : currentPos <= targetLiftPosition;
                  
                  // 如果到达目标，设置为精确目标值
                  if (reachedTarget) {
                    currentPos = targetLiftPosition;
                  }
                  
                  // 更新接驳柜升降板位置
                  setDockingStations(prev => {
                    const newStations = [...prev];
                    newStations[stationIndex] = {
                      ...newStations[stationIndex],
                      liftPosition: currentPos
                    };
                    return newStations;
                  });
                  
                  // 货物跟随升降板移动
                  const liftHeight = 0.5 + (2.2 * currentPos); // 升降板实际高度
                  const cargoFollowPosition: [number, number, number] = [
                    boundDockingStation.position[0] + (6/2 - 0.5 - 2.0/2), // 孔洞X位置
                    boundDockingStation.position[1] + 0.2 + liftHeight + 0.3, // 升降板上方0.3米
                    boundDockingStation.position[2] // 孔洞Z位置
                  ];
                  
                  setCargos(prev => prev.map(cargo => {
                    if (cargo.id === currentCargoId) { // 使用具体的货物ID精确识别
                      return {
                        ...cargo,
                        position: cargoFollowPosition
                      };
                    }
                    return cargo;
                  }));
                  
                  // 检查是否到达目标位置
                  if (reachedTarget) {
                    clearInterval(liftAnimationInterval);
                    
                    // 货物到达目标层级，瞬间移动到货架位置
                    setTimeout(() => {
                      // 计算货物在货架上的最终位置
                      const stationDimensions = { width: 6, height: 3, length: 4 };
                      const baseHeight = 0.2;
                      const shelfWidth = 3.0;
                      const shelfThickness = 0.05;
                      const compartmentHeight = 1;
                      const shelfX = -stationDimensions.width/5; // 货架在接驳柜内的X位置
                      const shelfZ = 0; // 货架在接驳柜内的Z位置
                      const shelfStartY = baseHeight + 0.5; // 货架起始Y位置
                      
                      const cargoShelfX = isLeftSide ? -shelfWidth/4 : shelfWidth/4; // 相对于货架中心的X偏移
                      const cargoShelfY = targetLevel === 1 ? 
                        shelfStartY + shelfThickness + 0.5 : 
                        shelfStartY + compartmentHeight + shelfThickness + 0.5;
                      const cargoShelfZ = shelfZ; // Z位置与货架中心相同
                      
                      // 转换为世界坐标（加上接驳柜的位置和货架的偏移）
                      const finalCargoPosition: [number, number, number] = [
                        boundDockingStation.position[0] + shelfX + cargoShelfX,
                        cargoShelfY,
                        boundDockingStation.position[2] + cargoShelfZ
                      ];
                      
                      // 货物瞬间移动到货架位置
                      setCargos(prev => prev.map(cargo => {
                        if (cargo.id === currentCargoId) {
                          return {
                            ...cargo,
                            position: finalCargoPosition
                          };
                        }
                        return cargo;
                      }));
                      
                      // 更新货架占用状态
                      setDockingStations(prev => {
                        const newStations = [...prev];
                        const updatedOccupancy = [...shelfOccupancy];
                        updatedOccupancy[emptySlotIndex] = true; // 标记该位置已占用
                        
                        newStations[stationIndex] = {
                          ...newStations[stationIndex],
                          shelfOccupancy: updatedOccupancy
                        };
                        return newStations;
                      });
                      
                      console.log(`货物已存储到接驳柜 ${boundDockingStation.modelName} 第${targetLevel}层${isLeftSide ? '左侧' : '右侧'}`);
                      
                      // 开始升降板恢复到顶部
                      setTimeout(() => {
                        console.log('开始升降板自动恢复到顶部');
                        
                        const recoverAnimationInterval = setInterval(() => {
                          setDockingStations(prev => {
                            const newStations = [...prev];
                            const currentStation = newStations[stationIndex];
                            if (!currentStation) {
                              clearInterval(recoverAnimationInterval);
                              return prev;
                            }
                            
                            const currentLiftPos = currentStation.liftPosition ?? 0;
                            const newLiftPos = Math.min(currentLiftPos + 0.02, 1); // 向上移动
                            
                            newStations[stationIndex] = {
                              ...currentStation,
                              liftPosition: newLiftPos
                            };
                            
                            // 检查是否到达顶部
                            if (newLiftPos >= 1) {
                              clearInterval(recoverAnimationInterval);
                              
                              // 确保最终位置是精确的1
                              newStations[stationIndex] = {
                                ...newStations[stationIndex],
                                liftPosition: 1
                              };
                              
                              console.log('升降板已恢复到顶部位置');
                            }
                            
                            return newStations;
                          });
                        }, 80); // 升降板恢复动画间隔
                      }, 500); // 货物存储后延迟0.5秒开始升降板恢复
                    }, 500); // 升降板到位后延迟0.5秒再移动货物到货架
                  }
                }, 80); // 升降板移动动画间隔
              }, 500); // 无人机到达最高位置后延迟0.5秒开始升降板下降
              
              // 上升完成，开始平移阶段
              if (selectedObjectType === 'drone') {
                setPropertiesPanelData(prevData => ({
                  ...prevData,
                  items: prevData.items.map(item => {
                    if (item.label === '状态') {
                      return { ...item, value: `返回起点中 - 平移阶段 (0%) - 预计${(moveTime/1000).toFixed(1)}秒` };
                    }
                    return item;
                  })
                }));
              }
            });
          
          // 阶段2：平移到目标上方
          const returnMovePhase = new TWEEN.Tween(animatedPosition)
            .to({ x: targetPosition[0], z: targetPosition[2] }, moveTime)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
              setDrones(prev => prev.map(drone => {
                if (drone.id === selectedObjectId) {
                  return {
                    ...drone,
                    position: [animatedPosition.x, animatedPosition.y, animatedPosition.z]
                  };
                }
                return drone;
              }));
              
              // 更新属性面板进度
              if (selectedObjectType === 'drone') {
                const totalDistance = Math.sqrt(
                  Math.pow(targetPosition[0] - startPosition[0], 2) + 
                  Math.pow(targetPosition[2] - startPosition[2], 2)
                );
                const currentDistance = Math.sqrt(
                  Math.pow(animatedPosition.x - startPosition[0], 2) + 
                  Math.pow(animatedPosition.z - startPosition[2], 2)
                );
                const movePercent = Math.round((currentDistance / totalDistance) * 100);
                
                setPropertiesPanelData(prevData => ({
                  ...prevData,
                  items: prevData.items.map(item => {
                    if (item.label === '状态') {
                      return { ...item, value: `返回起点中 - 平移阶段 (${movePercent}%) - ${MOVE_SPEED}米/秒` };
                    }
                    return item;
                  })
                }));
              }
            })
            .onComplete(() => {
              // 平移完成，开始下降阶段
              if (selectedObjectType === 'drone') {
                setPropertiesPanelData(prevData => ({
                  ...prevData,
                  items: prevData.items.map(item => {
                    if (item.label === '状态') {
                      return { ...item, value: `返回起点中 - 下降阶段 (0%) - 预计${(descendTime/1000).toFixed(1)}秒` };
                    }
                    return item;
                  })
                }));
              }
            });
          
          // 阶段3：下降到起点
          const returnDescendPhase = new TWEEN.Tween(animatedPosition)
            .to({ y: targetPosition[1] }, descendTime)
            .easing(TWEEN.Easing.Quadratic.In)
            .onUpdate(() => {
              setDrones(prev => prev.map(drone => {
                if (drone.id === selectedObjectId) {
                  return {
                    ...drone,
                    position: [animatedPosition.x, animatedPosition.y, animatedPosition.z]
                  };
                }
                return drone;
              }));
              
              // 更新属性面板进度
              if (selectedObjectType === 'drone') {
                const descendPercent = Math.round(((flightHeight - animatedPosition.y) / (flightHeight - targetPosition[1])) * 100);
                setPropertiesPanelData(prevData => ({
                  ...prevData,
                  items: prevData.items.map(item => {
                    if (item.label === '状态') {
                      return { ...item, value: `返回起点中 - 下降阶段 (${descendPercent}%) - ${DESCEND_SPEED}米/秒` };
                    }
                    if (item.label === '高度') {
                      return { ...item, value: animatedPosition.y.toFixed(2) };
                    }
                    return item;
                  })
                }));
              }
            })
            .onComplete(() => {
              // 返回完成，设置最终状态
              setDrones(prev => prev.map(drone => {
                if (drone.id === selectedObjectId) {
                  return {
                    ...drone,
                    position: targetPosition,
                    propellersActive: false,
                    hovering: false
                  };
                }
                return drone;
              }));
              
              // 最终更新属性面板
              if (selectedObjectType === 'drone') {
                setTimeout(() => {
                  setPropertiesPanelData(prevData => ({
                    ...prevData,
                    items: prevData.items.map(item => {
                      if (item.label === '状态') {
                        return { ...item, value: '已返回起点' };
                      }
                      if (item.label === '高度') {
                        return { ...item, value: targetPosition[1].toFixed(2) };
                      }
                      if (item.label === '螺旋桨状态') {
                        return { ...item, value: '静止' };
                      }
                      if (item.label === '悬停状态') {
                        return { ...item, value: '静止' };
                      }
                      return item;
                    })
                  }));
                  
                  console.log('无人机已成功返回起点');
                }, 200);
              }
            });
          
          // 链式执行动画
          returnRisePhase.chain(returnMovePhase);
          returnMovePhase.chain(returnDescendPhase);
          returnRisePhase.start();
          
          // 启动动画循环
          const animate = () => {
            const hasActiveTweens = TWEEN.update();
            if (hasActiveTweens) {
              requestAnimationFrame(animate);
            }
          };
          animate();
          
        }, 500); // 货物放到升降板后延迟0.5秒开始返航
      }
    } else {
      // 无人机不在绑定了接驳柜的站点，直接删除货物
      handleCargoDelete(selectedDrone.cargoId);
      
      // 立即更新属性面板显示载货状态为0/1
      setPropertiesPanelData(prevData => ({
        ...prevData,
        items: prevData.items.map(item => {
          if (item.label === '载货状态') {
            return { ...item, value: '0/1' };
          }
          if (item.label === '状态') {
            return { ...item, value: '货物已丢弃' };
          }
          return item;
        })
      }));
      
      console.log('货物已丢弃（无人机不在接驳柜站点）');
    }
  }, [selectedObjectId, selectedObjectType, drones, stationPoints, dockingStations, cargos, handleCargoDelete]);

  // 处理派件功能
  const handleDispatchCargo = useCallback(() => {
    if (!selectedObjectId || selectedObjectType !== 'drone') return;
    
    const selectedDrone = drones.find(d => d.id === selectedObjectId);
    if (!selectedDrone) return;
    
    // 检查无人机是否已经有货物
    if (selectedDrone.cargoId) {
      console.log('无人机已经有货物了');
      return;
    }
    
    // 创建新货物
    const cargoId = `cargo-${uuidv4().substring(0, 8)}`;
    const cargoPosition: [number, number, number] = [
      selectedDrone.position[0],
      selectedDrone.position[1] - 0.2, // 在无人机下方0.2米
      selectedDrone.position[2]
    ];
    
    const newCargo: CargoData = {
      id: cargoId,
      position: cargoPosition,
      droneId: selectedObjectId, // 设置关联的无人机ID
      selected: false
    };
    
    // 添加货物到列表
    setCargos(prev => [...prev, newCargo]);
    
    // 更新无人机的货物ID
    setDrones(prev => prev.map(drone => {
      if (drone.id === selectedObjectId) {
        return { ...drone, cargoId: cargoId };
      }
      return drone;
    }));
    
    // 立即更新属性面板显示载货状态为1/1，不等待状态更新
    setPropertiesPanelData(prevData => ({
      ...prevData,
      items: prevData.items.map(item => {
        if (item.label === '载货状态') {
          return { ...item, value: '1/1' };
        }
        return item;
      })
    }));
  }, [selectedObjectId, selectedObjectType, drones]);

  return (
    <SceneContainer>
      {/* 顶部工具栏 - 只在编辑态显示 */}
      {!isRunning && (
        <TopToolbar 
          onEditModeChange={handleEditModeChange}
          editMode={editMode}
        />
      )}
      
      {/* 资产搜索栏 - 在运行态和编辑态都显示 */}
      <SearchBar 
        drones={drones} 
        dockingStations={dockingStations} 
        stationPoints={stationPoints}
        onSelect={handleObjectSelect} 
      />
      
      {/* 提示按Shift键 - 只在编辑态显示 */}
      {!isRunning && (
        <ShiftKeyTip visible={showShiftTip}>
          按住Shift键暂时禁用变换控件
        </ShiftKeyTip>
      )}

      {/* 搜索快捷键提示 - 在运行态和编辑态都显示 */}
      <SearchHint>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>按 Ctrl+F 搜索资产</span>
      </SearchHint>
      
      {/* 运行按钮 */}
      <RunButton 
        isRunning={isRunning} 
        onToggleRunState={handleToggleRunState} 
      />

      <Canvas 
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [15, 15, 15], fov: 45 }}
      >
        <color attach="background" args={['#1a3b5c']} />
        <fog attach="fog" args={['#1a3b5c', 30, 100]} />
        <SceneContent 
          drones={drones}
          dockingStations={dockingStations}
          stationPoints={stationPoints}
          cargos={cargos}
          onObjectSelect={handleObjectSelect}
          placementMode={isRunning ? '' : placementMode} // 运行态下禁用放置模式
          onPlaceModel={handlePlaceModelInternal}
          onExitPlacement={handleExitPlacement}
          editMode={editMode}
          selectedObjectId={selectedObjectId}
          selectedObjectType={selectedObjectType}
          onObjectTransform={handleObjectTransform}
          isRunning={isRunning} // 传递运行态状态
        />
      </Canvas>

      {/* 属性面板 - 在运行态和编辑态都显示 */}
      <PropertiesPanel
        title={propertiesPanelData.title}
        items={propertiesPanelData.items}
        visible={showPanel}
        type={propertiesPanelData.type}
        onClose={handleClosePanel}
        onTogglePropellers={handleTogglePropellers}
        onToggleHovering={handleToggleHovering}
        onUpdateName={handleUpdateName}
        onEditingStateChange={setIsEditingName}
        isRunning={isRunning}
        onLiftUp={() => handleToggleLift('up')}
        onLiftDown={() => handleToggleLift('down')}
        onLiftToLevel={handleLiftToLevel}
        onStationTypeChange={handleStationTypeChange}
        onStationBindingChange={handleStationBindingChange}
        onTakeOff={handleTakeOff}
        onRiseUp={handleRiseUp}
        onDescend={handleDescend}
        onDispatchCargo={handleDispatchCargo}
        onRemoveCargo={handleRemoveCargo}
        hasCargo={selectedObjectId && selectedObjectType === 'drone' ? 
          Boolean(drones.find(d => d.id === selectedObjectId)?.cargoId) : false}
        stationPoints={stationPoints.map(point => ({
          id: point.id,
          modelName: point.modelName,
          stationType: point.stationType
        }))}
      />
    </SceneContainer>
  );
};

// 样式组件
const SceneContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #1a3b5c;
`;

// 添加Shift键提示样式
const ShiftKeyTip = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(15, 23, 42, 0.8);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 1000;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: fadeIn 0.3s ease;
  opacity: ${props => props.visible ? 1 : 0};
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  
  div {
    margin: 4px 0;
  }
`;

// 添加搜索提示帮助
const SearchHint = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  background: rgba(26, 59, 92, 0.8);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 0 10px;
  font-size: 12px;
  height: 36px;
  backdrop-filter: blur(5px);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  span {
    margin-left: 6px;
  }
`;

export default Scene; 