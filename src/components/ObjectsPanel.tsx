import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Drone, DockingStation } from '@/types';

interface ObjectsPanelProps {
  drones: Drone[];
  dockingStations: DockingStation[];
  selectedObject: Drone | DockingStation | null;
  onSelectObject: (object: Drone | DockingStation | null) => void;
  onAddDrone: (drone: Drone) => void;
  onAddDockingStation: (dockingStation: DockingStation) => void;
  onDeleteObject: (objectId: string) => void;
}

const ObjectsPanel: React.FC<ObjectsPanelProps> = ({
  drones,
  dockingStations,
  selectedObject,
  onSelectObject,
  onAddDrone,
  onAddDockingStation,
  onDeleteObject
}) => {
  const [isAddDroneModalOpen, setIsAddDroneModalOpen] = useState(false);
  const [isAddDockingStationModalOpen, setIsAddDockingStationModalOpen] = useState(false);
  const [newDroneName, setNewDroneName] = useState('无人机');
  const [newDockingStationName, setNewDockingStationName] = useState('接驳柜');

  // 添加无人机
  const handleAddDrone = () => {
    const newDrone: Drone = {
      id: uuidv4(),
      model: newDroneName,
      position: [0, 2, 0], // 默认位置
      rotation: [0, 0, 0], // 默认旋转
      scale: [1, 1, 1] // 默认缩放
    };
    
    onAddDrone(newDrone);
    setNewDroneName('无人机');
    setIsAddDroneModalOpen(false);
  };

  // 添加接驳柜
  const handleAddDockingStation = () => {
    const newDockingStation: DockingStation = {
      id: uuidv4(),
      model: newDockingStationName,
      position: [5, 0, 0], // 默认位置
      rotation: [0, 0, 0], // 默认旋转
      scale: [1, 1, 1] // 默认缩放
    };
    
    onAddDockingStation(newDockingStation);
    setNewDockingStationName('接驳柜');
    setIsAddDockingStationModalOpen(false);
  };

  return (
    <Container>
      <PanelHeader>
        <PanelTitle>对象列表</PanelTitle>
      </PanelHeader>
      
      <ButtonsContainer>
        <AddButton onClick={() => setIsAddDroneModalOpen(true)}>添加无人机</AddButton>
        <AddButton onClick={() => setIsAddDockingStationModalOpen(true)}>添加接驳柜</AddButton>
      </ButtonsContainer>
      
      <SectionTitle>无人机</SectionTitle>
      <ObjectsList>
        {drones.length === 0 ? (
          <EmptyMessage>暂无无人机对象</EmptyMessage>
        ) : (
          drones.map(drone => (
            <ObjectItem 
              key={drone.id} 
              isSelected={selectedObject?.id === drone.id}
              onClick={() => onSelectObject(drone)}
            >
              <ObjectIcon>🛸</ObjectIcon>
              <ObjectName>{drone.model}</ObjectName>
              <DeleteButton onClick={(e) => {
                e.stopPropagation();
                onDeleteObject(drone.id);
              }}>
                ✕
              </DeleteButton>
            </ObjectItem>
          ))
        )}
      </ObjectsList>
      
      <SectionTitle>接驳柜</SectionTitle>
      <ObjectsList>
        {dockingStations.length === 0 ? (
          <EmptyMessage>暂无接驳柜对象</EmptyMessage>
        ) : (
          dockingStations.map(dockingStation => (
            <ObjectItem 
              key={dockingStation.id} 
              isSelected={selectedObject?.id === dockingStation.id}
              onClick={() => onSelectObject(dockingStation)}
            >
              <ObjectIcon>🏢</ObjectIcon>
              <ObjectName>{dockingStation.model}</ObjectName>
              <DeleteButton onClick={(e) => {
                e.stopPropagation();
                onDeleteObject(dockingStation.id);
              }}>
                ✕
              </DeleteButton>
            </ObjectItem>
          ))
        )}
      </ObjectsList>
      
      {/* 添加无人机模态框 */}
      {isAddDroneModalOpen && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>添加无人机</ModalTitle>
            <FormGroup>
              <Label>名称:</Label>
              <Input
                type="text"
                value={newDroneName}
                onChange={(e) => setNewDroneName(e.target.value)}
              />
            </FormGroup>
            <ModalFooter>
              <CancelButton onClick={() => setIsAddDroneModalOpen(false)}>取消</CancelButton>
              <SubmitButton onClick={handleAddDrone}>添加</SubmitButton>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
      
      {/* 添加接驳柜模态框 */}
      {isAddDockingStationModalOpen && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>添加接驳柜</ModalTitle>
            <FormGroup>
              <Label>名称:</Label>
              <Input
                type="text"
                value={newDockingStationName}
                onChange={(e) => setNewDockingStationName(e.target.value)}
              />
            </FormGroup>
            <ModalFooter>
              <CancelButton onClick={() => setIsAddDockingStationModalOpen(false)}>取消</CancelButton>
              <SubmitButton onClick={handleAddDockingStation}>添加</SubmitButton>
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
  border-bottom: 1px solid #ddd;
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

const ButtonsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AddButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  cursor: pointer;
  flex: 1;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

const ObjectsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ObjectItem = styled.li<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  background-color: ${({ isSelected, theme }) => isSelected ? theme.colors.primary + '20' : 'transparent'};
  border-left: 3px solid ${({ isSelected, theme }) => isSelected ? theme.colors.primary : 'transparent'};
  
  &:hover {
    background-color: ${({ isSelected, theme }) => isSelected ? theme.colors.primary + '20' : '#f5f5f5'};
  }
`;

const ObjectIcon = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

const ObjectName = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.error};
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  cursor: pointer;
  opacity: 0.5;
  
  &:hover {
    opacity: 1;
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

const Input = styled.input`
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
  border: none;
`;

const CancelButton = styled(Button)`
  background-color: #f1f2f6;
  color: ${({ theme }) => theme.colors.text};
  
  &:hover {
    background-color: #dfe4ea;
  }
`;

const SubmitButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  
  &:hover {
    background-color: #2980b9;
  }
`;

export default ObjectsPanel; 