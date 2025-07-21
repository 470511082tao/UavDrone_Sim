import React from 'react';
import styled from 'styled-components';
import FloatingButton from './FloatingButton';
import { PlayIcon, PauseIcon, ResetIcon } from './Icons';

interface ToolbarProps {
  playing: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  totalDuration: number;
  onTimeChange: (time: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  playing,
  onTogglePlay,
  currentTime,
  totalDuration,
  onTimeChange
}) => {
  // 格式化时间显示
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };
  
  return (
    <Container>
      {/* 播放/暂停按钮 */}
      <FloatingButton
        onClick={onTogglePlay}
        icon={playing ? <PauseIcon /> : <PlayIcon />}
        tooltip={playing ? "暂停" : "播放"}
        position={{}}
        size="medium"
      />
      
      {/* 重置按钮 */}
      <FloatingButton
        onClick={() => onTimeChange(0)}
        icon={<ResetIcon />}
        tooltip="重置"
        position={{}}
        size="small"
      />
      
      {/* 时间显示 */}
      <TimeDisplay>
        <CurrentTime>{formatTime(currentTime)}</CurrentTime>
        <TotalTime>/ {formatTime(totalDuration)}</TotalTime>
      </TimeDisplay>
      
      {/* 时间滑块 */}
      <TimeSliderContainer>
        <TimeSlider
          type="range"
          min="0"
          max={totalDuration}
          step="0.1"
          value={currentTime}
          onChange={(e) => onTimeChange(parseFloat(e.target.value))}
        />
      </TimeSliderContainer>
    </Container>
  );
};

// 样式组件
const Container = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 30px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  backdrop-filter: blur(5px);
  z-index: 100;
`;

const TimeDisplay = styled.div`
  display: flex;
  align-items: baseline;
  font-family: monospace;
  margin: 0 16px;
`;

const CurrentTime = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
`;

const TotalTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textLight};
  margin-left: 4px;
`;

const TimeSliderContainer = styled.div`
  width: 180px;
`;

const TimeSlider = styled.input`
  width: 100%;
  appearance: none;
  height: 4px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 2px;
  outline: none;
  margin: 0;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    border: none;
  }
`;

export default Toolbar; 