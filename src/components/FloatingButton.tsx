import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface FloatingButtonProps {
  onClick: () => void;
  icon: ReactNode;
  tooltip?: string;
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  onClick,
  icon,
  tooltip,
  position = { bottom: '20px', right: '20px' },
  color,
  size = 'medium'
}) => {
  return (
    <ButtonContainer position={position} data-tooltip={tooltip}>
      <Button onClick={onClick} color={color} size={size}>
        {icon}
      </Button>
    </ButtonContainer>
  );
};

// 样式组件
const ButtonContainer = styled.div<{ position: { top?: string; right?: string; bottom?: string; left?: string; } }>`
  position: absolute;
  z-index: 100;
  ${props => props.position.top && `top: ${props.position.top};`}
  ${props => props.position.right && `right: ${props.position.right};`}
  ${props => props.position.bottom && `bottom: ${props.position.bottom};`}
  ${props => props.position.left && `left: ${props.position.left};`}
  
  &[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 5px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
  }
`;

const Button = styled.button<{ color?: string; size: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color || props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: ${props => props.theme.shadows.md};
  cursor: pointer;
  transition: all 0.2s ease;
  
  width: ${props => {
    switch (props.size) {
      case 'small': return '36px';
      case 'large': return '56px';
      default: return '48px';
    }
  }};
  
  height: ${props => {
    switch (props.size) {
      case 'small': return '36px';
      case 'large': return '56px';
      default: return '48px';
    }
  }};
  
  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.theme.shadows.lg};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export default FloatingButton; 