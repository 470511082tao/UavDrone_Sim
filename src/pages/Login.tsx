import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { User } from '../types';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 检查是否已登录
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 简单验证
    if (!username.trim() || !password.trim()) {
      setError('用户名和密码不能为空');
      setLoading(false);
      return;
    }

    // 从本地存储获取用户
    const usersJson = localStorage.getItem('uav_drone_sim_users');
    const users: User[] = usersJson ? JSON.parse(usersJson) : [];

    // 查找用户
    const user = users.find(u => u.username === username);
    
    if (!user) {
      setError('用户不存在');
      setLoading(false);
      return;
    }

    // 检查密码
    if (user.password !== password) {
      setError('密码错误');
      setLoading(false);
      return;
    }

    // 登录成功，存储用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    setLoading(false);
    navigate('/');
  };

  return (
    <PageContainer>
      <LoginContainer>
        <LogoSection>
          <LogoTitle>低空经济仿真平台</LogoTitle>
          <LogoSubtitle>UAV Docking Simulation</LogoSubtitle>
        </LogoSection>
        
        <FormContainer>
          <FormTitle>用户登录</FormTitle>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Form onSubmit={handleLogin}>
            <FormGroup>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </FormGroup>
            
            <SubmitButton type="submit" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </SubmitButton>
          </Form>
          
          <RegisterLink>
            没有账号？<Link to="/register">注册</Link>
          </RegisterLink>
        </FormContainer>
      </LoginContainer>
    </PageContainer>
  );
};

// 样式组件
const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f8fa;
  padding: 20px;
`;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const LogoSection = styled.div`
  padding: 30px 20px;
  background-color: #4b9cd3;
  color: white;
  text-align: center;
`;

const LogoTitle = styled.h1`
  font-size: 24px;
  margin: 0;
  font-weight: 600;
`;

const LogoSubtitle = styled.p`
  font-size: 14px;
  margin: 5px 0 0 0;
  opacity: 0.8;
`;

const FormContainer = styled.div`
  padding: 30px;
`;

const FormTitle = styled.h2`
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  
  &:focus {
    border-color: #4b9cd3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(75, 156, 211, 0.1);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #4b9cd3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #3a8bc2;
  }
  
  &:disabled {
    background-color: #a7caea;
    cursor: not-allowed;
  }
`;

const RegisterLink = styled.p`
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  
  a {
    color: #4b9cd3;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: #fff2f0;
  color: #f56c6c;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #fde2e2;
`;

export default Login; 