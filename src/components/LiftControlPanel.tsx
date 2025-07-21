import React, { useState } from 'react';

interface LiftControlPanelProps {
  onLiftPositionChange: (position: number) => void;
  initialPosition?: number;
}

const styles = {
  panel: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    margin: '16px 0',
    maxWidth: '400px'
  },
  heading: {
    marginTop: 0,
    marginBottom: '16px',
    color: '#2c3e50'
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  },
  label: {
    width: '120px',
    fontWeight: 500
  },
  rangeInput: {
    flex: 1,
    margin: '0 10px'
  },
  valueDisplay: {
    width: '50px',
    textAlign: 'right' as const
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonHover: {
    backgroundColor: '#2980b9'
  }
};

const LiftControlPanel: React.FC<LiftControlPanelProps> = ({
  onLiftPositionChange,
  initialPosition = 1
}) => {
  const [liftPosition, setLiftPosition] = useState(initialPosition);
  const [hoverButton1, setHoverButton1] = useState(false);
  const [hoverButton2, setHoverButton2] = useState(false);

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value);
    setLiftPosition(newPosition);
    onLiftPositionChange(newPosition);
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.heading}>升降板控制</h3>
      <div style={styles.controlRow}>
        <label style={styles.label} htmlFor="lift-position">升降板位置：</label>
        <input
          id="lift-position"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={liftPosition}
          onChange={handlePositionChange}
          style={styles.rangeInput}
        />
        <span style={styles.valueDisplay}>{Math.round(liftPosition * 100)}%</span>
      </div>
      <div style={styles.buttonGroup}>
        <button 
          onClick={() => {
            setLiftPosition(1);
            onLiftPositionChange(1);
          }}
          style={{
            ...styles.button,
            ...(hoverButton1 ? styles.buttonHover : {})
          }}
          onMouseEnter={() => setHoverButton1(true)}
          onMouseLeave={() => setHoverButton1(false)}
        >
          顶部位置
        </button>
        <button 
          onClick={() => {
            setLiftPosition(0);
            onLiftPositionChange(0);
          }}
          style={{
            ...styles.button,
            ...(hoverButton2 ? styles.buttonHover : {})
          }}
          onMouseEnter={() => setHoverButton2(true)}
          onMouseLeave={() => setHoverButton2(false)}
        >
          底部位置
        </button>
      </div>
    </div>
  );
};

export default LiftControlPanel; 