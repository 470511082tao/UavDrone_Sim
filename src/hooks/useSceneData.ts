import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// 基础对象数据类型
interface BaseObjectData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  selected: boolean;
  color: string;
  modelName: string;
  modelNumber: string;
}

// 扩展对象类型
export interface DroneData extends BaseObjectData {
  hovering: boolean;
  propellersActive: boolean;
}

export interface DockingStationData extends BaseObjectData {}

export interface WaypointData extends BaseObjectData {}

export interface ShelfData extends BaseObjectData {}

export interface BuildingData extends BaseObjectData {}

// 场景数据类型
export interface SceneData {
  drones?: DroneData[];
  dockingStations?: DockingStationData[];
  waypoints?: WaypointData[];
  shelves?: ShelfData[];
  buildings?: BuildingData[];
}

export const useSceneData = (projectId: string, getCurrentProjectNumber: () => string) => {
  const [sceneData, setSceneData] = useState<SceneData>({});
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 从localStorage加载数据
  useEffect(() => {
    if (isInitialized || !projectId) return;
    
    const savedData = localStorage.getItem(`sceneData_${projectId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setSceneData(parsedData);
      } catch (error) {
        console.error('Error parsing scene data:', error);
        setSceneData({});
      }
    } else {
      setSceneData({});
    }
    
    setIsInitialized(true);
  }, [isInitialized, projectId]);

  // 保存数据到localStorage
  const saveSceneDataDirectly = useCallback((data: SceneData) => {
    if (projectId) {
      localStorage.setItem(`sceneData_${projectId}`, JSON.stringify(data));
    }
  }, [projectId]);

  // 防抖保存
  const saveSceneToStorage = useCallback(() => {
    const timeoutId = setTimeout(() => {
      saveSceneDataDirectly(sceneData);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [sceneData, saveSceneDataDirectly]);

  // 监听数据变化并自动保存
  useEffect(() => {
    return saveSceneToStorage();
  }, [sceneData, saveSceneToStorage]);

  // 添加对象
  const addObject = useCallback((type: string, position: [number, number, number]) => {
    const objectId = uuidv4().substring(0, 8);
    const projectNumber = getCurrentProjectNumber();
    
    const newObject = {
      id: objectId,
      position: [position[0], type === 'waypoint' ? 0 : 0, position[2]] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      selected: false,
      modelName: '',
      modelNumber: ''
    };

    setSceneData(prev => {
      const updatedData = { ...prev };
      
      switch (type) {
        case 'shelf':
          const shelfCount = (prev.shelves || []).length + 1;
          const shelf: ShelfData = {
            ...newObject,
            color: '#5BA3D4',
            modelName: `货架-${String(shelfCount).padStart(2, '0')}`,
            modelNumber: `SHELF${projectNumber}${String(shelfCount).padStart(5, '0')}`
          };
          updatedData.shelves = [...(prev.shelves || []), shelf];
          break;
          
        case 'building':
          const buildingCount = (prev.buildings || []).length + 1;
          const building: BuildingData = {
            ...newObject,
            color: '#E8E8E8',
            modelName: `建筑-${String(buildingCount).padStart(2, '0')}`,
            modelNumber: `BUILDING${projectNumber}${String(buildingCount).padStart(5, '0')}`
          };
          updatedData.buildings = [...(prev.buildings || []), building];
          break;
          
        case 'drone':
          const droneCount = (prev.drones || []).length + 1;
          const drone: DroneData = {
            ...newObject,
            color: '#5BA3D4',
            hovering: false,
            propellersActive: false,
            modelName: `无人机-${String(droneCount).padStart(2, '0')}`,
            modelNumber: `DRONE${projectNumber}${String(droneCount).padStart(5, '0')}`
          };
          updatedData.drones = [...(prev.drones || []), drone];
          break;
          
        case 'dockingStation':
          const stationCount = (prev.dockingStations || []).length + 1;
          const station: DockingStationData = {
            ...newObject,
            color: '#E8E8E8',
            modelName: `接驳站-${String(stationCount).padStart(2, '0')}`,
            modelNumber: `STATION${projectNumber}${String(stationCount).padStart(5, '0')}`
          };
          updatedData.dockingStations = [...(prev.dockingStations || []), station];
          break;
          
        case 'waypoint':
          const waypointCount = (prev.waypoints || []).length + 1;
          const waypoint: WaypointData = {
            ...newObject,
            color: '#FFB84D',
            modelName: `航点-${String(waypointCount).padStart(2, '0')}`,
            modelNumber: `WAYPOINT${projectNumber}${String(waypointCount).padStart(5, '0')}`
          };
          updatedData.waypoints = [...(prev.waypoints || []), waypoint];
          break;
          
        default:
          console.warn(`[useSceneData] 未知的对象类型: ${type}`);
          return prev;
      }
      
      // 立即保存
      setTimeout(() => {
        saveSceneDataDirectly(updatedData);
      }, 0);
      
      return updatedData;
    });
  }, [getCurrentProjectNumber, saveSceneDataDirectly]);

  // 删除对象
  const deleteObject = useCallback((id: string, type: string) => {
    setSceneData(prev => {
      const updatedData = { ...prev };
      
      switch (type) {
        case 'shelf':
          updatedData.shelves = (prev.shelves || []).filter(obj => obj.id !== id);
          break;
        case 'building':
          updatedData.buildings = (prev.buildings || []).filter(obj => obj.id !== id);
          break;
        case 'drone':
          updatedData.drones = (prev.drones || []).filter(obj => obj.id !== id);
          break;
        case 'dockingStation':
          updatedData.dockingStations = (prev.dockingStations || []).filter(obj => obj.id !== id);
          break;
        case 'waypoint':
          updatedData.waypoints = (prev.waypoints || []).filter(obj => obj.id !== id);
          break;
      }
      
      // 立即保存
      setTimeout(() => {
        saveSceneDataDirectly(updatedData);
      }, 0);
      
      return updatedData;
    });
    
    // 清除选中状态
    setSelectedObjectId(null);
    setSelectedObjectType(null);
  }, [saveSceneDataDirectly]);

  // 选择对象
  const selectObject = useCallback((id: string, type: string) => {
    setSceneData(prev => {
      const updatedData = { ...prev };
      
      // 清除所有对象的选中状态
      if (updatedData.shelves) {
        updatedData.shelves = updatedData.shelves.map(obj => ({ ...obj, selected: false }));
      }
      if (updatedData.buildings) {
        updatedData.buildings = updatedData.buildings.map(obj => ({ ...obj, selected: false }));
      }
      if (updatedData.drones) {
        updatedData.drones = updatedData.drones.map(obj => ({ ...obj, selected: false }));
      }
      if (updatedData.dockingStations) {
        updatedData.dockingStations = updatedData.dockingStations.map(obj => ({ ...obj, selected: false }));
      }
      if (updatedData.waypoints) {
        updatedData.waypoints = updatedData.waypoints.map(obj => ({ ...obj, selected: false }));
      }
      
      // 设置新选中的对象
      switch (type) {
        case 'shelf':
          if (updatedData.shelves) {
            updatedData.shelves = updatedData.shelves.map(obj => ({
              ...obj,
              selected: obj.id === id
            }));
          }
          break;
        case 'building':
          if (updatedData.buildings) {
            updatedData.buildings = updatedData.buildings.map(obj => ({
              ...obj,
              selected: obj.id === id
            }));
          }
          break;
        case 'drone':
          if (updatedData.drones) {
            updatedData.drones = updatedData.drones.map(obj => ({
              ...obj,
              selected: obj.id === id
            }));
          }
          break;
        case 'dockingStation':
          if (updatedData.dockingStations) {
            updatedData.dockingStations = updatedData.dockingStations.map(obj => ({
              ...obj,
              selected: obj.id === id
            }));
          }
          break;
        case 'waypoint':
          if (updatedData.waypoints) {
            updatedData.waypoints = updatedData.waypoints.map(obj => ({
              ...obj,
              selected: obj.id === id
            }));
          }
          break;
      }
      
      return updatedData;
    });
    
    setSelectedObjectId(id);
    setSelectedObjectType(type);
  }, []);

  // 更新对象变换
  const updateObjectTransform = useCallback((id: string, type: string, transform: Partial<{ position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>) => {
    setSceneData(prev => {
      const updatedData = { ...prev };
      
      const updateObjectInArray = (array: any[]) => 
        array.map(obj => obj.id === id ? { ...obj, ...transform } : obj);
      
      switch (type) {
        case 'shelf':
          if (updatedData.shelves) {
            updatedData.shelves = updateObjectInArray(updatedData.shelves);
          }
          break;
        case 'building':
          if (updatedData.buildings) {
            updatedData.buildings = updateObjectInArray(updatedData.buildings);
          }
          break;
        case 'drone':
          if (updatedData.drones) {
            updatedData.drones = updateObjectInArray(updatedData.drones);
          }
          break;
        case 'dockingStation':
          if (updatedData.dockingStations) {
            updatedData.dockingStations = updateObjectInArray(updatedData.dockingStations);
          }
          break;
        case 'waypoint':
          if (updatedData.waypoints) {
            updatedData.waypoints = updateObjectInArray(updatedData.waypoints);
          }
          break;
      }
      
      return updatedData;
    });
  }, []);

  return {
    sceneData,
    selectedObjectId,
    selectedObjectType,
    addObject,
    deleteObject,
    selectObject,
    updateObjectTransform
  };
}; 