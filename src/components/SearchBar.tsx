import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

// 从Scene组件直接定义所需接口，而不是从@/types引入
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
}

interface DockingStationData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
  modelName: string;
  modelNumber: string;
}

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

interface Asset {
  id: string;
  name: string;
  type: 'drone' | 'dockingStation' | 'stationPoint';
  assetId?: string; // 资产ID
}

interface SearchBarProps {
  drones: DroneData[];
  dockingStations: DockingStationData[];
  stationPoints: StationPointData[];
  onSelect: (id: string, type: 'drone' | 'dockingStation' | 'stationPoint') => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ drones, dockingStations, stationPoints, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 将无人机、接驳柜和站点数据转换为统一的资产列表
  useEffect(() => {
    const assetList: Asset[] = [
      ...drones.map(drone => ({
        id: drone.id,
        name: drone.modelName,
        type: 'drone' as const,
        assetId: drone.modelNumber
      })),
      ...dockingStations.map(station => ({
        id: station.id,
        name: station.modelName,
        type: 'dockingStation' as const,
        assetId: station.modelNumber
      })),
      ...stationPoints.map(point => ({
        id: point.id,
        name: point.modelName,
        type: 'stationPoint' as const,
        assetId: point.modelNumber
      }))
    ];
    
    setAssets(assetList);
    setFilteredAssets(assetList);
  }, [drones, dockingStations, stationPoints]);
  
  // 根据搜索词筛选资产
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAssets(assets);
      return;
    }
    
    const lowercaseTerm = searchTerm.toLowerCase();
    const filtered = assets.filter(
      asset => 
        asset.name.toLowerCase().includes(lowercaseTerm) || 
        (asset.assetId && asset.assetId.toLowerCase().includes(lowercaseTerm))
    );
    
    setFilteredAssets(filtered);
  }, [searchTerm, assets]);
  
  // 处理点击外部关闭下拉列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + F 打开搜索框
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      
      // Esc 关闭搜索框
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  // 处理资产选择
  const handleAssetSelect = (asset: Asset) => {
    onSelect(asset.id, asset.type);
    setIsOpen(false);
  };
  
  // 处理输入框点击
  const handleInputClick = () => {
    setIsOpen(true);
  };
  
  // 处理输入框聚焦
  const handleInputFocus = () => {
    setIsOpen(true);
  };
  
  return (
    <SearchBarContainer ref={containerRef}>
      <SearchInputContainer>
        <SearchIcon>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </SearchIcon>
        <SearchInput
          ref={inputRef}
          placeholder="搜索资产..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
        />
        {searchTerm && (
          <ClearButton onClick={() => setSearchTerm('')}>×</ClearButton>
        )}
      </SearchInputContainer>
      
      {isOpen && (
        <FixedDropdownContainer>
          <AssetList>
            {filteredAssets.length > 0 ? (
              filteredAssets.map(asset => (
                <AssetItem key={asset.id} onClick={() => handleAssetSelect(asset)}>
                  <AssetIcon type={asset.type} />
                  <AssetInfo>
                    <AssetName>{asset.name}</AssetName>
                    <AssetId>{asset.assetId}</AssetId>
                  </AssetInfo>
                </AssetItem>
              ))
            ) : (
              <EmptyMessage>没有找到匹配的资产</EmptyMessage>
            )}
          </AssetList>
        </FixedDropdownContainer>
      )}
    </SearchBarContainer>
  );
};

// 资产图标组件
const AssetIcon = ({ type }: { type: 'drone' | 'dockingStation' | 'stationPoint' }) => {
  return (
    <AssetIconWrapper>
      {type === 'drone' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <line x1="3" y1="9" x2="9" y2="15"></line>
          <line x1="21" y1="9" x2="15" y2="15"></line>
          <line x1="3" y1="15" x2="9" y2="9"></line>
          <line x1="21" y1="15" x2="15" y2="9"></line>
        </svg>
      ) : type === 'dockingStation' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="8" width="16" height="12" rx="2"></rect>
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="12" y1="12" x2="12" y2="16"></line>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
      )}
    </AssetIconWrapper>
  );
};

const SearchBarContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  background: rgba(26, 59, 92, 0.8);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  z-index: 100;
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  color: rgba(255, 255, 255, 0.7);
  z-index: 1;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  
  &:hover {
    color: rgba(255, 255, 255, 1);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 30px 0 30px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  outline: none;
  
  &:focus {
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FixedDropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 8px;
  max-height: 300px;
  border-radius: 8px;
  background-color: rgba(26, 59, 92, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  opacity: 1;
  z-index: 101;
`;

const AssetList = styled.div`
  max-height: 240px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const AssetItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.2);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const AssetIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 12px;
  color: #60a5fa;
`;

const AssetInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const AssetName = styled.div`
  font-size: 14px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AssetId = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
`;

const EmptyMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
`;

export default SearchBar; 