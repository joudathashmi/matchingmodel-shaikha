import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

// Define the fadeIn animation
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Define TooltipProps interface
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

// Define TooltipContainer styled component
const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

// Create a new TooltipBubble variant for heatmap
const HeatmapTooltipBubble = styled.div<{ position: string }>`
  position: absolute;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  border-radius: 8px;
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 9999;
  animation: ${fadeIn} 0.15s ease-in;
  pointer-events: none;
  
  /* Position above the cell */
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  
  /* Ensure visibility */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  &::after {
    content: '';
    position: absolute;
    border: 6px solid transparent;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: rgba(0, 0, 0, 0.95);
  }
`;

// Create a specialized HeatmapTooltip component
export const HeatmapTooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = "top"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    timeoutRef.current = setTimeout(() => setIsVisible(true), 100);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }} // Key change for heatmap
    >
      {children}
      {isVisible && (
        <HeatmapTooltipBubble position={position}>
          {content}
        </HeatmapTooltipBubble>
      )}
    </TooltipContainer>
  );
};

export default HeatmapTooltip;