import React from 'react';
import styled from 'styled-components';
import { PlayIcon, StopIcon } from './Icons';

interface RunButtonProps {
  isRunning: boolean;
  onToggleRunState: () => void;
}

const ButtonWrapper = styled.div`
  position: absolute;
  top: 18px;
  right: 420px; /* 将按钮向左移动，避开用户头像 */
  z-index: 100;
  display: flex;
  align-items: center;
  height: 46px;
`;

const RunButtonStyled = styled.button<{ isRunning: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 110px;
  height: 100%;
  border-radius: 6px;
  background: ${props => props.isRunning ? 
    'rgba(231, 76, 60, 0.9)' : 
    'rgba(46, 204, 113, 0.9)'};
  border: none;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 14px;
  color: white;
  font-weight: 500;
  letter-spacing: 0.5px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.25);
    background: ${props => props.isRunning ? 
      'rgba(192, 57, 43, 0.9)' : 
      'rgba(39, 174, 96, 0.9)'};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const ButtonText = styled.span`
  margin-left: 8px;
  font-size: 14px;
`;

const StatusIndicator = styled.div<{ isRunning: boolean }>`
  margin-left: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0 16px;
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: ${props => props.isRunning ? 1 : 0};
  visibility: ${props => props.isRunning ? 'visible' : 'hidden'};
  transform: translateX(${props => props.isRunning ? '0' : '-20px'});
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
`;

const RunningDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e74c3c;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

const RunButton: React.FC<RunButtonProps> = ({ isRunning, onToggleRunState }) => {
  return (
    <ButtonWrapper>
      <RunButtonStyled isRunning={isRunning} onClick={onToggleRunState}>
        {isRunning ? <StopIcon color="white" size={20} /> : <PlayIcon color="white" size={20} />}
        <ButtonText>{isRunning ? '停止运行' : '开始运行'}</ButtonText>
      </RunButtonStyled>
      
      <StatusIndicator isRunning={isRunning}>
        <RunningDot />
        运行模式
      </StatusIndicator>
    </ButtonWrapper>
  );
};

export default RunButton; 