import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 简单验证
    if (!username.trim() || !password.trim()) {
      setError('用户名和密码不能为空');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    // 从本地存储获取用户
    const usersJson = localStorage.getItem('uav_drone_sim_users');
    const users: User[] = usersJson ? JSON.parse(usersJson) : [];

    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
      setError('用户名已存在');
      setLoading(false);
      return;
    }

    // 创建新用户
    const newUser: User = {
      id: uuidv4(),
      username,
      password,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
      createdAt: new Date().toISOString()
    };

    // 保存用户
    const updatedUsers = [...users, newUser];
    localStorage.setItem('uav_drone_sim_users', JSON.stringify(updatedUsers));

    // 注册成功后自动登录
    const userInfo = {
      id: newUser.id,
      username: newUser.username,
      avatar: newUser.avatar
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    setLoading(false);
    navigate('/');
  };

  return (
    <PageContainer>
      <RegisterContainer>
        <LogoSection>
          <LogoTitle>低空经济仿真平台</LogoTitle>
          <LogoSubtitle>UAV Docking Simulation</LogoSubtitle>
        </LogoSection>
        
        <FormContainer>
          <FormTitle>用户注册</FormTitle>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Form onSubmit={handleRegister}>
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
            
            <FormGroup>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
              />
            </FormGroup>
            
            <SubmitButton type="submit" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </SubmitButton>
          </Form>
          
          <LoginLink>
            已有账号？<Link to="/login">登录</Link>
          </LoginLink>
        </FormContainer>
      </RegisterContainer>
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

const RegisterContainer = styled.div`
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

const LoginLink = styled.p`
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

export default Register; 