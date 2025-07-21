import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface PrivateRouteProps {
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ redirectTo = '/login' }) => {
  // 检查用户是否已登录
  const isAuthenticated = !!localStorage.getItem('currentUser');
  
  // 如果已登录，渲染子路由，否则重定向到登录页
  return isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} />;
};

export default PrivateRoute; 