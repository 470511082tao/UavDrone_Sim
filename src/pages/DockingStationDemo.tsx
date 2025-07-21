import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import DockingStationModel from '../models/DockingStationModel';
import LiftControlPanel from '../components/LiftControlPanel';

const DockingStationDemo: React.FC = () => {
  const [liftPosition, setLiftPosition] = useState(1); // 默认升降板在顶部

  const handleLiftPositionChange = (position: number) => {
    setLiftPosition(position);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', backgroundColor: '#f0f2f5' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>无人机接驳柜演示</h1>
        <p style={{ color: '#7f8c8d' }}>展示带有可上下移动升降板的接驳柜模型</p>
        <LiftControlPanel 
          onLiftPositionChange={handleLiftPositionChange} 
          initialPosition={liftPosition}
        />
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          shadows
          camera={{ position: [8, 5, 8], fov: 50 }}
          style={{ background: 'linear-gradient(to bottom, #87CEEB, #E0F7FA)' }}
        >
          {/* 环境光 */}
          <ambientLight intensity={0.5} />
          
          {/* 主光源 */}
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          {/* 次光源 - 补光 */}
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />
          
          {/* 地面 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          
          {/* 接驳柜模型 */}
          <DockingStationModel 
            liftPosition={liftPosition} 
            position={[0, 0, 0]} 
            rotation={[0, 0, 0]}
          />
          
          {/* 环境和控制 */}
          <Environment preset="city" />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={20}
          />
        </Canvas>
        
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          right: '20px', 
          background: 'rgba(255,255,255,0.7)',
          padding: '10px',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            当前升降板位置: {Math.round(liftPosition * 100)}%
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
            {liftPosition > 0.9 ? '顶部位置' : liftPosition < 0.1 ? '底部位置' : '中间位置'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DockingStationDemo; 