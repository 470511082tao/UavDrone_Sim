import React, { useState, ReactNode } from 'react';
import styled from 'styled-components';
import FloatingButton from './FloatingButton';

interface MenuItem {
  id: string;
  icon: ReactNode;
  tooltip: string;
  color?: string;
  onClick: () => void;
}

interface FloatingMenuProps {
  items: MenuItem[];
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  direction?: 'vertical' | 'horizontal';
  mainButtonIcon: ReactNode;
  mainButtonTooltip?: string;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({
  items,
  position = { bottom: '20px', right: '20px' },
  direction = 'vertical',
  mainButtonIcon,
  mainButtonTooltip = '菜单'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <MenuContainer position={position}>
      <FloatingButton
        onClick={toggleMenu}
        icon={mainButtonIcon}
        tooltip={mainButtonTooltip}
        size="medium"
      />
      
      <ItemsContainer isOpen={isOpen} direction={direction}>
        {items.map((item, index) => (
          <MenuItem key={item.id} index={index} isOpen={isOpen} direction={direction}>
            <FloatingButton
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              icon={item.icon}
              tooltip={item.tooltip}
              color={item.color}
              size="small"
              position={{}}
            />
          </MenuItem>
        ))}
      </ItemsContainer>
    </MenuContainer>
  );
};

// 样式组件
const MenuContainer = styled.div<{ position: { top?: string; right?: string; bottom?: string; left?: string; } }>`
  position: absolute;
  z-index: 1000;
  ${props => props.position.top && `top: ${props.position.top};`}
  ${props => props.position.right && `right: ${props.position.right};`}
  ${props => props.position.bottom && `bottom: ${props.position.bottom};`}
  ${props => props.position.left && `left: ${props.position.left};`}
`;

const ItemsContainer = styled.div<{ isOpen: boolean; direction: 'vertical' | 'horizontal' }>`
  position: absolute;
  display: flex;
  flex-direction: ${props => props.direction === 'vertical' ? 'column' : 'row'};
  gap: 10px;
  bottom: ${props => props.direction === 'vertical' ? '60px' : '0px'};
  right: ${props => props.direction === 'horizontal' ? '60px' : '0px'};
  transition: all 0.3s ease-out;
  pointer-events: ${props => props.isOpen ? 'all' : 'none'};
  opacity: ${props => props.isOpen ? 1 : 0};
`;

const MenuItem = styled.div<{ index: number; isOpen: boolean; direction: 'vertical' | 'horizontal' }>`
  transition: all 0.2s ease-out;
  transition-delay: ${props => props.isOpen ? `${props.index * 0.05}s` : '0s'};
  transform: ${props => {
    if (!props.isOpen) {
      return 'scale(0.5)';
    }
    return 'scale(1)';
  }};
  opacity: ${props => props.isOpen ? 1 : 0};
`;

export default FloatingMenu; 