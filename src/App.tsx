import { Routes, Route } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import Editor from './pages/Editor';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle, theme } from './styles/theme';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  // 初始化默认管理员账号
  useEffect(() => {
    const usersJson = localStorage.getItem('uav_drone_sim_users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // 检查admin账号是否已存在
    const adminExists = users.some((user: any) => user.username === 'admin');
    
    if (!adminExists) {
      // 创建admin账号
      const adminUser = {
        id: uuidv4(),
        username: 'admin',
        password: 'wushaotao2251823',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=admin',
        createdAt: new Date().toISOString()
      };
      
      // 保存到本地存储
      localStorage.setItem('uav_drone_sim_users', JSON.stringify([...users, adminUser]));
    }
  }, []);
  
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 需要登录的路由 */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<ProjectList />} />
          <Route path="/editor/:projectId" element={<Editor />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
};

export default App; 