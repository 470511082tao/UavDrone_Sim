import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as TWEEN from '@tweenjs/tween.js';

interface PropsPanelItem {
  label: string;
  value: string | number;
  options?: string[]; // 添加选项数组，用于下拉菜单
}

interface PropertiesPanelProps {
  title: string;
  items: PropsPanelItem[];
  visible: boolean;
  type: 'drone' | 'dockingStation' | null;
  onClose: () => void;
  onTogglePropellers?: () => void;
  onToggleHovering?: () => void;
  onUpdateName?: (newName: string) => void;
  onEditingStateChange?: (isEditing: boolean) => void;
  isRunning?: boolean;
  onLiftUp?: () => void;  // 升降板上升回调
  onLiftDown?: () => void; // 升降板下降回调
  onLiftToLevel?: (level: number) => void; // 升降板下降到指定层回调
  onStationTypeChange?: (newType: string) => void; // 站点类型变更回调
  onStationBindingChange?: (newStationName: string) => void; // 接驳柜站点绑定变更回调
  onTakeOff?: (targetStationId: string) => void; // 无人机起飞回调
  onRiseUp?: () => void; // 无人机上升回调
  onDescend?: () => void; // 无人机下降回调
  onDispatchCargo?: () => void; // 派件回调
  onRemoveCargo?: () => void; // 货物删除回调
  hasCargo?: boolean; // 是否有货物
  stationPoints?: Array<{id: string, modelName: string, stationType: string}>; // 站点数据
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  title,
  items,
  visible,
  type,
  onClose,
  onTogglePropellers,
  onToggleHovering,
  onUpdateName,
  onEditingStateChange,
  isRunning = false,
  onLiftUp,
  onLiftDown,
  onLiftToLevel,
  onStationTypeChange,
  onStationBindingChange,
  onTakeOff,
  onRiseUp,
  onDescend,
  onDispatchCargo,
  onRemoveCargo,
  hasCargo = false,
  stationPoints = []
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [showLevelInput, setShowLevelInput] = useState(false);
  const [selectedTargetStation, setSelectedTargetStation] = useState<string>('');
  const [isRising, setIsRising] = useState(false); // 是否正在上升状态
  const [targetHeight, setTargetHeight] = useState(15); // 上升目标高度

  // 当站点列表变化时，如果有站点，选择第一个作为默认目标
  useEffect(() => {
    if (stationPoints.length > 0 && !selectedTargetStation) {
      setSelectedTargetStation(stationPoints[0].id);
    }
  }, [stationPoints, selectedTargetStation]);

  // 当title变化时更新编辑中的名称
  useEffect(() => {
    if (title) {
      setEditingName(title);
    }
  }, [title]);

  // 日志输出
  useEffect(() => {
    if (visible) {
      console.log("Properties panel updated:", type, items?.length || 0);
    }
  }, [visible, type, items]);

  // 当编辑状态变化时通知父组件
  useEffect(() => {
    if (onEditingStateChange) {
      onEditingStateChange(isEditingName);
    }
  }, [isEditingName, onEditingStateChange]);

  // 获取无人机高度和状态信息
  const getDroneStatus = () => {
    if (!items || items.length === 0) return { isRising: false, currentHeight: 0 };
    
    const heightItem = items.find(item => item.label === '高度');
    const statusItem = items.find(item => item.label === '状态');
    
    const currentHeight = heightItem ? parseFloat(String(heightItem.value)) : 0;
    const statusValue = statusItem ? String(statusItem.value) : '';
    const isRising = statusValue.includes('上升中') || statusValue.includes('下降中') || statusValue.includes('运动中');
    
    return { isRising, currentHeight };
  };
  
  // 获取升降板状态信息
  const getLiftStatus = () => {
    if (!items || items.length === 0) return { isMoving: false, atTop: true, atBottom: false };
    
    const liftItem = items.find(item => item.label === '升降板状态');
    if (!liftItem) return { isMoving: false, atTop: true, atBottom: false };
    
    const value = String(liftItem.value);
    const isMoving = value.includes('运动中');
    const atTop = value === '顶部';
    const atBottom = value === '底部';
    
    return { isMoving, atTop, atBottom };
  };
  
  const droneStatus = getDroneStatus();
  const liftStatus = getLiftStatus();

  if (!visible) return null;

  const handleNameSave = () => {
    if (editingName?.trim() && onUpdateName) {
      onUpdateName(editingName);
    }
    setIsEditingName(false);
  };

  // 处理编辑状态开始
  const startEditing = () => {
    // 在运行状态下不允许编辑名称
    if (isRunning) return;
    
    setIsEditingName(true);
  };

  // 处理无人机上升操作
  const handleRiseUp = () => {
    if (onRiseUp && !droneStatus.isRising && droneStatus.currentHeight < 15) {
      setIsRising(true);
      onRiseUp();
    }
  };

  // 处理无人机下降操作
  const handleDescend = () => {
    if (onDescend && !droneStatus.isRising && droneStatus.currentHeight > 0) {
      setIsRising(true);
      onDescend();
    }
  };

  // 获取上升/下降按钮文本和状态
  const getRiseDescendButtonInfo = () => {
    if (droneStatus.isRising) {
      return { text: '运动中...', disabled: true };
    }
    
    if (droneStatus.currentHeight >= 15) {
      return { text: '下降', disabled: false };
    } else if (droneStatus.currentHeight <= 0) {
      return { text: '上升', disabled: false };
    } else {
      // 在中间高度时，可以选择上升或下降
      return { text: '上升', disabled: false };
    }
  };

  const renderContent = () => {
    if (!items || items.length === 0) {
      return (
        <PropertyItem>
          <PropertyLabel>提示</PropertyLabel>
          <PropertyValue>正在加载属性...</PropertyValue>
        </PropertyItem>
      );
    }

    return items.map((item, index) => {
      // 特殊处理升降板高度项
      if (item.label === '升降板高度') {
        // 查找升降板状态项
        const liftStatusItem = items.find(i => i.label === '升降板状态');
        if (liftStatusItem) {
          const statusValue = String(liftStatusItem.value);
          console.log('渲染升降板高度，状态为:', statusValue);
          
          // 根据状态计算高度
          let height;
          if (statusValue === '底部') {
            height = '0.00米';
            console.log('升降板在底部，设置高度为0');
          } else if (statusValue === '顶部') {
            height = '2.20米';
            console.log('升降板在顶部，设置高度为2.20米');
          } else if (statusValue.includes('运动中')) {
            // 从百分比提取值
            const percentMatch = statusValue.match(/\((\d+)%\)/);
            if (percentMatch && percentMatch[1]) {
              const percent = parseInt(percentMatch[1]) / 100;
              height = (percent * 2.2).toFixed(2) + '米';
              console.log(`升降板${statusValue}，计算高度为${height}`);
            } else {
              height = item.value; // 使用原始值
            }
          } else {
            height = item.value; // 使用原始值
          }
          
          return (
            <PropertyItem key={index}>
              <PropertyLabel>{item.label}</PropertyLabel>
              <PropertyValue>{height}</PropertyValue>
            </PropertyItem>
          );
        }
      }
      
      // 特殊处理站点类型项
      if (item.label === '站点类型' && item.options) {
        return (
          <PropertyItem key={index}>
            <PropertyLabel>{item.label}</PropertyLabel>
            <StationTypeSelect
              value={item.value as string}
              onChange={(e) => onStationTypeChange && onStationTypeChange(e.target.value)}
              disabled={isRunning}
            >
              {item.options.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </StationTypeSelect>
          </PropertyItem>
        );
      }
      
      // 特殊处理绑定站点项
      if (item.label === '绑定站点' && item.options) {
        return (
          <PropertyItem key={index}>
            <PropertyLabel>{item.label}</PropertyLabel>
            <StationTypeSelect
              value={item.value as string}
              onChange={(e) => onStationBindingChange && onStationBindingChange(e.target.value)}
              disabled={isRunning}
            >
              {item.options.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </StationTypeSelect>
          </PropertyItem>
        );
      }
      
      // 正常渲染其他项
      return (
        <PropertyItem key={index}>
          <PropertyLabel>{item.label}</PropertyLabel>
          <PropertyValue>{item.value}</PropertyValue>
        </PropertyItem>
      );
    });
  };

  const getActionButtonText = (type: string, status?: string) => {
    if (!items || !items.length) return '';
    
    if (type === 'propellers') {
      const propellersItem = items.find(item => item.label === '螺旋桨状态');
      return propellersItem?.value === '旋转中' ? '停止螺旋桨' : '启动螺旋桨';
    } else if (type === 'hovering') {
      const hoveringItem = items.find(item => item.label === '悬停状态');
      return hoveringItem?.value === '悬停中' ? '停止悬停' : '开始悬停';
    } else if (type === 'rising') {
      const heightItem = items.find(item => item.label === '高度');
      const currentHeight = heightItem ? parseFloat(String(heightItem.value)) : 0;
      return currentHeight >= 15 ? '已到最高点' : '上升';
    }
    
    return '';
  };

  // 处理输入框键盘事件
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      // 取消编辑，恢复原名称
      setIsEditingName(false);
      setEditingName(title || '');
    }
    
    // 阻止Backspace和Delete键事件冒泡，防止触发全局删除模型操作
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.stopPropagation();
    }
  };

  // 处理层数输入框键盘事件
  const handleLevelInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLiftToLevel();
    } else if (e.key === 'Escape') {
      // 取消输入
      setShowLevelInput(false);
    }
    
    // 阻止键盘事件冒泡
    e.stopPropagation();
  };

  // 处理下降到指定层
  const handleLiftToLevel = () => {
    if (onLiftToLevel && !liftStatus.isMoving && levelNumber >= 1 && levelNumber <= 2) {
      onLiftToLevel(levelNumber);
      setShowLevelInput(false);
    }
  };

  // 处理显示层数输入框
  const handleShowLevelInput = () => {
    if (!liftStatus.isMoving) {
      setShowLevelInput(true);
    }
  };

  // 处理起飞操作
  const handleTakeOff = () => {
    if (onTakeOff && selectedTargetStation) {
      onTakeOff(selectedTargetStation);
    }
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <PanelIcon type={type} />
        {isEditingName ? (
          <NameInput
            value={editingName || ''}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleInputKeyDown}
            autoFocus
          />
        ) : (
          <PanelTitle 
            onClick={startEditing}
            isRunning={isRunning}
          >
            {title || '未命名'}
          </PanelTitle>
        )}
        <CloseButton onClick={onClose}>×</CloseButton>
      </PanelHeader>
      <PanelContent>
        {renderContent()}
      </PanelContent>
      {type === 'drone' && isRunning && (
        <ActionButtons>
          <TakeoffContainer>
            <ActionButton onClick={handleTakeOff} disabled={!selectedTargetStation}>
              起飞
            </ActionButton>
            <StationSelect
              value={selectedTargetStation}
              onChange={(e) => setSelectedTargetStation(e.target.value)}
            >
              <option value="" disabled>选择目标站点</option>
              {stationPoints.map(station => (
                <option key={station.id} value={station.id}>
                  {station.modelName} ({station.stationType})
                </option>
              ))}
            </StationSelect>
          </TakeoffContainer>
          <ActionButton 
            onClick={() => {
              const buttonInfo = getRiseDescendButtonInfo();
              if (!buttonInfo.disabled) {
                if (buttonInfo.text === '上升') {
                  handleRiseUp();
                } else if (buttonInfo.text === '下降') {
                  handleDescend();
                }
              }
            }}
            disabled={getRiseDescendButtonInfo().disabled}
            style={{ width: '100%' }}
          >
            {getRiseDescendButtonInfo().text}
          </ActionButton>
          {hasCargo ? (
            <ActionButton 
              onClick={onRemoveCargo}
              style={{ width: '100%', backgroundColor: '#ef4444' }}
            >
              卸货
            </ActionButton>
          ) : (
            <ActionButton 
              onClick={onDispatchCargo}
              style={{ width: '100%' }}
            >
              派件
            </ActionButton>
          )}
        </ActionButtons>
      )}
      {type === 'dockingStation' && isRunning && (
        <ActionButtons>
          <ActionButton 
            onClick={liftStatus.isMoving || liftStatus.atTop ? undefined : onLiftUp} 
            disabled={liftStatus.isMoving || liftStatus.atTop} 
          >
            恢复
          </ActionButton>
          <ActionButton 
            onClick={liftStatus.isMoving || liftStatus.atBottom ? undefined : onLiftDown} 
            disabled={liftStatus.isMoving || liftStatus.atBottom}
          >
            下降
          </ActionButton>
          {showLevelInput ? (
            <LevelInputContainer>
              <LevelInput
                type="number"
                min="1"
                max="2"
                value={levelNumber}
                onChange={(e) => setLevelNumber(parseInt(e.target.value) || 1)}
                onKeyDown={handleLevelInputKeyDown}
                autoFocus
              />
              <LevelConfirmButton 
                onClick={handleLiftToLevel}
                disabled={liftStatus.isMoving}
              >
                确认
              </LevelConfirmButton>
            </LevelInputContainer>
          ) : (
            <ActionButton 
              onClick={liftStatus.isMoving ? undefined : handleShowLevelInput}
              disabled={liftStatus.isMoving}
            >
              移动到第N层
            </ActionButton>
          )}
        </ActionButtons>
      )}
    </PanelContainer>
  );
};

// 根据对象类型显示不同图标
const PanelIcon: React.FC<{ type: 'drone' | 'dockingStation' | null }> = ({ type }) => {
  const getDroneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <line x1="3" y1="9" x2="9" y2="15"></line>
      <line x1="21" y1="9" x2="15" y2="15"></line>
      <line x1="3" y1="15" x2="9" y2="9"></line>
      <line x1="21" y1="15" x2="15" y2="9"></line>
    </svg>
  );

  const getDockingStationIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="12" rx="2"></rect>
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="12" y1="12" x2="12" y2="16"></line>
    </svg>
  );

  return (
    <IconWrapper>
      {type === 'drone' && getDroneIcon()}
      {type === 'dockingStation' && getDockingStationIcon()}
    </IconWrapper>
  );
};

// 样式组件
const PanelContainer = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  width: 280px;
  background-color: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  color: white;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background-color: rgba(30, 41, 59, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PanelTitle = styled.h3<{ isRunning?: boolean }>`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  cursor: ${props => props.isRunning ? 'default' : 'pointer'};
  
  &:hover {
    text-decoration: ${props => props.isRunning ? 'none' : 'underline'};
  }
`;

const NameInput = styled.input`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  outline: none;
  
  &:focus {
    border-color: #60a5fa;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #60a5fa;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const PanelContent = styled.div`
  padding: 12px 16px;
  max-height: 60vh;
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

const PropertyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const PropertyLabel = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
`;

const PropertyValue = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: white;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(59, 130, 246, 0.3);
  }
  
  &:disabled,
  &[data-disabled="true"] {
    background-color: rgba(59, 130, 246, 0.1);
    color: #7fa9e0;
    border-color: rgba(59, 130, 246, 0.1);
    cursor: not-allowed;
  }
  
  &:disabled:hover,
  &[data-disabled="true"]:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }
`;

const LevelInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LevelInput = styled.input`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  outline: none;
  
  &:focus {
    border-color: #60a5fa;
  }
`;

const LevelConfirmButton = styled.button`
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 12px;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(59, 130, 246, 0.3);
  }
  
  &:disabled,
  &[data-disabled="true"] {
    background-color: rgba(59, 130, 246, 0.1);
    color: #7fa9e0;
    border-color: rgba(59, 130, 246, 0.1);
    cursor: not-allowed;
  }
`;

const StationTypeSelect = styled.select`
  background-color: rgba(30, 41, 59, 0.5);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  option {
    background-color: #1e293b;
  }
`;

const TakeoffContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 10px;
`;

const StationSelect = styled.select`
  flex: 1.5;
  background-color: rgba(30, 41, 59, 0.5);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  option {
    background-color: #1e293b;
  }
`;

export default PropertiesPanel;