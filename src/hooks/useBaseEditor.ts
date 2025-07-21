import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProjectType } from '../types';

interface UseBaseEditorProps {
  expectedProjectType: ProjectType;
  editorPath: string;
}

export const useBaseEditor = ({ expectedProjectType, editorPath }: UseBaseEditorProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // 状态管理
  const [project, setProject] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [placementMode, setPlacementMode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // 初始化数据
  useEffect(() => {
    const projectId = id || 'project1';
    const projectsData = JSON.parse(localStorage.getItem('projectsData') || '[]');
    const foundProject = projectsData.find((p: any) => p.id === projectId);
    
    if (foundProject && foundProject.type === expectedProjectType) {
      setProject(foundProject);
      setProjectName(foundProject.name);
    } else {
      // 如果项目不存在或类型不匹配，重定向到项目列表
      navigate('/');
      return;
    }

    // 模拟用户数据
    setCurrentUser({
      name: '用户',
      avatar: '/FClogo.png'
    });
  }, [id, expectedProjectType, navigate]);

  // 返回按钮处理
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // 项目名称编辑
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingName(false);
      // 保存到localStorage
      const projectsData = JSON.parse(localStorage.getItem('projectsData') || '[]');
      const updatedProjects = projectsData.map((p: any) => 
        p.id === project?.id ? { ...p, name: projectName } : p
      );
      localStorage.setItem('projectsData', JSON.stringify(updatedProjects));
      setProject({ ...project, name: projectName });
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setProjectName(project?.name || '');
    }
  }, [project, projectName]);

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
    if (project) {
      // 保存到localStorage
      const projectsData = JSON.parse(localStorage.getItem('projectsData') || '[]');
      const updatedProjects = projectsData.map((p: any) => 
        p.id === project.id ? { ...p, name: projectName } : p
      );
      localStorage.setItem('projectsData', JSON.stringify(updatedProjects));
      setProject({ ...project, name: projectName });
    }
  }, [project, projectName]);

  const handleStartEditName = useCallback(() => {
    setIsEditingName(true);
  }, []);

  // 添加模型按钮处理函数
  const handleAddModel = useCallback((type: string) => {
    setPlacementMode(type);
  }, []);

  // 放置模型
  const handlePlaceModel = useCallback((position: [number, number, number]) => {
    // 空函数，不做任何操作，让场景组件自己处理
    // 这样确保 placementMode 不会被意外修改
  }, []);

  // 退出放置模式
  const handleExitPlacement = useCallback(() => {
    setPlacementMode('');
  }, []);

  // 运行状态切换
  const handleRunningStateChange = useCallback((running: boolean) => {
    setIsRunning(running);
  }, []);

  // 获取当前项目ID
  const getCurrentProjectId = useCallback(() => {
    return project?.id || 'project1';
  }, [project]);

  // 获取当前项目编号
  const getCurrentProjectNumber = useCallback(() => {
    const projectId = getCurrentProjectId();
    const match = projectId.match(/\d+/);
    return match ? match[0].padStart(3, '0') : '001';
  }, [getCurrentProjectId]);

  return {
    // 状态
    project,
    currentUser,
    isEditingName,
    projectName,
    placementMode,
    isRunning,
    
    // 处理函数
    handleBack,
    handleNameChange,
    handleKeyDown,
    handleNameBlur,
    handleStartEditName,
    handleAddModel,
    handlePlaceModel,
    handleExitPlacement,
    handleRunningStateChange,
    
    // 工具函数
    getCurrentProjectId,
    getCurrentProjectNumber
  };
}; 