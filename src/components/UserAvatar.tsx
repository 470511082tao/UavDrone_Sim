import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface UserAvatarProps {
  username: string;
  avatar?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ username, avatar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <AvatarContainer ref={dropdownRef}>
      <AvatarButton onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        {avatar ? (
          <AvatarImage src={avatar} alt={username} />
        ) : (
          <DefaultAvatar>{username.charAt(0).toUpperCase()}</DefaultAvatar>
        )}
      </AvatarButton>
      
      {isDropdownOpen && (
        <Dropdown>
          <UserInfo>
            <UserName>{username}</UserName>
          </UserInfo>
          <Divider />
          <DropdownItem onClick={() => navigate('/')}>我的项目</DropdownItem>
          <DropdownItem onClick={handleLogout}>退出登录</DropdownItem>
        </Dropdown>
      )}
    </AvatarContainer>
  );
};

const AvatarContainer = styled.div`
  position: relative;
  z-index: 1000;
`;

const AvatarButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background-color: #2a4b6c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  width: 180px;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const UserInfo = styled.div`
  padding: 16px;
  background-color: #f5f7fa;
  text-align: center;
`;

const UserName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #333;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 0;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: none;
  border: none;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;

export default UserAvatar; 