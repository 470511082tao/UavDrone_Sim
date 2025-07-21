import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import FloatingButton from '@/components/FloatingButton';
import UserAvatar from '@/components/UserAvatar';
import { AddIcon } from '@/components/Icons';

// 模拟本地存储的项目数据
const STORAGE_KEY = 'uav_drone_sim_projects';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar?: string } | null>(null);
  const navigate = useNavigate();

  // 加载当前用户
  useEffect(() => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // 加载项目列表
  useEffect(() => {
    if (!currentUser) return;

    const storedProjects = localStorage.getItem(STORAGE_KEY);
    let projectsData: Project[] = [];

    if (storedProjects) {
      projectsData = JSON.parse(storedProjects);
      
      // 严格过滤当前用户的项目，只显示userId等于当前用户id的项目
      const userProjects = projectsData.filter(p => p.userId === currentUser.id);
      setProjects(userProjects);
      
      // 检查是否有项目，如果没有则创建示例项目
      if (userProjects.length === 0) {
        createDemoProject();
      }
    } else {
      createDemoProject();
    }
  }, [currentUser, navigate]);

  // 创建示例项目
  const createDemoProject = () => {
    if (!currentUser) return;
    
    const demoProject: Project = {
      id: uuidv4(),
      name: '示例项目',
      description: '无人机接驳站演示项目',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnail: '/demo-thumbnail.jpg',
      userId: currentUser.id
    };
    
    // 获取所有现有项目
    const storedProjects = localStorage.getItem(STORAGE_KEY);
    const allProjects: Project[] = storedProjects ? JSON.parse(storedProjects) : [];
    
    // 添加新的示例项目
    const updatedProjects = [...allProjects, demoProject];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    
    setProjects([demoProject]);
  };

  // 保存项目列表到本地存储
  const saveProjects = (updatedProjects: Project[]) => {
    // 获取所有项目，包括其他用户的项目
    const allProjectsJson = localStorage.getItem(STORAGE_KEY);
    let allProjects: Project[] = allProjectsJson ? JSON.parse(allProjectsJson) : [];
    
    // 过滤掉当前用户的项目
    allProjects = allProjects.filter(p => p.userId && p.userId !== currentUser?.id);
    
    // 添加更新后的当前用户项目
    const finalProjects = [...allProjects, ...updatedProjects];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalProjects));
    setProjects(updatedProjects);
  };

  // 创建新项目
  const handleCreateProject = () => {
    if (!currentUser || !newProject.name.trim()) return;
    
    const project: Project = {
      id: uuidv4(),
      name: newProject.name,
      description: newProject.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: currentUser.id
    };
    
    const updatedProjects = [...projects, project];
    saveProjects(updatedProjects);
    setNewProject({ name: '', description: '' });
    setIsModalOpen(false);
  };

  // 删除项目
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除此项目吗？')) {
      const updatedProjects = projects.filter(project => project.id !== id);
      saveProjects(updatedProjects);
    }
  };

  // 打开编辑器
  const handleOpenEditor = (id: string) => {
    navigate(`/editor/${id}`);
  };

  return (
    <Container>
      <Header>
        <Title>低空经济仿真平台</Title>
        {currentUser && (
          <UserAvatarWrapper>
            <UserAvatar username={currentUser.username} avatar={currentUser.avatar} />
          </UserAvatarWrapper>
        )}
      </Header>

      <ProjectGrid>
        {projects.map(project => (
          <ProjectCard key={project.id} onClick={() => handleOpenEditor(project.id)}>
            <CardThumbnail>
              {project.thumbnail ? (
                <img src={project.thumbnail} alt={project.name} />
              ) : (
                <DefaultThumbnail />
              )}
            </CardThumbnail>
            <CardContent>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
              <CardFooter>
                <CardDate>更新于: {new Date(project.updatedAt).toLocaleDateString()}</CardDate>
                <DeleteButton onClick={(e) => handleDeleteProject(project.id, e)}>
                  删除
                </DeleteButton>
              </CardFooter>
            </CardContent>
          </ProjectCard>
        ))}
      </ProjectGrid>
      
      {/* 浮动添加按钮 */}
      <FloatingButtonWrapper>
        <FloatingButton
          onClick={() => setIsModalOpen(true)}
          icon={<AddIcon />}
          tooltip="创建新项目"
          size="large"
          color="#2ecc71"
        />
      </FloatingButtonWrapper>

      {isModalOpen && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>创建新项目</ModalTitle>
            <FormGroup>
              <Label>项目名称:</Label>
              <Input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="输入项目名称"
              />
            </FormGroup>
            <FormGroup>
              <Label>项目描述:</Label>
              <TextArea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="输入项目描述（可选）"
              />
            </FormGroup>
            <ModalFooter>
              <CancelButton onClick={() => setIsModalOpen(false)}>取消</CancelButton>
              <SubmitButton onClick={handleCreateProject}>创建</SubmitButton>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

// 样式组件
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  position: relative;
`;

const UserAvatarWrapper = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
`;

const FloatingButtonWrapper = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  position: relative;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSizes.xxl};
  color: ${({ theme }) => theme.colors.text};
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ProjectCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const CardThumbnail = styled.div`
  height: 160px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultThumbnail = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #3498db, #2ecc71);
`;

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
`;

const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.error};
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  
  &:hover {
    text-decoration: underline;
  }
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
  max-width: 500px;
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
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

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  border: 1px solid #ddd;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  min-height: 100px;
  resize: vertical;
  
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
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
`;

const CancelButton = styled(Button)`
  background-color: #f1f2f6;
  color: ${({ theme }) => theme.colors.text};
  border: none;
  
  &:hover {
    background-color: #dfe4ea;
  }
`;

const SubmitButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  
  &:hover {
    background-color: #2980b9;
  }
`;

export default ProjectList; 