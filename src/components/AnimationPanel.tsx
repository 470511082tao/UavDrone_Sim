import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Animation, Drone, DockingStation } from '../types';

interface AnimationPanelProps {
  animations: Animation[];
  drones: Drone[];
  dockingStations: DockingStation[];
  onAddAnimation: (animation: Animation) => void;
  onDeleteAnimation: (animationId: string) => void;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({
  animations,
  drones,
  dockingStations,
  onAddAnimation,
  onDeleteAnimation
}) => {
  const [isAddAnimationModalOpen, setIsAddAnimationModalOpen] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  
  // 计算可选对象列表（无人机 + 接驳柜）
  const allObjects = [
    ...drones.map(drone => ({ id: drone.id, name: drone.model, type: '无人机' })),
    ...dockingStations.map(station => ({ id: station.id, name: station.model, type: '接驳柜' }))
  ];
  
  // 添加动画
  const handleAddAnimation = () => {
    if (!selectedObjectId) return;
    
    // 检查是否已存在该对象的动画
    const exists = animations.some(anim => anim.objectId === selectedObjectId);
    if (exists) {
      alert('该对象已有动画序列');
      return;
    }
    
    const newAnimation: Animation = {
      id: uuidv4(),
      objectId: selectedObjectId,
      keyFrames: []
    };
    
    onAddAnimation(newAnimation);
    setSelectedObjectId('');
    setIsAddAnimationModalOpen(false);
  };
  
  // 获取对象名称
  const getObjectName = (objectId: string): string => {
    const obj = allObjects.find(o => o.id === objectId);
    return obj ? `${obj.name} (${obj.type})` : '未知对象';
  };
  
  return (
    <Container>
      <PanelHeader>
        <PanelTitle>动画序列</PanelTitle>
        <AddButton onClick={() => setIsAddAnimationModalOpen(true)}>添加动画</AddButton>
      </PanelHeader>
      
      <AnimationsList>
        {animations.length === 0 ? (
          <EmptyMessage>暂无动画序列</EmptyMessage>
        ) : (
          animations.map(animation => (
            <AnimationItem key={animation.id}>
              <AnimationHeader>
                <AnimationName>{getObjectName(animation.objectId)}</AnimationName>
                <KeyFrameCount>
                  {animation.keyFrames.length} 个关键帧
                </KeyFrameCount>
                <DeleteButton onClick={() => onDeleteAnimation(animation.id)}>
                  删除
                </DeleteButton>
              </AnimationHeader>
            </AnimationItem>
          ))
        )}
      </AnimationsList>
      
      {/* 添加动画模态框 */}
      {isAddAnimationModalOpen && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>添加动画序列</ModalTitle>
            <FormGroup>
              <Label>选择对象:</Label>
              <Select
                value={selectedObjectId}
                onChange={(e) => setSelectedObjectId(e.target.value)}
              >
                <option value="">-- 请选择对象 --</option>
                {drones.map(drone => (
                  <option key={drone.id} value={drone.id}>{drone.model} (无人机)</option>
                ))}
                {dockingStations.map(station => (
                  <option key={station.id} value={station.id}>{station.model} (接驳柜)</option>
                ))}
              </Select>
            </FormGroup>
            <ModalFooter>
              <CancelButton onClick={() => setIsAddAnimationModalOpen(false)}>取消</CancelButton>
              <SubmitButton onClick={handleAddAnimation} disabled={!selectedObjectId}>
                添加
              </SubmitButton>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

// 样式组件
const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md};
  height: 50%;
  overflow-y: auto;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const PanelTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  margin: 0;
`;

const AddButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  cursor: pointer;
  
  &:hover {
    background-color: #27ae60;
  }
`;

const AnimationsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const AnimationItem = styled.li`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
`;

const AnimationHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
`;

const AnimationName = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
`;

const KeyFrameCount = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.error};
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EmptyMessage = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-style: italic;
  padding: ${({ theme }) => theme.spacing.sm};
`;

// 模态框样式
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  width: 100%;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  border: 1px solid #ddd;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Button = styled.button`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f1f2f6;
  color: ${({ theme }) => theme.colors.text};
  
  &:hover:not(:disabled) {
    background-color: #dfe4ea;
  }
`;

const SubmitButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #27ae60;
  }
`;

export default AnimationPanel; 