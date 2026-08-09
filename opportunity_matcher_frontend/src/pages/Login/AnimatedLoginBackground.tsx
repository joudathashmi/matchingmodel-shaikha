import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

// Keyframes for animations (no changes needed here)
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
`;

const dataFlow = keyframes`
  0% { 
    background-position: -100% 0;
    opacity: 0.1;
  }
  50% { 
    background-position: 200% 0;
    opacity: 0.6;
  }
  100% { 
    background-position: -100% 0;
    opacity: 0.1;
  }
`;

const particleMove = keyframes`
  0% { transform: translateX(0) translateY(0) scale(0); opacity: 0; }
  10% { transform: scale(1); opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(100vw) translateY(0) scale(0); opacity: 0; }
`;

const gridShift = keyframes`
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
`;

const floatData = keyframes`
  0% { transform: translateY(100vh) translateX(0); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { transform: translateY(-100px) translateX(50px); opacity: 0; }
`;

const matchSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const connectionPulse = keyframes`
  0% { 
    transform: scale(1);
    box-shadow: 0 0 5px #0088ff;
  }
  50% { 
    transform: scale(2);
    box-shadow: 0 0 20px #0088ff, 0 0 30px #0088ff;
  }
  100% { 
    transform: scale(1);
    box-shadow: 0 0 5px #0088ff;
  }
`;

const waveExpand = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

const hoverPulse = keyframes`
  0% { 
    opacity: 0;
    transform: scale(0.5);
  }
  100% { 
    opacity: 0.8;
    transform: scale(1);
  }
`;

const trailFade = keyframes`
  0% { 
    opacity: 1;
    transform: scale(1);
  }
  100% { 
    opacity: 0;
    transform: scale(0.2);
  }
`;

const magnetPulse = keyframes`
  0%, 100% { 
    opacity: 0.3;
    transform: scale(1);
  }
  50% { 
    opacity: 0.6;
    transform: scale(1.1);
  }
`;

const particleBob = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
`;

// Styled components for the animated background
const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0f1c 0%, #1a1f2e 50%, #2a2f3e 100%);
  overflow: hidden;
  z-index: -1;
  cursor: crosshair;
`;

const GridOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 255, 136, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: ${gridShift} 20s infinite linear;
  z-index: 1;
`;

const NetworkContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`;

interface NetworkNodeProps {
  x: number;
  y: number;
  type: 'normal' | 'large' | 'hub';
  delay: number;
}

const NetworkNode = styled.div.attrs<NetworkNodeProps>((props) => ({
  style: {
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<NetworkNodeProps>`
  position: absolute;
  width: ${props => props.type === 'hub' ? '16px' : props.type === 'large' ? '12px' : '8px'};
  height: ${props => props.type === 'hub' ? '16px' : props.type === 'large' ? '12px' : '8px'};
  border-radius: 50%;
  background: ${props => {
    if (props.type === 'hub') return 'radial-gradient(circle, #0088ff 0%, #0066cc 100%)';
    if (props.type === 'large') return 'radial-gradient(circle, #ff6b00 0%, #cc5500 100%)';
    return 'radial-gradient(circle, #00ff88 0%, #00cc66 100%)';
  }};
  box-shadow: ${props => {
    if (props.type === 'hub') return '0 0 20px #0088ff, 0 0 40px #0088ff';
    if (props.type === 'large') return '0 0 15px #ff6b00, 0 0 30px #ff6b00';
    return '0 0 10px #00ff88, 0 0 20px #00ff88';
  }};
  animation: ${pulse} 2s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
  cursor: grab;
  transition: all 0.3s ease;
  transform: translateZ(0);
  will-change: transform;
  
  &:hover {
    transform: scale(1.5);
    z-index: 5;
    cursor: grab;
  }
`;

interface ConnectionLineProps {
  x: number;
  y: number;
  length: number;
  angle: number;
  delay: number;
}

const ConnectionLine = styled.div.attrs<ConnectionLineProps>((props) => ({
  style: {
    width: `${props.length}px`,
    transform: `rotate(${props.angle}rad)`,
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<ConnectionLineProps>`
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00ff88, transparent);
  background-size: 200% 100%;
  opacity: 0.3;
  animation: ${dataFlow} 3s infinite linear;
  animation-delay: ${props => props.delay}s;
  transform-origin: 0 50%;
  pointer-events: none;
`;

interface DataParticleProps {
  x: number;
  y: number;
  delay: number;
}

const DataParticle = styled.div.attrs<DataParticleProps>((props) => ({
  style: {
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<DataParticleProps>`
  position: absolute;
  width: 3px;
  height: 3px;
  background: #00ff88;
  border-radius: 50%;
  box-shadow: 0 0 5px #00ff88;
  animation: ${particleMove} 4s infinite linear;
  animation-delay: ${props => props.delay}s;
  pointer-events: none;
`;

interface FloatingDataProps {
  x: number;
  delay: number;
}

const FloatingData = styled.div.attrs<FloatingDataProps>((props) => ({
  style: {
    left: `${props.x}px`,
  },
}))<FloatingDataProps>`
  position: absolute;
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  opacity: 0.4;
  animation: ${floatData} 15s infinite linear;
  animation-delay: ${props => props.delay}s;
  pointer-events: none;
  z-index: 1;
`;

interface MatchIndicatorProps {
  x: number;
  y: number;
  delay: number;
}

const MatchIndicator = styled.div.attrs<MatchIndicatorProps>((props) => ({
  style: {
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<MatchIndicatorProps>`
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #ff6b00;
  border-radius: 50%;
  border-top-color: transparent;
  border-right-color: transparent;
  animation: ${matchSpin} 2s infinite linear;
  animation-delay: ${props => props.delay}s;
  z-index: 1;
  pointer-events: none;
`;

interface ConnectionPulseProps {
  x: number;
  y: number;
  delay: number;
}

const ConnectionPulse = styled.div.attrs<ConnectionPulseProps>((props) => ({
  style: {
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<ConnectionPulseProps>`
  position: absolute;
  width: 4px;
  height: 4px;
  background: #0088ff;
  border-radius: 50%;
  animation: ${connectionPulse} 2s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
  z-index: 1;
  pointer-events: none;
`;

interface IntelligenceWaveProps {
  x: number;
  y: number;
}

const IntelligenceWave = styled.div.attrs<IntelligenceWaveProps>((props) => ({
  style: {
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<IntelligenceWaveProps>`
  position: absolute;
  width: 200px;
  height: 200px;
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 50%;
  animation: ${waveExpand} 4s infinite ease-out;
  z-index: 1;
  pointer-events: none;
`;

interface HoverConnectionProps {
  x: number;
  y: number;
  length: number;
  angle: number;
}

const HoverConnection = styled.div.attrs<HoverConnectionProps>((props) => ({
  style: {
    width: `${props.length}px`,
    transform: `rotate(${props.angle}rad)`,
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<HoverConnectionProps>`
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ffff, transparent);
  opacity: 0.8;
  z-index: 3;
  pointer-events: none;
  animation: ${hoverPulse} 0.5s ease-out;
  transform-origin: 0 50%;
`;

interface MouseTrailProps {
  x: number;
  y: number;
}

const MouseTrail = styled.div.attrs<MouseTrailProps>((props) => ({
  style: {
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<MouseTrailProps>`
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #00ffff 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  animation: ${trailFade} 1s ease-out forwards;
`;

interface MouseMagnetAreaProps {
  x: number;
  y: number;
}

const MouseMagnetArea = styled.div.attrs<MouseMagnetAreaProps>((props) => ({
  style: {
    left: `${props.x - 50}px`,
    top: `${props.y - 50}px`,
  },
}))<MouseMagnetAreaProps>`
  position: absolute;
  width: 100px;
  height: 100px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  animation: ${magnetPulse} 2s infinite ease-in-out;
`;

interface InteractiveParticleProps {
  x: number;
  y: number;
  delay: number;
}

const InteractiveParticle = styled.div.attrs<InteractiveParticleProps>((props) => ({
  style: {
    left: `${props.x}px`,
    top: `${props.y}px`,
  },
}))<InteractiveParticleProps>`
  position: absolute;
  width: 4px;
  height: 4px;
  background: #00ffff;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
  box-shadow: 0 0 10px #00ffff;
  animation: ${particleBob} 1s ease-in-out infinite alternate;
  animation-delay: ${props => props.delay}s;
`;

// Global styles for the body to ensure no scrollbars
const GlobalStyle = createGlobalStyle`
  body {
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
`;

// Throttle function to limit execution rate
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    if (!inThrottle) {
      const result = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      return result;
    }
  } as T;
}

// Check if device is likely low performance
const isLowPerformanceDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
};
// Simplified background for low performance devices
const SimplifiedBackground = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f2e 50%, #2a2f3e 100%)',
    zIndex: -1
  }} />
);

interface Node {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'large' | 'hub';
}

interface Connection {
  id: number;
  node1: Node;
  node2: Node;
  length: number;
  angle: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

interface FloatingText {
  id: number;
  x: number;
  text: string;
}

interface HoverConnectionData {
  x: number;
  y: number;
  length: number;
  angle: number;
}

// Create separate components for elements that don't need to re-render on mouse move
const StaticNetworkElements = React.memo(({ 
  connections, 
  nodes, 
  particles, 
  floatingTexts, 
  matchIndicators, 
  connectionPulses, 
  intelligenceWaves 
}: {
  connections: Connection[];
  nodes: Node[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  matchIndicators: Particle[];
  connectionPulses: Particle[];
  intelligenceWaves: Particle[];
}) => {
  return (
    <>
      {/* Render connections */}
      {connections.map(conn => (
        <ConnectionLine
          key={conn.id}
          x={conn.node1.x}
          y={conn.node1.y}
          length={conn.length}
          angle={conn.angle}
          delay={Math.random() * 3}
        />
      ))}
      
      {/* Render nodes */}
      {nodes.map(node => (
        <NetworkNode
          key={node.id}
          x={node.x}
          y={node.y}
          type={node.type}
          delay={Math.random() * 2}
        />
      ))}
      
      {/* Render particles */}
      {particles.map(particle => (
        <DataParticle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          delay={Math.random() * 4}
        />
      ))}
      
      {/* Render floating texts */}
      {floatingTexts.map(text => (
        <FloatingData
          key={text.id}
          x={text.x}
          delay={Math.random() * 15}
        >
          {text.text}
        </FloatingData>
      ))}
      
      {/* Render match indicators */}
      {matchIndicators.map(indicator => (
        <MatchIndicator
          key={indicator.id}
          x={indicator.x}
          y={indicator.y}
          delay={Math.random() * 2}
        />
      ))}
      
      {/* Render connection pulses */}
      {connectionPulses.map(pulse => (
        <ConnectionPulse
          key={pulse.id}
          x={pulse.x}
          y={pulse.y}
          delay={Math.random() * 2}
        />
      ))}
      
      {/* Render intelligence waves */}
      {intelligenceWaves.map(wave => (
        <IntelligenceWave
          key={wave.id}
          x={wave.x}
          y={wave.y}
        />
      ))}
    </>
  );
});

// Create separate component for interactive elements that update on mouse move
const InteractiveElements = React.memo(({ 
  hoverConnections, 
  mouseTrails, 
  magnetAreas, 
  interactiveParticles 
}: {
  hoverConnections: HoverConnectionData[];
  mouseTrails: Particle[];
  magnetAreas: Particle[];
  interactiveParticles: Particle[];
}) => {
  return (
    <>
      {/* Render hover connections */}
      {hoverConnections.map((conn, index) => (
        <HoverConnection
          key={index}
          x={conn.x}
          y={conn.y}
          length={conn.length}
          angle={conn.angle}
        />
      ))}
      
      {/* Render mouse trails */}
      {mouseTrails.map(trail => (
        <MouseTrail
          key={trail.id}
          x={trail.x}
          y={trail.y}
        />
      ))}
      
      {/* Render magnet areas */}
      {magnetAreas.map(area => (
        <MouseMagnetArea
          key={area.id}
          x={area.x}
          y={area.y}
        />
      ))}
      
      {/* Render interactive particles */}
      {interactiveParticles.map(particle => (
        <InteractiveParticle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          delay={Math.random() * 1}
        />
      ))}
    </>
  );
});

const AnimatedLoginBackground: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [matchIndicators, setMatchIndicators] = useState<Particle[]>([]);
  const [connectionPulses, setConnectionPulses] = useState<Particle[]>([]);
  const [intelligenceWaves, setIntelligenceWaves] = useState<Particle[]>([]);
  const [hoverConnections, setHoverConnections] = useState<HoverConnectionData[]>([]);
  const [mouseTrails, setMouseTrails] = useState<Particle[]>([]);
  const [magnetAreas, setMagnetAreas] = useState<Particle[]>([]);
  const [interactiveParticles, setInteractiveParticles] = useState<Particle[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [useSimpleBackground, setUseSimpleBackground] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTrailTimeRef = useRef<number>(0);
  const lastHoverCheckTimeRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef<Node | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    nodesRef.current = nodes;
    isDraggingRef.current = isDragging;
    draggedNodeRef.current = draggedNode;
  }, [nodes, isDragging, draggedNode]);

  // Data texts for floating elements
  const dataTexts = useMemo(() => [
    'AI', 'ML', 'DATA', 'MATCH', '01010', 'SYNC', 'LINK', 'CONNECT', 
    'Match Making', 'AI Decision', 'Human in the Loop', 'RHQ Companies', 'Opportunities'
  ], []);

  // Initialize the network
  useEffect(() => {
    // Check if we should use simple background
    if (isLowPerformanceDevice()) {
      setUseSimpleBackground(true);
      return;
    }
    
    const initNetwork = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Create nodes (reduced count for performance)
      const newNodes: Node[] = [];
      const nodeCount = 15; // Reduced from 25
      
      for (let i = 0; i < nodeCount; i++) {
        let type: 'normal' | 'large' | 'hub' = 'normal';
        if (i % 7 === 0) type = 'hub';
        else if (i % 3 === 0) type = 'large';
        
        newNodes.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          type,
        });
      }
      
      setNodes(newNodes);
      nodesRef.current = newNodes;
      
      // Create connections
      const newConnections: Connection[] = [];
      let connectionId = 0;
      
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const distance = Math.sqrt(
            Math.pow(newNodes[i].x - newNodes[j].x, 2) + 
            Math.pow(newNodes[i].y - newNodes[j].y, 2)
          );
          
          if (distance < 200 && Math.random() > 0.5) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const angle = Math.atan2(dy, dx);
            
            newConnections.push({
              id: connectionId++,
              node1: newNodes[i],
              node2: newNodes[j],
              length: distance,
              angle: angle
            });
          }
        }
      }
      
      setConnections(newConnections);
      
      // Create match indicators (reduced count)
      const newMatchIndicators: Particle[] = [];
      for (let i = 0; i < 3; i++) { // Reduced from 5
        newMatchIndicators.push({
          id: i,
          x: Math.random() * (width - 20),
          y: Math.random() * (height - 20)
        });
      }
      setMatchIndicators(newMatchIndicators);
      
      // Create connection pulses (reduced count)
      const newConnectionPulses: Particle[] = [];
      for (let i = 0; i < 5; i++) { // Reduced from 8
        newConnectionPulses.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height
        });
      }
      setConnectionPulses(newConnectionPulses);
      
      // Create initial intelligence waves
      const newIntelligenceWaves: Particle[] = [];
      for (let i = 0; i < 2; i++) { // Reduced from 3
        newIntelligenceWaves.push({
          id: i,
          x: Math.random() * (width - 200),
          y: Math.random() * (height - 200)
        });
      }
      setIntelligenceWaves(newIntelligenceWaves);
    };
    
    initNetwork();
    
    // Set up intervals for creating particles and floating texts
    const particleInterval = setInterval(() => {
      if (!containerRef.current) return;
      
      const height = containerRef.current.clientHeight;
      const newParticles: Particle[] = [];
      
      // Reduced particle count
      for (let i = 0; i < 1; i++) { // Reduced from 3
        newParticles.push({
          id: Date.now() + i,
          x: -10,
          y: Math.random() * height
        });
      }
      
      setParticles(prev => [...prev, ...newParticles]);
      
      // Remove particles after animation completes
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
      }, 4000);
    }, 1500); // Increased interval from 1000ms
    
    const textInterval = setInterval(() => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const newText = {
        id: Date.now(),
        x: Math.random() * width,
        text: dataTexts[Math.floor(Math.random() * dataTexts.length)]
      };
      
      setFloatingTexts(prev => [...prev, newText]);
      
      // Remove text after animation completes
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
      }, 15000);
    }, 6000); // Increased interval from 4000ms
    
    const waveInterval = setInterval(() => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const newWave = {
        id: Date.now(),
        x: Math.random() * (width - 200),
        y: Math.random() * (height - 200)
      };
      
      setIntelligenceWaves(prev => [...prev, newWave]);
      
      // Remove wave after animation completes
      setTimeout(() => {
        setIntelligenceWaves(prev => prev.filter(w => w.id !== newWave.id));
      }, 4000);
    }, 8000); // Increased interval from 6000ms
    
    // Clean up intervals on unmount
    return () => {
      clearInterval(particleInterval);
      clearInterval(textInterval);
      clearInterval(waveInterval);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [dataTexts]);
  
  // Throttled mouse movement handling
  const throttledMouseMove = useCallback(throttle((e: MouseEvent) => {
    // Create mouse trail with time-based throttling instead of random
    const now = Date.now();
    if (now - lastTrailTimeRef.current > 100) { // Limit to 10 trails per second max
      setMouseTrails(prev => [...prev, {
        id: now,
        x: e.clientX - 3,
        y: e.clientY - 3
      }]);
      
      lastTrailTimeRef.current = now;
      
      // Remove trail after animation completes
      setTimeout(() => {
        setMouseTrails(prev => prev.filter(t => t.id !== now));
      }, 1000);
    }
    
    // Handle dragging
    if (isDraggingRef.current && draggedNodeRef.current) {
      const updatedNodes = nodesRef.current.map(node => {
        if (node.id === draggedNodeRef.current!.id) {
          return {
            ...node,
            x: e.clientX,
            y: e.clientY
          };
        }
        return node;
      });
      
      setNodes(updatedNodes);
      nodesRef.current = updatedNodes;
    }
    
    // Check for hover connections with time-based throttling
    if (!isDraggingRef.current && now - lastHoverCheckTimeRef.current > 200) {
      const nearbyNodes = nodesRef.current.filter(node => {
        const distance = Math.sqrt(
          Math.pow(node.x - e.clientX, 2) + 
          Math.pow(node.y - e.clientY, 2)
        );
        return distance < 150;
      });
      
      const newHoverConnections: HoverConnectionData[] = [];
      
      nearbyNodes.forEach((node, i) => {
        if (nearbyNodes.length > 1 && i < nearbyNodes.length - 1) {
          const nextNode = nearbyNodes[i + 1];
          const dx = nextNode.x - node.x;
          const dy = nextNode.y - node.y;
          const angle = Math.atan2(dy, dx);
          const length = Math.sqrt(dx * dx + dy * dy);
          
          newHoverConnections.push({
            x: node.x,
            y: node.y,
            length,
            angle
          });
        }
        
        // Connect to mouse position
        if (Math.sqrt(Math.pow(node.x - e.clientX, 2) + Math.pow(node.y - e.clientY, 2)) < 100) {
          const dx = e.clientX - node.x;
          const dy = e.clientY - node.y;
          const angle = Math.atan2(dy, dx);
          const length = Math.sqrt(dx * dx + dy * dy);
          
          newHoverConnections.push({
            x: node.x,
            y: node.y,
            length,
            angle
          });
        }
      });
      
      setHoverConnections(newHoverConnections);
      
      // Auto-remove after animation
      setTimeout(() => {
        setHoverConnections([]);
      }, 500);
      
      lastHoverCheckTimeRef.current = now;
    }
  }, 50), []); // Empty dependency array since we're using refs

  // Mouse movement effect
  useEffect(() => {
    window.addEventListener('mousemove', throttledMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [throttledMouseMove]);
  
  // Mouse up handler to stop dragging
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        setDraggedNode(null);
        draggedNodeRef.current = null;
      }
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Handle node interactions
  const handleNodeMouseDown = useCallback((node: Node, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    setDraggedNode(node);
    draggedNodeRef.current = node;
  }, []);
  
  const handleNodeMouseEnter = useCallback((node: Node) => {
    // Create magnet area
    setMagnetAreas(prev => [...prev, {
      id: Date.now(),
      x: node.x,
      y: node.y
    }]);
    
    // Remove magnet area after animation
    setTimeout(() => {
      setMagnetAreas(prev => prev.filter(m => m.id !== Date.now()));
    }, 2000);
    
    // Create interactive particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 2; i++) { // Reduced from 3
      newParticles.push({
        id: Date.now() + i,
        x: node.x,
        y: node.y
      });
    }
    setInteractiveParticles(prev => [...prev, ...newParticles]);
    
    // Remove particles after animation
    setTimeout(() => {
      setInteractiveParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 2000);
  }, []);
  
  const handleNodeClick = useCallback((node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isDraggingRef.current) {
      // Create click wave
      setIntelligenceWaves(prev => [...prev, {
        id: Date.now(),
        x: node.x - 100,
        y: node.y - 100
      }]);
      
      // Remove wave after animation
      setTimeout(() => {
        setIntelligenceWaves(prev => prev.filter(w => w.id !== Date.now()));
      }, 1000);
    }
  }, []);

  // Use simplified background for low performance devices
  if (useSimpleBackground) {
    return <SimplifiedBackground />;
  }

  return (
    <>
      <GlobalStyle />
      <BackgroundContainer ref={containerRef}>
        <GridOverlay />
        <NetworkContainer>
          <StaticNetworkElements
            connections={connections}
            nodes={nodes}
            particles={particles}
            floatingTexts={floatingTexts}
            matchIndicators={matchIndicators}
            connectionPulses={connectionPulses}
            intelligenceWaves={intelligenceWaves}
          />
          
          <InteractiveElements
            hoverConnections={hoverConnections}
            mouseTrails={mouseTrails}
            magnetAreas={magnetAreas}
            interactiveParticles={interactiveParticles}
          />
          
          {/* Render nodes with event handlers separately */}
          {nodes.map(node => (
            <div
              key={`handler-${node.id}`}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: node.type === 'hub' ? '16px' : node.type === 'large' ? '12px' : '8px',
                height: node.type === 'hub' ? '16px' : node.type === 'large' ? '12px' : '8px',
                cursor: 'grab',
                zIndex: 2
              }}
              onMouseDown={(e) => handleNodeMouseDown(node, e)}
              onMouseEnter={() => handleNodeMouseEnter(node)}
              onClick={(e) => handleNodeClick(node, e)}
            />
          ))}
        </NetworkContainer>
      </BackgroundContainer>
    </>
  );
};

export default AnimatedLoginBackground;