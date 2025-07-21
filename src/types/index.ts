// 项目类型定义
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  userId?: string; // 添加关联用户ID
}

// 用户类型定义
export interface User {
  id: string;
  username: string;
  password: string; // 在实际项目中应该是加密存储的
  avatar?: string;
  createdAt: string;
}

// 无人机类型定义
export interface Drone {
  id: string;
  model: string;
  position: [number, number, number]; // x, y, z
  rotation: [number, number, number]; // x, y, z
  scale: [number, number, number]; // width, height, depth
}

// 无人机接驳柜类型定义
export interface DockingStation {
  id: string;
  model: string;
  position: [number, number, number]; // x, y, z
  rotation: [number, number, number]; // x, y, z
  scale: [number, number, number]; // width, height, depth
}

// 动画关键帧类型定义
export interface KeyFrame {
  time: number; // 时间点（秒）
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  action?: string; // 特殊动作，如"降落"、"起飞"、"对接"等
}

// 动画轨迹类型定义
export interface Animation {
  id: string;
  objectId: string; // 关联的对象ID（无人机或接驳柜）
  keyFrames: KeyFrame[];
} 