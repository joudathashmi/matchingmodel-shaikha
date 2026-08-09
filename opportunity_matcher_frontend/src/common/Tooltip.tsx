import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
}

const TooltipContainer = styled.div`
  display: inline-block;
`;

const TooltipBubble = styled.div<{ x: number; y: number; $visible: boolean }>`
  position: fixed;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;

  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s ease-in;

  top: ${({ y }) => y - 20}px;   /* cursor ku mela */
  left: ${({ x }) => x + 12}px;  /* cursor ku pakkathula */
`;

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setCoords({ x: e.clientX, y: e.clientY });
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <TooltipContainer
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <TooltipBubble x={coords.x} y={coords.y} $visible={isVisible}>
          {content}
        </TooltipBubble>
      )}
    </TooltipContainer>
  );
};


export default Tooltip;