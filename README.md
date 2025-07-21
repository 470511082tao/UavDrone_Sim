# 无人机仿真编辑器 (UAV Drone Simulation Editor)

基于Three.js和React的无人机仿真动画编辑器，用于创建无人机和接驳柜的动画模拟。

## 功能特点

- 3D场景编辑和预览
- 无人机和接驳柜对象管理
- 动画关键帧编辑
- 动画时间线控制
- 本地存储项目数据

## 技术栈

- React
- TypeScript
- Three.js
- React Three Fiber / Drei
- Styled Components
- Vite

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

1. 首页可查看项目列表，点击"创建新项目"按钮创建项目。
2. 进入编辑器页面后，可以在左侧添加无人机或接驳柜对象。
3. 选中对象后，可以在右侧属性面板编辑对象的位置、旋转和缩放等属性。
4. 在底部时间线面板上可以添加、编辑和删除关键帧。
5. 使用顶部的播放控制器预览动画效果。
6. 完成编辑后点击"保存"按钮保存项目。

## 项目结构

```
src/
├── components/       # 组件文件夹
│   ├── Scene.tsx     # 3D场景组件
│   ├── ObjectsPanel.tsx  # 对象面板组件
│   ├── AnimationPanel.tsx # 动画面板组件
│   ├── TimelinePanel.tsx  # 时间线面板组件
│   ├── PropertiesPanel.tsx # 属性面板组件
│   └── Toolbar.tsx   # 工具栏组件
├── pages/            # 页面组件
│   ├── ProjectList.tsx # 项目列表页
│   └── Editor.tsx    # 编辑器页面
├── styles/           # 样式文件
│   ├── index.css     # 全局样式
│   └── theme.ts      # 主题定义
├── types/            # 类型定义
│   └── index.ts      # 数据类型定义
├── App.tsx           # 应用入口组件
└── main.tsx          # 应用入口文件
```

## 许可证

MIT 