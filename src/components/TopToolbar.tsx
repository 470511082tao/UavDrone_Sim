import React from 'react';
import styled from 'styled-components';

export type EditMode = 'select' | 'move' | 'rotate' | 'scale';

interface TopToolbarProps {
  editMode: EditMode;
  onEditModeChange: (mode: EditMode) => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({ editMode, onEditModeChange }) => {
  return (
    <ToolbarContainer>
      <ToolbarButton 
        active={editMode === 'select'} 
        onClick={() => onEditModeChange('select')}
        title="选择"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5L10 17L13 10L19 13L5 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </ToolbarButton>
      
      <ToolbarButton 
        active={editMode === 'move'} 
        onClick={() => onEditModeChange('move')}
        title="移动"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 9L2 12L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 5L12 2L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 19L12 22L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 9L22 12L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolbarButton>
      
      <ToolbarButton 
        active={editMode === 'rotate'} 
        onClick={() => onEditModeChange('rotate')}
        title="旋转"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 2V6M16 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 3L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolbarButton>
      
      <ToolbarButton 
        active={editMode === 'scale'} 
        onClick={() => onEditModeChange('scale')}
        title="拉伸"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 3H15M21 3V9M21 3L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 21H9M3 21V15M3 21L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 21H15M21 21V15M21 21L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 3H9M3 3V9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolbarButton>
    </ToolbarContainer>
  );
};

const ToolbarContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 460px;
  display: flex;
  gap: 10px;
  background: rgba(26, 59, 92, 0.8);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  z-index: 100;
`;

interface ToolbarButtonProps {
  active: boolean;
}

const ToolbarButton = styled.button<ToolbarButtonProps>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: ${props => props.active ? '#3498db' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#3498db' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0px);
  }
`;

export default TopToolbar; 