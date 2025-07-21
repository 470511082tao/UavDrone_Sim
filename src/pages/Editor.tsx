import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Project, Drone, DockingStation } from '@/types';
import Scene, { PlacementMode } from '@/components/Scene';
import FloatingButton from '@/components/FloatingButton';
import UserAvatar from '@/components/UserAvatar';
import { BackIcon, DroneIcon, DockingStationIcon, StationPointIcon } from '@/components/Icons';

// 本地存储键
const STORAGE_KEY = 'uav_drone_sim_projects';

// 编辑器页面组件
const Editor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState('未命名项目');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [placementMode, setPlacementMode] = useState<PlacementMode>('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar?: string } | null>(null);

  // 加载项目数据
  useEffect(() => {
    if (!projectId || !currentUser) {
      return;
    }

    // 从本地存储获取项目列表
    const storedProjects = localStorage.getItem(STORAGE_KEY);
    if (storedProjects) {
      const projects: Project[] = JSON.parse(storedProjects);
      const currentProject = projects.find(p => p.id === projectId);
      
      if (currentProject) {
        // 检查项目是否属于当前用户
        if (currentProject.userId && currentProject.userId !== currentUser.id) {
          // 如果项目属于其他用户，重定向到项目列表
          navigate('/');
          return;
        }
        
        setProject(currentProject);
        setProjectName(currentProject.name);
        // 不再从localStorage加载场景数据，由Scene组件负责
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [projectId, navigate, currentUser]);

  // 加载当前用户
  useEffect(() => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // 当编辑状态改变时，自动聚焦输入框
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  // 自动保存场景数据 - 设置定时器每分钟更新项目时间戳
  useEffect(() => {
    if (!project) return;
    
    // 设置自动保存定时器
    const autoSaveInterval = setInterval(() => {
      updateProjectTimestamp();
    }, 60000); // 每分钟保存一次
    
    // 清理函数
    return () => {
      clearInterval(autoSaveInterval);
      // 在组件卸载时保存一次
      updateProjectTimestamp();
    };
  }, [project]);

  // 保存场景数据 - 只更新项目的updatedAt时间，不再保存场景数据
  const updateProjectTimestamp = () => {
    if (!project) return;
    
    // 更新项目的lastUpdated时间
    const storedProjects = localStorage.getItem(STORAGE_KEY);
    if (storedProjects) {
      const projects: Project[] = JSON.parse(storedProjects);
      const updatedProjects = projects.map(p => {
        if (p.id === projectId) {
          return { ...p, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    }
  };
  
  // 更新项目名称
  const updateProjectName = () => {
    if (!project || projectName.trim() === '') return;
    
    // 更新项目名称
    const storedProjects = localStorage.getItem(STORAGE_KEY);
    if (storedProjects) {
      const projects: Project[] = JSON.parse(storedProjects);
      const updatedProjects = projects.map(p => {
        if (p.id === projectId) {
          return { ...p, name: projectName, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      setProject({ ...project, name: projectName });
    }
    
    setIsEditingName(false);
  };

  // 返回项目列表
  const handleBack = () => {
    updateProjectTimestamp();
    navigate('/');
  };

  // 处理面板切换
  const togglePanel = (panelId: string) => {
    if (activePanel === panelId) {
      setActivePanel(null);
    } else {
      setActivePanel(panelId);
    }
  };
  
  // 处理项目名称变更
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  // 处理名称输入框的按键事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateProjectName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      if (project) {
        setProjectName(project.name);
      }
    }
  };

  // 处理名称输入框失去焦点事件
  const handleNameBlur = () => {
    updateProjectName();
  };

  // 切换放置模式
  const handleTogglePlacementMode = (mode: PlacementMode) => {
    // 如果当前模式与点击的模式相同，则退出放置模式
    if (placementMode === mode) {
      setPlacementMode('');
    } else {
      setPlacementMode(mode);
    }
  };
  
  // 处理模型放置
  const handlePlaceModel = (position: [number, number, number]) => {
    console.log(`模型放置在位置: [${position.join(', ')}]`);
    // 放置后保持放置模式，允许继续放置
  };

  // 处理退出放置模式
  const handleExitPlacement = () => {
    setPlacementMode('');
  };

  // 处理运行状态变化
  const handleRunningStateChange = (running: boolean) => {
    setIsRunning(running);
    // 如果进入运行态，清除放置模式
    if (running) {
      setPlacementMode('');
    }
  };

  if (!project) return <div>加载中...</div>;

  return (
    <EditorContainer>
      {/* 场景容器 */}
      <SceneContainer>
        <Scene 
          placementMode={placementMode}
          onPlaceModel={handlePlaceModel}
          onExitPlacement={handleExitPlacement}
          isRunningCallback={handleRunningStateChange}
        />
      </SceneContainer>

      {/* 项目名称和返回按钮 */}
      <TopLeftContainer>
        <FloatingButton
          onClick={handleBack}
          icon={<BackIcon />}
          tooltip="返回列表"
          position={{}}
          size="small"
        />
        <ProjectNameContainer onClick={() => !isEditingName && setIsEditingName(true)}>
          {isEditingName ? (
            <ProjectNameInput 
              ref={nameInputRef}
              type="text" 
              value={projectName} 
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              onBlur={handleNameBlur}
            />
          ) : (
            <ProjectNameDisplay>
              {projectName}
            </ProjectNameDisplay>
          )}
        </ProjectNameContainer>
      </TopLeftContainer>

      {/* 用户头像 */}
      <TopRightContainer>
        {currentUser && (
          <UserAvatar username={currentUser.username} avatar={currentUser.avatar} />
        )}
      </TopRightContainer>

      {/* 左侧添加按钮 - 仅在非运行态下显示 */}
      {!isRunning && (
        <LeftSideButtonsContainer>
          <SideButton 
            onClick={() => handleTogglePlacementMode('drone')} 
            data-tooltip="添加无人机"
            active={placementMode === 'drone'}
          >
            <IconWrapper>
              <DroneIcon size={24} />
            </IconWrapper>
          </SideButton>
          <SideButton 
            onClick={() => handleTogglePlacementMode('dockingStation')} 
            data-tooltip="添加接驳柜"
            active={placementMode === 'dockingStation'}
          >
            <IconWrapper>
              <DockingStationIcon size={24} />
            </IconWrapper>
          </SideButton>
          <SideButton 
            onClick={() => handleTogglePlacementMode('stationPoint')} 
            data-tooltip="添加站点"
            active={placementMode === 'stationPoint'}
          >
            <IconWrapper>
              <StationPointIcon size={24} />
            </IconWrapper>
          </SideButton>
        </LeftSideButtonsContainer>
      )}

      {/* 浮动面板 - 根据activePanel显示对应面板 */}
      {activePanel && (
        <FloatingPanel>
          <PanelHeader>
            <PanelTitle>
              {activePanel === 'objects' && '对象'}
              {activePanel === 'animation' && '动画'}
              {activePanel === 'timeline' && '时间线'}
              {activePanel === 'properties' && '属性'}
            </PanelTitle>
            <CloseButton onClick={() => setActivePanel(null)}>×</CloseButton>
          </PanelHeader>
          <PanelContent>
            {/* 根据activePanel显示不同内容 */}
            {activePanel === 'objects' && <div>对象面板内容</div>}
            {activePanel === 'animation' && <div>动画面板内容</div>}
            {activePanel === 'timeline' && <div>时间线面板内容</div>}
            {activePanel === 'properties' && <div>属性面板内容</div>}
          </PanelContent>
        </FloatingPanel>
      )}
    </EditorContainer>
  );
};

// 样式组件
const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

const SceneContainer = styled.div`
  flex: 1;
  position: relative;
  background-color: #2c3e50;
  width: 100%;
  height: 100%;
`;

const FloatingPanel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  max-height: 500px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
  z-index: 900;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid #eee;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const PanelContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  flex: 1;
`;

// 左上角容器，包含返回按钮和项目名称
const TopLeftContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  z-index: 100;
`;

const ProjectNameContainer = styled.div`
  margin-left: 30px;
  cursor: pointer;
`;

const ProjectNameDisplay = styled.h2`
  margin: 0;
  font-size: 18px;
  color: white;
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
`;

const ProjectNameInput = styled.input`
  font-size: 18px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 6px 12px;
  outline: none;
  min-width: 200px;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

// 左侧添加按钮样式
const LeftSideButtonsContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 100;
`;

interface SideButtonProps {
  active?: boolean;
}

const SideButton = styled.button<SideButtonProps>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.active ? '#2ecc71' : '#3498db'};
  color: white;
  border: none;
  cursor: pointer;
  position: relative;
  margin-bottom: 16px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    background-color: ${props => props.active ? '#27ae60' : '#2980b9'};
  }
  
  &::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 64px;
    top: 50%;
    transform: translateY(-50%);
    white-space: nowrap;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }
  
  &:hover::after {
    opacity: 1;
    visibility: visible;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
`;

const TopRightContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
`;

export default Editor; 