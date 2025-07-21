# UavDrone_Sim - 第二代无人机接驳柜仿真系统

基于Three.js和React的无人机仿真编辑器，支持多种项目类型的3D场景编辑和动画模拟。

## 功能特点

### 多项目类型支持
- **低空经济项目**：无人机、接驳站、航点、建筑模型管理
- **智能驿站项目**：货架、建筑模型管理  
- **无人车项目**：待开发功能

### 核心功能
- 3D场景编辑和实时预览
- 多种3D模型添加和交互
- 模型连续添加模式（预览跟随鼠标）
- 模型选择、移动、旋转、缩放
- 模型删除（Delete/Backspace键）
- 蓝色呼吸光圈选中效果
- 项目数据本地持久化
- 统一的UI布局和交互体验

## 技术栈

- **前端框架**：React 18 + TypeScript
- **3D渲染**：Three.js + React Three Fiber + Drei
- **构建工具**：Vite
- **状态管理**：React Hooks + Context
- **样式方案**：CSS Modules + Styled Components
- **数据持久化**：LocalStorage

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

## 使用说明

### 项目管理
1. 在项目列表页面查看所有项目
2. 点击"创建新项目"选择项目类型（低空经济/智能驿站/无人车）
3. 为项目输入名称并确认创建

### 3D场景编辑
1. 进入编辑器后，在左侧工具栏选择要添加的模型类型
2. 点击工具栏按钮进入连续添加模式，模型预览跟随鼠标
3. 在场景中点击位置放置模型，可连续添加多个
4. 按ESC键退出添加模式
5. 点击模型进行选择，选中模型显示蓝色呼吸光圈
6. 使用变换控制器（移动/旋转/缩放）调整模型
7. 按Delete或Backspace键删除选中的模型

### 项目保存
- 所有更改自动保存到本地存储
- 支持跨会话数据持久化

## 3D模型库

### 低空经济项目
- **无人机模型**：四旋翼无人机，支持动画效果
- **接驳站模型**：货物接驳平台
- **航点模型**：飞行路径标记点
- **建筑模型**：10m×10m房间结构

### 智能驿站项目
- **货架模型**：2m×0.5m×2m，4层浅蓝色铁质货架
- **建筑模型**：10m×10m房间，带门窗结构

## 项目架构

```
src/
├── components/
│   ├── common/              # 通用组件
│   │   ├── BaseEditorLayout.tsx    # 编辑器布局基类
│   │   ├── BaseToolbar.tsx         # 工具栏基类
│   │   └── ModelPreview.tsx        # 模型预览组件
│   ├── lowAltitudeEconomy/  # 低空经济项目组件
│   └── smartStation/        # 智能驿站项目组件
├── hooks/
│   ├── useBaseEditor.ts     # 编辑器状态管理
│   └── useSceneData.ts      # 场景数据管理
├── models/                  # 3D模型组件
│   ├── DroneModel.tsx
│   ├── DockingStationModel.tsx
│   ├── ShelfModel.tsx
│   └── BuildingModel.tsx
├── pages/                   # 页面组件
│   ├── ProjectList.tsx      # 项目列表
│   ├── LowAltitudeEconomyEditor.tsx
│   └── SmartStationEditor.tsx
├── types/                   # TypeScript类型定义
└── styles/                  # 样式文件
```

## 开发规范

### 代码复用原则
- 通用功能统一抽象到基类组件
- 使用自定义Hooks管理共享状态逻辑
- 避免不同项目类型重复实现相同功能

### 组件设计原则
- 基于组合模式构建复杂UI
- 使用TypeScript确保类型安全
- 遵循React最佳实践（Hooks、函数组件）

## 许可证

MIT License
