import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Animation, KeyFrame, Drone, DockingStation } from '../types';

interface TimelinePanelProps {
  animations: Animation[];
  currentTime: number;
  totalDuration: number;
  selectedObject: Drone | DockingStation | null;
  onAddKeyFrame: (animationId: string, keyFrame: KeyFrame) => void;
  onDeleteKeyFrame: (animationId: string, keyFrameTime: number) => void;
  onTimeChange: (time: number) => void;
}

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  animations,
  currentTime,
  totalDuration,
  selectedObject,
  onAddKeyFrame,
  onDeleteKeyFrame,
  onTimeChange
}) => {
  const [isAddKeyFrameModalOpen, setIsAddKeyFrameModalOpen] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
  const [keyFrameTime, setKeyFrameTime] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // 当选择对象变化时，尝试找到对应的动画
  useEffect(() => {
    if (selectedObject) {
      const animation = animations.find(anim => anim.objectId === selectedObject.id);
      setSelectedAnimation(animation || null);
    } else {
      setSelectedAnimation(null);
    }
  }, [selectedObject, animations]);
  
  // 根据当前时间更新时间线滑块位置
  useEffect(() => {
    if (timelineRef.current) {
      const percentage = (currentTime / totalDuration) * 100;
      timelineRef.current.style.setProperty('--current-time-percent', `${percentage}%`);
    }
  }, [currentTime, totalDuration]);
  
  // 处理时间线点击，设置当前时间
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = Math.max(0, Math.min(totalDuration, percentage * totalDuration));
      onTimeChange(parseFloat(newTime.toFixed(1)));
    }
  };
  
  // 添加关键帧
  const handleAddKeyFrame = () => {
    if (!selectedAnimation) return;
    
    // 检查是否已存在相同时间的关键帧
    const exists = selectedAnimation.keyFrames.some(kf => kf.time === keyFrameTime);
    if (exists) {
      alert(`时间点 ${keyFrameTime} 已存在关键帧`);
      return;
    }
    
    // 从选中的对象获取当前位置、旋转和缩放
    const keyFrame: KeyFrame = {
      time: keyFrameTime,
      position: selectedObject?.position,
      rotation: selectedObject?.rotation,
      scale: selectedObject?.scale
    };
    
    onAddKeyFrame(selectedAnimation.id, keyFrame);
    setIsAddKeyFrameModalOpen(false);
  };
  
  // 删除关键帧
  const handleDeleteKeyFrame = (animationId: string, time: number) => {
    if (window.confirm('确定要删除此关键帧吗？')) {
      onDeleteKeyFrame(animationId, time);
    }
  };
  
  // 在时间线上定位到某个关键帧
  const handleSeekToKeyFrame = (time: number) => {
    onTimeChange(time);
  };
  
  // 获取当前选中动画的关键帧
  const keyFrames = selectedAnimation?.keyFrames || [];
  
  // 把关键帧按时间排序
  const sortedKeyFrames = [...keyFrames].sort((a, b) => a.time - b.time);
  
  return (
    <Container>
      <PanelHeader>
        <PanelTitle>时间线</PanelTitle>
        <AddButton 
          onClick={() => {
            if (selectedAnimation) {
              setKeyFrameTime(parseFloat(currentTime.toFixed(1)));
              setIsAddKeyFrameModalOpen(true);
            } else {
              alert('请先选择一个对象并创建动画序列');
            }
          }}
          disabled={!selectedAnimation}
        >
          添加关键帧
        </AddButton>
      </PanelHeader>
      
      {/* 时间线 */}
      <TimelineContainer ref={timelineRef} onClick={handleTimelineClick}>
        <TimelineRuler>
          {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
            <TimelineMarker key={i} style={{ left: `${(i / totalDuration) * 100}%` }}>
              <TimelineMarkerLabel>{i}s</TimelineMarkerLabel>
            </TimelineMarker>
          ))}
        </TimelineRuler>
        
        <TimelineTrack>
          <CurrentTimeLine />
          
          {/* 显示关键帧 */}
          {selectedAnimation && sortedKeyFrames.map((keyFrame) => (
            <KeyFrameMarker 
              key={`${selectedAnimation.id}-${keyFrame.time}`}
              style={{ left: `${(keyFrame.time / totalDuration) * 100}%` }}
              onClick={(e) => {
                e.stopPropagation();
                handleSeekToKeyFrame(keyFrame.time);
              }}
              title={`时间: ${keyFrame.time}s`}
            >
              <KeyFrameTooltip>
                <TooltipTime>时间: {keyFrame.time}s</TooltipTime>
                {keyFrame.position && (
                  <TooltipProperty>
                    位置: ({keyFrame.position[0]}, {keyFrame.position[1]}, {keyFrame.position[2]})
                  </TooltipProperty>
                )}
                <DeleteKeyFrameButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteKeyFrame(selectedAnimation.id, keyFrame.time);
                  }}
                >
                  删除
                </DeleteKeyFrameButton>
              </KeyFrameTooltip>
            </KeyFrameMarker>
          ))}
        </TimelineTrack>
      </TimelineContainer>
      
      {/* 关键帧列表 */}
      <KeyFrameListTitle>关键帧列表</KeyFrameListTitle>
      <KeyFrameList>
        {selectedAnimation ? (
          sortedKeyFrames.length > 0 ? (
            sortedKeyFrames.map((keyFrame) => (
              <KeyFrameItem 
                key={`list-${selectedAnimation.id}-${keyFrame.time}`}
                isCurrent={Math.abs(keyFrame.time - currentTime) < 0.1}
                onClick={() => handleSeekToKeyFrame(keyFrame.time)}
              >
                <KeyFrameItemTime>时间: {keyFrame.time}s</KeyFrameItemTime>
                <KeyFrameItemActions>
                  <KeyFrameItemButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteKeyFrame(selectedAnimation.id, keyFrame.time);
                    }}
                  >
                    删除
                  </KeyFrameItemButton>
                </KeyFrameItemActions>
              </KeyFrameItem>
            ))
          ) : (
            <EmptyMessage>该动画没有关键帧</EmptyMessage>
          )
        ) : (
          <EmptyMessage>请选择一个对象查看关键帧</EmptyMessage>
        )}
      </KeyFrameList>
      
      {/* 添加关键帧模态框 */}
      {isAddKeyFrameModalOpen && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>添加关键帧</ModalTitle>
            <FormGroup>
              <Label>时间(秒):</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max={totalDuration}
                value={keyFrameTime}
                onChange={(e) => setKeyFrameTime(parseFloat(e.target.value))}
              />
            </FormGroup>
            <ModalMessage>
              将使用对象当前的位置、旋转和缩放值创建关键帧
            </ModalMessage>
            <ModalFooter>
              <CancelButton onClick={() => setIsAddKeyFrameModalOpen(false)}>取消</CancelButton>
              <SubmitButton onClick={handleAddKeyFrame}>添加</SubmitButton>
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
  height: 180px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid #ddd;
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

const AddButton = styled.button<{ disabled?: boolean }>`
  background-color: ${({ theme, disabled }) => disabled ? '#cccccc' : theme.colors.secondary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};
  
  &:hover:not(:disabled) {
    background-color: #27ae60;
  }
`;

const TimelineContainer = styled.div`
  flex: 0 0 60px;
  position: relative;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  --current-time-percent: 0%;
`;

const TimelineRuler = styled.div`
  height: 20px;
  position: relative;
  border-bottom: 1px solid #ddd;
`;

const TimelineMarker = styled.div`
  position: absolute;
  height: 100%;
  width: 1px;
  background-color: #ddd;
  
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    height: 8px;
    width: 1px;
    background-color: #ddd;
    left: 0;
  }
`;

const TimelineMarkerLabel = styled.span`
  position: absolute;
  top: 0;
  left: 4px;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const TimelineTrack = styled.div`
  height: 40px;
  position: relative;
  display: flex;
  align-items: center;
`;

const CurrentTimeLine = styled.div`
  position: absolute;
  height: 100%;
  width: 2px;
  background-color: ${({ theme }) => theme.colors.primary};
  left: var(--current-time-percent);
  z-index: 2;
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -4px;
    width: 10px;
    height: 10px;
    background-color: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
  }
`;

const KeyFrameMarker = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: ${({ theme }) => theme.colors.secondary};
  border-radius: 50%;
  transform: translate(-50%, 0);
  z-index: 1;
  cursor: pointer;
  
  &:hover {
    background-color: #27ae60;
    z-index: 3;
  }
  
  &:hover > div {
    display: block;
  }
`;

const KeyFrameTooltip = styled.div`
  display: none;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid #ddd;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  width: 180px;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid ${({ theme }) => theme.colors.surface};
  }
`;

const TooltipTime = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TooltipProperty = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const DeleteKeyFrameButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: 2px 6px;
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const KeyFrameListTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

const KeyFrameList = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.xs};
`;

const KeyFrameItem = styled.div<{ isCurrent: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: ${({ isCurrent, theme }) => isCurrent ? theme.colors.primary + '20' : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  
  &:hover {
    background-color: ${({ isCurrent, theme }) => isCurrent ? theme.colors.primary + '20' : '#f5f5f5'};
  }
`;

const KeyFrameItemTime = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

const KeyFrameItemActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const KeyFrameItemButton = styled.button`
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
  text-align: center;
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

const ModalMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
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
  background-color: ${({ theme }) => theme.colors.secondary};
  color: white;
  
  &:hover {
    background-color: #27ae60;
  }
`;

export default TimelinePanel; 